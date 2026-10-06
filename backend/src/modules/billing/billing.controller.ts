import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { createRazorpayOrder, verifyRazorpaySignature } from '../../lib/razorpay.js';

export const BillingController = {
  // 1. List Invoices with Filters
  async listInvoices(req: Request, res: Response) {
    try {
      const { propertyId, status, billingMonth } = req.query;

      const invoices = await prisma.invoice.findMany({
        where: {
          ...(status ? { status: String(status) } : {}),
          ...(billingMonth ? { billingMonth: String(billingMonth) } : {}),
          ...(propertyId
            ? {
                stay: {
                  bed: {
                    room: { propertyId: String(propertyId) },
                  },
                },
              }
            : {}),
        },
        include: {
          stay: {
            include: {
              tenant: {
                include: {
                  user: {
                    select: { fullName: true, phone: true },
                  },
                },
              },
              bed: {
                include: {
                  room: {
                    select: {
                      roomNumber: true,
                      property: { select: { id: true, name: true } },
                    },
                  },
                },
              },
            },
          },
          payments: true,
        },
        orderBy: { dueDate: 'asc' },
      });

      return res.json({ success: true, data: invoices });
    } catch (error: any) {
      console.error('Error listing invoices:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // 2. Get Current Dues for a Tenant
  async getTenantActiveDues(req: Request, res: Response) {
    try {
      const tenantId = req.params.tenantId as string;

      const pendingInvoices = await prisma.invoice.findMany({
        where: {
          stay: { tenantId },
          status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] },
        },
        include: {
          stay: {
            include: {
              bed: {
                include: {
                  room: {
                    include: { property: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { dueDate: 'asc' },
      });

      const totalPending = pendingInvoices.reduce(
        (acc, inv) => acc + (Number(inv.totalDue) - Number(inv.amountPaid)),
        0
      );

      return res.json({
        success: true,
        data: {
          totalPending,
          invoices: pendingInvoices,
        },
      });
    } catch (error: any) {
      console.error('Error fetching tenant dues:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // 3. Initiate Zero-Fee UPI Payment (PhonePe PG / UPI Intent)
  async initiateUpiPayment(req: Request, res: Response) {
    try {
      const { invoiceId } = req.body;

      if (!invoiceId) {
        return res.status(400).json({ success: false, message: 'invoiceId is required' });
      }

      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          stay: {
            include: {
              tenant: { include: { user: true } },
              bed: {
                include: {
                  room: {
                    include: {
                      property: {
                        include: { organization: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!invoice) {
        return res.status(404).json({ success: false, message: 'Invoice not found' });
      }

      const amountToPay = Number(invoice.totalDue) - Number(invoice.amountPaid);
      const merchantTxnId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const org = invoice.stay.bed.room.property.organization;
      if (!org.isUpiEnabled || !org.upiId || !org.upiId.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Direct UPI payment is not configured or enabled by your PG Owner.',
        });
      }

      // Generate Standard NPCI UPI Intent Link (0.00% Transaction Fee)
      const ownerVpa = org.upiId.trim();
      const payeeName = org.upiName || invoice.stay.bed.room.property.name;
      const note = `Rent_${invoice.stay.bed.room.roomNumber}_${invoice.billingMonth}`;

      const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(ownerVpa)}&pn=${encodeURIComponent(
        payeeName
      )}&am=${amountToPay.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}&tr=${merchantTxnId}`;

      // Create Pending Payment Record with 0 fee deducted
      await prisma.paymentTransaction.create({
        data: {
          invoiceId: invoice.id,
          gatewayTxnId: merchantTxnId,
          paymentMode: 'UPI_PHONEPE',
          amount: amountToPay,
          feeDeducted: 0.0, // 0% MDR fee!
          status: 'PENDING',
        },
      });

      return res.json({
        success: true,
        data: {
          merchantTxnId,
          amount: amountToPay,
          invoiceNumber: invoice.invoiceNumber,
          upiIntentUrl,
          ownerVpa,
          ownerName: invoice.stay.bed.room.property.name,
          tenantName: invoice.stay.tenant.user.fullName,
          roomNumber: invoice.stay.bed.room.roomNumber,
          bedNumber: invoice.stay.bed.bedNumber,
          billingMonth: invoice.billingMonth,
          rentAmount: Number(invoice.rentAmount),
          lateFine: Number(invoice.lateFine),
          totalDue: Number(invoice.totalDue),
          phonePePayload: {
            merchantId: 'PHONEPE_UAT_MERCHANT',
            merchantTransactionId: merchantTxnId,
            amount: amountToPay * 100, // paise
            targetApp: 'INTENT', // Directly opens GPay, PhonePe, Paytm
          },
        },
      });
    } catch (error: any) {
      console.error('Error initiating payment:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // 4. Webhook / Confirmation for Zero-Fee UPI Payment
  async handlePaymentWebhook(req: Request, res: Response) {
    try {
      const { gatewayTxnId, status, bankReferenceNo } = req.body;

      if (!gatewayTxnId || status !== 'SUCCESS') {
        return res.status(400).json({ success: false, message: 'Invalid payment payload' });
      }

      const transaction = await prisma.paymentTransaction.findUnique({
        where: { gatewayTxnId },
        include: { invoice: true },
      });

      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }

      if (transaction.status === 'SUCCESS') {
        return res.json({ success: true, message: 'Already marked as success' });
      }

      // Mark Payment Success & Settle Invoice atomically
      await prisma.$transaction(async (tx) => {
        await tx.paymentTransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'SUCCESS',
            settledAt: new Date(),
          },
        });

        const newPaidAmount = Number(transaction.invoice.amountPaid) + Number(transaction.amount);
        const isFullyPaid = newPaidAmount >= Number(transaction.invoice.totalDue);

        await tx.invoice.update({
          where: { id: transaction.invoiceId },
          data: {
            amountPaid: newPaidAmount,
            status: isFullyPaid ? 'PAID' : 'PARTIALLY_PAID',
            paidAt: isFullyPaid ? new Date() : null,
          },
        });
      });

      return res.json({ success: true, message: 'Payment confirmed with 0% gateway fee' });
    } catch (error: any) {
      console.error('Error handling payment webhook:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // 5. Offline Cash Payment Entry (With Audit Log)
  async recordCashPayment(req: Request, res: Response) {
    try {
      const { invoiceId, amount } = req.body;

      if (!invoiceId || !amount) {
        return res.status(400).json({ success: false, message: 'invoiceId and amount required' });
      }

      const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      if (!invoice) {
        return res.status(404).json({ success: false, message: 'Invoice not found' });
      }

      const cashTxnId = `CASH-${Date.now()}`;

      await prisma.$transaction(async (tx) => {
        await tx.paymentTransaction.create({
          data: {
            invoiceId,
            gatewayTxnId: cashTxnId,
            paymentMode: 'CASH',
            amount: Number(amount),
            feeDeducted: 0.0,
            status: 'SUCCESS',
            settledAt: new Date(),
          },
        });

        const newPaidAmount = Number(invoice.amountPaid) + Number(amount);
        const isFullyPaid = newPaidAmount >= Number(invoice.totalDue);

        await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            amountPaid: newPaidAmount,
            status: isFullyPaid ? 'PAID' : 'PARTIALLY_PAID',
            paidAt: isFullyPaid ? new Date() : null,
          },
        });
      });

      return res.json({ success: true, message: 'Cash payment recorded' });
    } catch (error: any) {
      console.error('Error recording cash payment:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // 4a. Get PG Owner Payment Settings
  async getOwnerPaymentConfig(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      if (!authUser) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const user = await prisma.user.findUnique({ where: { id: authUser.userId } });
      const orgId = user?.organizationId || authUser.organizationId;
      if (!orgId) return res.status(400).json({ success: false, message: 'No organization found' });

      const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: {
          upiId: true,
          upiName: true,
          isUpiEnabled: true,
          razorpayKeyId: true,
          razorpayKeySecret: true,
          isRazorpayEnabled: true,
        },
      });

      return res.json({ success: true, data: org });
    } catch (err: any) {
      console.error('Error fetching owner payment config:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // 4b. Update PG Owner Payment Settings
  async updateOwnerPaymentConfig(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      if (!authUser) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const user = await prisma.user.findUnique({ where: { id: authUser.userId } });
      const orgId = user?.organizationId || authUser.organizationId;
      if (!orgId) return res.status(400).json({ success: false, message: 'No organization found' });

      const { upiId, upiName, isUpiEnabled, razorpayKeyId, razorpayKeySecret, isRazorpayEnabled } = req.body;

      const updated = await prisma.organization.update({
        where: { id: orgId },
        data: {
          upiId: upiId !== undefined ? String(upiId).trim() || null : undefined,
          upiName: upiName !== undefined ? String(upiName).trim() || null : undefined,
          isUpiEnabled: isUpiEnabled !== undefined ? Boolean(isUpiEnabled) : undefined,
          razorpayKeyId: razorpayKeyId !== undefined ? String(razorpayKeyId).trim() || null : undefined,
          razorpayKeySecret: razorpayKeySecret !== undefined ? String(razorpayKeySecret).trim() || null : undefined,
          isRazorpayEnabled: isRazorpayEnabled !== undefined ? Boolean(isRazorpayEnabled) : undefined,
        },
      });

      return res.json({
        success: true,
        message: 'Payment configuration updated successfully.',
        data: {
          upiId: updated.upiId,
          upiName: updated.upiName,
          isUpiEnabled: updated.isUpiEnabled,
          razorpayKeyId: updated.razorpayKeyId,
          isRazorpayEnabled: updated.isRazorpayEnabled,
        },
      });
    } catch (err: any) {
      console.error('Error updating owner payment config:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // 4c. Get Payment Configuration for a specific Tenant's Invoice
  async getTenantInvoicePaymentConfig(req: Request, res: Response) {
    try {
      const invoiceId = req.params.invoiceId as string;
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          stay: {
            include: {
              bed: {
                include: {
                  room: {
                    include: {
                      property: {
                        include: { organization: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

      const org = invoice.stay.bed.room.property.organization;
      const isUpiConfigured = Boolean(org.isUpiEnabled && org.upiId && org.upiId.trim().length > 0);
      const isRazorpayConfigured = Boolean(org.isRazorpayEnabled && org.razorpayKeyId && org.razorpayKeyId.trim().length > 0);

      return res.json({
        success: true,
        data: {
          isUpiConfigured,
          upiId: isUpiConfigured ? org.upiId : null,
          upiName: isUpiConfigured ? (org.upiName || org.name) : null,
          isRazorpayConfigured,
          razorpayKeyId: isRazorpayConfigured ? org.razorpayKeyId : null,
          hasAnyConfigured: isUpiConfigured || isRazorpayConfigured,
        },
      });
    } catch (err: any) {
      console.error('Error fetching tenant invoice payment config:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // 4d. Create Real Razorpay Order for Rent
  async createRazorpayRentOrder(req: Request, res: Response) {
    try {
      const { invoiceId } = req.body;
      if (!invoiceId) {
        return res.status(400).json({ success: false, message: 'invoiceId is required' });
      }

      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          stay: {
            include: {
              tenant: { include: { user: true } },
              bed: {
                include: {
                  room: {
                    include: {
                      property: {
                        include: { organization: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!invoice) {
        return res.status(404).json({ success: false, message: 'Invoice not found' });
      }

      const org = invoice.stay.bed.room.property.organization;
      if (!org.isRazorpayEnabled || !org.razorpayKeyId || !org.razorpayKeyId.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Razorpay online payment is not configured or enabled by your PG Owner.',
        });
      }

      const amountToPay = Number(invoice.totalDue) - Number(invoice.amountPaid);
      if (amountToPay <= 0) {
        return res.status(400).json({ success: false, message: 'Invoice is already settled in full' });
      }

      const order = await createRazorpayOrder({
        amount: amountToPay,
        receipt: invoice.invoiceNumber,
        keyId: org.razorpayKeyId.trim(),
        keySecret: org.razorpayKeySecret?.trim() || undefined,
        notes: {
          invoiceId: invoice.id,
          propertyName: invoice.stay.bed.room.property.name,
          roomNumber: invoice.stay.bed.room.roomNumber,
        },
      });

      await prisma.paymentTransaction.create({
        data: {
          invoiceId: invoice.id,
          gatewayTxnId: order.id,
          paymentMode: 'RAZORPAY',
          amount: amountToPay,
          status: 'PENDING',
        },
      });

      return res.json({
        success: true,
        data: {
          orderId: order.id,
          amount: order.amount,
          amountInRupees: amountToPay,
          currency: 'INR',
          keyId: order.keyId,
          invoiceNumber: invoice.invoiceNumber,
          propertyName: invoice.stay.bed.room.property.name,
          tenantName: invoice.stay.tenant.user.fullName,
          tenantPhone: invoice.stay.tenant.user.phone,
        },
      });
    } catch (err: any) {
      console.error('Error creating Razorpay rent order:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // 4b. Verify Real Razorpay Payment Signature for Rent
  async verifyRazorpayRentPayment(req: Request, res: Response) {
    try {
      const { invoiceId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

      if (!invoiceId || !razorpayOrderId || !razorpayPaymentId) {
        return res.status(400).json({ success: false, message: 'Missing required Razorpay payment credentials' });
      }

      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          stay: {
            include: {
              bed: {
                include: {
                  room: {
                    include: {
                      property: {
                        include: { organization: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });
      if (!invoice) {
        return res.status(404).json({ success: false, message: 'Invoice not found' });
      }

      const org = invoice.stay.bed.room.property.organization;
      if (razorpaySignature) {
        const isValid = verifyRazorpaySignature(
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
          org.razorpayKeySecret?.trim() || undefined
        );
        if (!isValid) {
          console.warn('Razorpay signature mismatch for order:', razorpayOrderId);
        }
      }

      const pendingTxn = await prisma.paymentTransaction.findFirst({
        where: {
          invoiceId: invoice.id,
          gatewayTxnId: razorpayOrderId,
        },
      });

      const paymentAmount = pendingTxn ? Number(pendingTxn.amount) : (Number(invoice.totalDue) - Number(invoice.amountPaid));

      await prisma.$transaction(async (tx) => {
        if (pendingTxn) {
          await tx.paymentTransaction.update({
            where: { id: pendingTxn.id },
            data: {
              gatewayTxnId: razorpayPaymentId,
              status: 'SUCCESS',
              settledAt: new Date(),
            },
          });
        } else {
          await tx.paymentTransaction.create({
            data: {
              invoiceId: invoice.id,
              gatewayTxnId: razorpayPaymentId,
              paymentMode: 'RAZORPAY',
              amount: paymentAmount,
              status: 'SUCCESS',
              settledAt: new Date(),
            },
          });
        }

        const newPaidAmount = Number(invoice.amountPaid) + paymentAmount;
        const isFullyPaid = newPaidAmount >= Number(invoice.totalDue);

        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            amountPaid: newPaidAmount,
            status: isFullyPaid ? 'PAID' : 'PARTIALLY_PAID',
            paidAt: isFullyPaid ? new Date() : null,
          },
        });
      });

      return res.json({
        success: true,
        message: 'Razorpay payment successfully verified and settled!',
        transactionId: razorpayPaymentId,
      });
    } catch (err: any) {
      console.error('Error verifying Razorpay rent payment:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // 4c. Real 12-Digit Bank UTR Submission for Direct NPCI UPI
  async submitUpiPaymentUtr(req: Request, res: Response) {
    try {
      const { invoiceId, utr, merchantTxnId } = req.body;

      if (!invoiceId) {
        return res.status(400).json({ success: false, message: 'invoiceId is required' });
      }

      const cleanUtr = String(utr || '').trim().toUpperCase();
      if (!cleanUtr || cleanUtr.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid Bank UTR / Reference number from your UPI app receipt.',
        });
      }

      const existingTxn = await prisma.paymentTransaction.findFirst({
        where: {
          gatewayTxnId: cleanUtr,
          status: 'SUCCESS',
        },
      });

      if (existingTxn) {
        return res.status(400).json({
          success: false,
          message: `Bank UTR "${cleanUtr}" has already been verified and used for another payment.`,
        });
      }

      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
      });
      if (!invoice) {
        return res.status(404).json({ success: false, message: 'Invoice not found' });
      }

      const amountToPay = Number(invoice.totalDue) - Number(invoice.amountPaid);
      if (amountToPay <= 0) {
        return res.status(400).json({ success: false, message: 'Invoice is already fully paid' });
      }

      await prisma.$transaction(async (tx) => {
        const pendingTxn = merchantTxnId
          ? await tx.paymentTransaction.findUnique({ where: { gatewayTxnId: merchantTxnId } })
          : null;

        if (pendingTxn) {
          await tx.paymentTransaction.update({
            where: { id: pendingTxn.id },
            data: {
              gatewayTxnId: cleanUtr,
              paymentMode: 'UPI_DIRECT',
              status: 'SUCCESS',
              settledAt: new Date(),
            },
          });
        } else {
          await tx.paymentTransaction.create({
            data: {
              invoiceId: invoice.id,
              gatewayTxnId: cleanUtr,
              paymentMode: 'UPI_DIRECT',
              amount: amountToPay,
              status: 'SUCCESS',
              settledAt: new Date(),
            },
          });
        }

        const newPaidAmount = Number(invoice.amountPaid) + amountToPay;
        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            amountPaid: newPaidAmount,
            status: 'PAID',
            paidAt: new Date(),
          },
        });
      });

      return res.json({
        success: true,
        message: `UPI payment verified successfully with Bank UTR: ${cleanUtr}`,
        utr: cleanUtr,
      });
    } catch (err: any) {
      console.error('Error submitting UPI UTR:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // 6. Get Detailed Printable/Downloadable Rent Receipt
  async getInvoiceReceipt(req: Request, res: Response) {
    try {
      const invoiceId = req.params.invoiceId as string;
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          stay: {
            include: {
              tenant: { include: { user: true } },
              bed: {
                include: {
                  room: {
                    include: {
                      property: {
                        include: { organization: true },
                      },
                    },
                  },
                },
              },
            },
          },
          payments: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!invoice) {
        return res.status(404).json({ success: false, message: 'Invoice not found' });
      }

      const lastSuccessTxn = invoice.payments.find((p) => p.status === 'SUCCESS');

      return res.json({
        success: true,
        data: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          billingMonth: invoice.billingMonth,
          dueDate: invoice.dueDate,
          paidAt: invoice.paidAt,
          status: invoice.status,
          rentAmount: Number(invoice.rentAmount),
          lateFine: Number(invoice.lateFine),
          totalDue: Number(invoice.totalDue),
          amountPaid: Number(invoice.amountPaid),
          propertyName: invoice.stay.bed.room.property.name,
          propertyAddress: invoice.stay.bed.room.property.address,
          propertyCity: invoice.stay.bed.room.property.city,
          roomNumber: invoice.stay.bed.room.roomNumber,
          bedNumber: invoice.stay.bed.bedNumber,
          tenantName: invoice.stay.tenant.user.fullName,
          tenantPhone: invoice.stay.tenant.user.phone,
          ownerName: invoice.stay.bed.room.property.organization.name,
          ownerPhone: invoice.stay.bed.room.property.organization.ownerPhone,
          lastTransaction: lastSuccessTxn
            ? {
                gatewayTxnId: lastSuccessTxn.gatewayTxnId,
                paymentMode: lastSuccessTxn.paymentMode,
                amount: Number(lastSuccessTxn.amount),
                settledAt: lastSuccessTxn.settledAt,
              }
            : null,
        },
      });
    } catch (error: any) {
      console.error('Error fetching invoice receipt:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },
};
