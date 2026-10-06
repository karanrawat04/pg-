import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';

export const TenantsController = {
  // 1. List Tenants (Filtered by Property or All)
  async listTenants(req: Request, res: Response) {
    try {
      const propertyId = req.query.propertyId as string | undefined;

      const tenants = await prisma.tenant.findMany({
        where: propertyId
          ? {
              stays: {
                some: {
                  bed: { room: { propertyId } },
                  status: { in: ['ACTIVE', 'NOTICE_PERIOD'] },
                },
              },
            }
          : undefined,
        include: {
          user: {
            select: {
              fullName: true,
              phone: true,
              email: true,
            },
          },
          stays: {
            where: { status: { in: ['ACTIVE', 'NOTICE_PERIOD'] } },
            include: {
              bed: {
                include: {
                  room: {
                    select: {
                      id: true,
                      roomNumber: true,
                      roomType: true,
                      property: {
                        select: { id: true, name: true },
                      },
                    },
                  },
                },
              },
              invoices: {
                where: { status: { in: ['PENDING', 'OVERDUE'] } },
                select: {
                  id: true,
                  invoiceNumber: true,
                  billingMonth: true,
                  totalDue: true,
                  amountPaid: true,
                  status: true,
                  dueDate: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.json({ success: true, data: tenants });
    } catch (error: any) {
      console.error('Error listing tenants:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // 2. Onboard Tenant (Supports Multiple Beds Allocation!)
  async onboardTenant(req: Request, res: Response) {
    try {
      const {
        fullName,
        phone,
        email,
        emergencyName,
        emergencyPhone,
        permanentAddress,
        workplace,
        idProofType,
        idProofNumber,
        bedId,
        bedIds,
        agreedRent,
        securityDeposit,
        checkInDate,
      } = req.body;

      // Consolidate bed IDs (supports single bed or multiple beds array)
      const allocatedBedIds: string[] = Array.isArray(bedIds) && bedIds.length > 0
        ? bedIds
        : bedId
        ? [bedId]
        : [];

      if (!fullName || !phone || allocatedBedIds.length === 0 || !agreedRent) {
        return res.status(400).json({
          success: false,
          message: 'fullName, phone, agreedRent, and at least one bed selection are required.',
        });
      }

      // Check if ALL selected beds are actually VACANT
      const beds = await prisma.bed.findMany({
        where: { id: { in: allocatedBedIds } },
      });

      if (beds.length !== allocatedBedIds.length) {
        return res.status(400).json({ success: false, message: 'One or more selected beds do not exist.' });
      }

      const nonVacant = beds.filter((b) => b.status !== 'VACANT');
      if (nonVacant.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Bed ${nonVacant.map((b) => b.bedNumber).join(', ')} is not vacant.`,
        });
      }

      // Execute transaction: User -> Tenant -> Multiple Stays & Bed Statuses
      const result = await prisma.$transaction(async (tx) => {
        // Check for existing user by phone or email
        const trimmedPhone = phone.trim();
        const trimmedEmail = email ? email.trim().toLowerCase() : null;

        const existingByPhone = await tx.user.findUnique({ where: { phone: trimmedPhone } });
        const existingByEmail = trimmedEmail
          ? await tx.user.findFirst({ where: { email: { equals: trimmedEmail, mode: 'insensitive' } } })
          : null;

        // Block if this phone or email belongs to an OWNER or SUPER_ADMIN
        if (existingByPhone && existingByPhone.role !== 'TENANT') {
          throw new Error(`Phone number "${trimmedPhone}" is already registered to a ${existingByPhone.role} account. A resident must use their own distinct phone number.`);
        }
        if (existingByEmail && existingByEmail.role !== 'TENANT') {
          throw new Error(`Email "${trimmedEmail}" is already registered to a ${existingByEmail.role} account. A resident must use their own distinct email.`);
        }

        // Upsert Tenant User strictly with TENANT role
        let user;
        if (existingByPhone) {
          user = await tx.user.update({
            where: { id: existingByPhone.id },
            data: {
              fullName: fullName.trim(),
              email: trimmedEmail || existingByPhone.email,
              role: 'TENANT',
            },
          });
        } else if (existingByEmail) {
          user = await tx.user.update({
            where: { id: existingByEmail.id },
            data: {
              fullName: fullName.trim(),
              phone: trimmedPhone,
              role: 'TENANT',
            },
          });
        } else {
          user = await tx.user.create({
            data: {
              fullName: fullName.trim(),
              phone: trimmedPhone,
              email: trimmedEmail,
              role: 'TENANT',
            },
          });
        }

        // Upsert Tenant Profile with Full Real-Life KYC
        let tenant = await tx.tenant.findUnique({ where: { userId: user.id } });
        if (!tenant) {
          tenant = await tx.tenant.create({
            data: {
              userId: user.id,
              emergencyName: emergencyName || null,
              emergencyPhone: emergencyPhone || null,
              permanentAddress: permanentAddress || null,
              workplace: workplace || null,
              idProofType: idProofType || 'AADHAAR',
              idProofNumber: idProofNumber || null,
              kycStatus: 'VERIFIED',
            },
          });
        } else {
          tenant = await tx.tenant.update({
            where: { id: tenant.id },
            data: {
              emergencyName: emergencyName || tenant.emergencyName,
              emergencyPhone: emergencyPhone || tenant.emergencyPhone,
              permanentAddress: permanentAddress || tenant.permanentAddress,
              workplace: workplace || tenant.workplace,
              idProofType: idProofType || tenant.idProofType,
              idProofNumber: idProofNumber || tenant.idProofNumber,
            },
          });
        }

        // For each selected bed, create a stay and mark bed as OCCUPIED
        const rentPerBed = Number(agreedRent) / allocatedBedIds.length;
        const depositPerBed = securityDeposit ? Number(securityDeposit) / allocatedBedIds.length : rentPerBed;
        const createdStays = [];

        for (const targetBedId of allocatedBedIds) {
          const stay = await tx.tenantStay.create({
            data: {
              tenantId: tenant.id,
              bedId: targetBedId,
              checkInDate: checkInDate ? new Date(checkInDate) : new Date(),
              agreedRent: rentPerBed,
              securityDeposit: depositPerBed,
              status: 'ACTIVE',
            },
          });

          await tx.bed.update({
            where: { id: targetBedId },
            data: { status: 'OCCUPIED' },
          });

          createdStays.push(stay);
        }

        // Generate 1st month invoice for the total agreed rent
        const currentMonth = new Date().toISOString().slice(0, 7);
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 5);

        const invoice = await tx.invoice.create({
          data: {
            tenantStayId: createdStays[0].id,
            invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
            billingMonth: currentMonth,
            rentAmount: agreedRent,
            totalDue: agreedRent,
            dueDate,
            status: 'PENDING',
          },
        });

        return { user, tenant, stays: createdStays, invoice };
      });

      return res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      console.error('Error onboarding tenant:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // 3. Checkout Tenant / Release Bed(s)
  async checkoutTenant(req: Request, res: Response) {
    try {
      const id = req.params.id as string; // tenantId

      const tenant = await prisma.tenant.findUnique({
        where: { id },
        include: {
          stays: {
            where: { status: { in: ['ACTIVE', 'NOTICE_PERIOD'] } },
            include: { invoices: { where: { status: { in: ['PENDING', 'OVERDUE'] } } } },
          },
        },
      });

      if (!tenant) {
        return res.status(404).json({ success: false, message: 'Tenant not found' });
      }

      await prisma.$transaction(async (tx) => {
        for (const stay of tenant.stays) {
          // Free the bed
          await tx.bed.update({
            where: { id: stay.bedId },
            data: { status: 'VACANT' },
          });

          // Mark stay as CHECKED_OUT
          await tx.tenantStay.update({
            where: { id: stay.id },
            data: {
              status: 'CHECKED_OUT',
              checkOutDate: new Date(),
              depositRefunded: stay.securityDeposit,
            },
          });
        }
      });

      return res.json({ success: true, message: 'Tenant checked out and beds marked VACANT.' });
    } catch (error: any) {
      console.error('Error checking out tenant:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // 4. Shift Tenant Bed (Move from old bed to new vacant bed)
  async shiftBed(req: Request, res: Response) {
    try {
      const { stayId, newBedId } = req.body;

      if (!stayId || !newBedId) {
        return res.status(400).json({ success: false, message: 'stayId and newBedId are required' });
      }

      const newBed = await prisma.bed.findUnique({ where: { id: newBedId } });
      if (!newBed || newBed.status !== 'VACANT') {
        return res.status(400).json({ success: false, message: 'Target bed is not vacant' });
      }

      const stay = await prisma.tenantStay.findUnique({ where: { id: stayId } });
      if (!stay) {
        return res.status(404).json({ success: false, message: 'Stay record not found' });
      }

      const oldBedId = stay.bedId;

      await prisma.$transaction(async (tx) => {
        // Free old bed
        await tx.bed.update({
          where: { id: oldBedId },
          data: { status: 'VACANT' },
        });

        // Occupy new bed
        await tx.bed.update({
          where: { id: newBedId },
          data: { status: 'OCCUPIED' },
        });

        // Update stay
        await tx.tenantStay.update({
          where: { id: stayId },
          data: { bedId: newBedId },
        });
      });

      return res.json({ success: true, message: 'Tenant bed shifted successfully' });
    } catch (error: any) {
      console.error('Error shifting bed:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // 5. Get Single Tenant Detailed Profile
  async getTenantDetails(req: Request, res: Response) {
    try {
      const id = req.params.id as string;

      const tenant = await prisma.tenant.findUnique({
        where: { id },
        include: {
          user: true,
          stays: {
            include: {
              bed: {
                include: {
                  room: {
                    include: { property: true, floor: true },
                  },
                },
              },
              invoices: {
                include: { payments: true },
                orderBy: { createdAt: 'desc' },
              },
            },
          },
          complaints: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!tenant) {
        return res.status(404).json({ success: false, message: 'Tenant not found' });
      }

      return res.json({ success: true, data: tenant });
    } catch (error: any) {
      console.error('Error fetching tenant:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // 6. Update Tenant Profile Details & Stay Terms
  async updateTenant(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const {
        fullName,
        phone,
        email,
        emergencyName,
        emergencyPhone,
        workplace,
        permanentAddress,
        idProofType,
        idProofNumber,
        kycStatus,
        agreedRent,
        securityDeposit,
        checkInDate,
        stayStatus,
      } = req.body;

      const tenant = await prisma.tenant.findUnique({
        where: { id },
        include: {
          user: true,
          stays: {
            where: { status: { in: ['ACTIVE', 'NOTICE_PERIOD'] } },
            include: { bed: true },
          },
        },
      });

      if (!tenant) {
        return res.status(404).json({ success: false, message: 'Tenant not found' });
      }

      await prisma.$transaction(async (tx) => {
        // 1. Update User info
        if (fullName || phone || email !== undefined) {
          await tx.user.update({
            where: { id: tenant.userId },
            data: {
              ...(fullName ? { fullName: String(fullName).trim() } : {}),
              ...(phone ? { phone: String(phone).trim() } : {}),
              ...(email !== undefined ? { email: email ? String(email).trim() : null } : {}),
            },
          });
        }

        // 2. Update Tenant profile and KYC
        await tx.tenant.update({
          where: { id },
          data: {
            ...(emergencyName !== undefined ? { emergencyName: String(emergencyName).trim() } : {}),
            ...(emergencyPhone !== undefined ? { emergencyPhone: String(emergencyPhone).trim() } : {}),
            ...(workplace !== undefined ? { workplace: String(workplace).trim() } : {}),
            ...(permanentAddress !== undefined ? { permanentAddress: String(permanentAddress).trim() } : {}),
            ...(idProofType !== undefined ? { idProofType: String(idProofType).trim() } : {}),
            ...(idProofNumber !== undefined ? { idProofNumber: String(idProofNumber).trim() } : {}),
            ...(kycStatus !== undefined ? { kycStatus: String(kycStatus).trim() } : {}),
          },
        });

        // 3. Update active Stay terms if provided
        if (
          agreedRent !== undefined ||
          securityDeposit !== undefined ||
          checkInDate !== undefined ||
          stayStatus !== undefined
        ) {
          const activeStays = tenant.stays;
          if (activeStays.length > 0) {
            const rentPerStay =
              agreedRent !== undefined && Number(agreedRent) > 0
                ? Number(agreedRent) / activeStays.length
                : undefined;
            const depositPerStay =
              securityDeposit !== undefined && Number(securityDeposit) >= 0
                ? Number(securityDeposit) / activeStays.length
                : undefined;

            for (const stay of activeStays) {
              if (stayStatus === 'CHECKED_OUT') {
                // Free the bed and checkout stay
                await tx.bed.update({
                  where: { id: stay.bedId },
                  data: { status: 'VACANT' },
                });
                await tx.tenantStay.update({
                  where: { id: stay.id },
                  data: {
                    status: 'CHECKED_OUT',
                    checkOutDate: new Date(),
                    ...(rentPerStay !== undefined ? { agreedRent: rentPerStay } : {}),
                    ...(depositPerStay !== undefined ? { securityDeposit: depositPerStay } : {}),
                  },
                });
              } else {
                await tx.tenantStay.update({
                  where: { id: stay.id },
                  data: {
                    ...(rentPerStay !== undefined ? { agreedRent: rentPerStay } : {}),
                    ...(depositPerStay !== undefined ? { securityDeposit: depositPerStay } : {}),
                    ...(checkInDate ? { checkInDate: new Date(checkInDate) } : {}),
                    ...(stayStatus ? { status: stayStatus } : {}),
                  },
                });
              }
            }
          }
        }
      });

      // Fetch fresh updated tenant data
      const updatedTenant = await prisma.tenant.findUnique({
        where: { id },
        include: {
          user: true,
          stays: {
            where: { status: { in: ['ACTIVE', 'NOTICE_PERIOD'] } },
            include: {
              bed: {
                include: {
                  room: {
                    select: {
                      id: true,
                      roomNumber: true,
                      roomType: true,
                      property: { select: { id: true, name: true } },
                    },
                  },
                },
              },
            },
          },
        },
      });

      return res.json({
        success: true,
        data: updatedTenant,
        message: 'Resident profile and stay terms updated successfully.',
      });
    } catch (err: any) {
      console.error('Error updating resident:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // 7. Delete Resident Record with Cascade Cleanup
  async deleteTenant(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const tenant = await prisma.tenant.findUnique({
        where: { id },
        include: { stays: true },
      });

      if (!tenant) {
        return res.status(404).json({ success: false, message: 'Resident not found' });
      }

      await prisma.$transaction(async (tx) => {
        // Free any occupied beds associated with this resident
        for (const stay of tenant.stays) {
          await tx.bed.update({
            where: { id: stay.bedId },
            data: { status: 'VACANT' },
          });
        }

        const stayIds = tenant.stays.map((s) => s.id);
        if (stayIds.length > 0) {
          await tx.paymentTransaction.deleteMany({
            where: { invoice: { tenantStayId: { in: stayIds } } },
          });
          await tx.invoice.deleteMany({
            where: { tenantStayId: { in: stayIds } },
          });
          await tx.tenantStay.deleteMany({
            where: { id: { in: stayIds } },
          });
        }

        await tx.complaint.deleteMany({
          where: { tenantId: id },
        });

        await tx.tenant.delete({
          where: { id },
        });

        // Delete user if they are a TENANT role
        const user = await tx.user.findUnique({ where: { id: tenant.userId } });
        if (user && user.role === 'TENANT') {
          await tx.user.delete({ where: { id: tenant.userId } });
        }
      });

      return res.json({ success: true, message: 'Resident record deleted successfully and beds released.' });
    } catch (err: any) {
      console.error('Error deleting resident:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // 8. Revise Monthly Agreed Rent / Escalation
  async reviseRent(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { newRent, effectiveFrom, note, updateCurrentPendingInvoice } = req.body;

      const parsedRent = Number(newRent);
      if (!parsedRent || parsedRent <= 0) {
        return res.status(400).json({ success: false, message: 'Valid newRent amount is required.' });
      }

      const tenant = await prisma.tenant.findUnique({
        where: { id },
        include: {
          stays: {
            where: { status: { in: ['ACTIVE', 'NOTICE_PERIOD'] } },
          },
          user: true,
        },
      });

      if (!tenant) {
        return res.status(404).json({ success: false, message: 'Resident not found' });
      }

      if (tenant.stays.length === 0) {
        return res.status(400).json({ success: false, message: 'No active stays found for this resident.' });
      }

      const rentPerStay = parsedRent / tenant.stays.length;

      await prisma.$transaction(async (tx) => {
        // 1. Update agreedRent for all active stays
        for (const stay of tenant.stays) {
          await tx.tenantStay.update({
            where: { id: stay.id },
            data: { agreedRent: rentPerStay },
          });
        }

        // 2. Optionally update current pending unpaid invoice if requested
        if (updateCurrentPendingInvoice) {
          const stayIds = tenant.stays.map((s) => s.id);
          const pendingInvoice = await tx.invoice.findFirst({
            where: {
              tenantStayId: { in: stayIds },
              status: 'PENDING',
              amountPaid: 0,
            },
            orderBy: { createdAt: 'desc' },
          });

          if (pendingInvoice) {
            await tx.invoice.update({
              where: { id: pendingInvoice.id },
              data: {
                rentAmount: parsedRent,
                totalDue: parsedRent,
              },
            });
          }
        }
      });

      return res.json({
        success: true,
        message: `Monthly rent for ${tenant.user.fullName} revised to ₹${parsedRent.toLocaleString()} successfully.`,
        data: {
          tenantId: id,
          newRent: parsedRent,
          effectiveFrom: effectiveFrom || 'NEXT_CYCLE',
          note: note || null,
        },
      });
    } catch (err: any) {
      console.error('Error revising rent:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};


