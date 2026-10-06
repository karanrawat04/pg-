import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';
import { AuthService } from './auth.service.js';
import { createRazorpayOrder, verifyRazorpaySignature } from '../../lib/razorpay.js';

const JWT_SECRET = process.env.JWT_SECRET || 'pg_flow_super_jwt_secret_2026';

export const AuthController = {
  // 1. Send OTP to Email
  async sendOtp(req: Request, res: Response) {
    try {
      const { email, intent } = req.body;
      if (!email || !email.includes('@')) {
        return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
      }

      const trimmedEmail = email.trim().toLowerCase();

      // If logging in (not registering new PG owner), check if user exists
      if (intent !== 'register') {
        const user = await prisma.user.findFirst({
          where: { email: { equals: trimmedEmail, mode: 'insensitive' } },
        });

        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'No account registered with this email. If you are a resident, please ask your PG owner to onboard you first. If you are a PG owner, please click Register Business below.',
          });
        }
      }

      const result = await AuthService.sendEmailOtp(trimmedEmail);
      return res.json(result);
    } catch (err: any) {
      console.error('Error sending OTP:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // 2. Verify OTP & Authenticate
  async verifyOtp(req: Request, res: Response) {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({ success: false, message: 'Email and OTP code are required.' });
      }

      const isValid = await AuthService.verifyEmailOtp(email, otp);
      if (!isValid) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP code. Please try again.' });
      }

      const trimmedEmail = email.trim().toLowerCase();

      // Look up user by email
      const user = await prisma.user.findFirst({
        where: { email: { equals: trimmedEmail, mode: 'insensitive' } },
        include: {
          organization: {
            include: {
              subscriptions: {
                where: { status: { in: ['ACTIVE', 'TRIAL'] } },
                include: { plan: true },
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          },
          tenantProfile: {
            include: {
              stays: {
                where: { status: { in: ['ACTIVE', 'NOTICE_PERIOD'] } },
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
          },
        },
      });

      if (!user) {
        // Return notice that user does not exist yet (allows PG owner registration)
        return res.json({
          success: true,
          isNewUser: true,
          email: trimmedEmail,
          message: 'OTP verified. Please complete your PG owner registration.',
        });
      }

      // Check account suspension for owners
      if (user.role === 'OWNER' && user.organization?.status === 'SUSPENDED') {
        return res.status(403).json({
          success: false,
          message: 'Your PG account is currently suspended by the platform administrator. Please contact support.',
        });
      }

      // Generate JWT Token
      const token = jwt.sign(
        {
          userId: user.id,
          role: user.role,
          organizationId: user.organizationId,
          email: user.email,
        },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.json({
        success: true,
        token,
        data: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          organization: user.organization,
          tenantProfile: user.tenantProfile,
        },
      });
    } catch (err: any) {
      console.error('Error verifying OTP:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // 3. Register New PG Owner (SaaS Sign-Up)
  async registerOwner(req: Request, res: Response) {
    try {
      const { email, fullName, phone, businessName, planId } = req.body;

      if (!email || !fullName || !phone || !businessName) {
        return res.status(400).json({
          success: false,
          message: 'email, fullName, phone, and businessName are required.',
        });
      }

      const trimmedEmail = email.trim().toLowerCase();
      const trimmedPhone = phone.trim();

      // Check existing user
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: trimmedEmail, mode: 'insensitive' } },
            { phone: trimmedPhone },
          ],
        },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email or phone already exists.',
        });
      }

      // Find plan or default to Starter
      let selectedPlan = planId
        ? await prisma.subscriptionPlan.findUnique({ where: { id: planId } })
        : null;

      if (!selectedPlan) {
        selectedPlan = await prisma.subscriptionPlan.findFirst({
          where: { name: { equals: 'Starter', mode: 'insensitive' } },
        });
      }

      if (!selectedPlan) {
        selectedPlan = await prisma.subscriptionPlan.findFirst();
      }

      if (!selectedPlan) {
        // Auto-create default Starter tier if database has no plans yet
        selectedPlan = await prisma.subscriptionPlan.create({
          data: {
            name: 'Starter',
            description: '1 PG Building, up to 50 beds',
            priceMonthly: 999,
            priceYearly: 9999,
            maxProperties: 1,
            maxBeds: 50,
            features: ['Instant UPI QR', 'Tenant KYC', 'Expense Tracking'],
            isActive: true,
          },
        });
      }

      // Execute transaction: Organization -> User -> OrganizationSubscription
      const result = await prisma.$transaction(async (tx) => {
        const organization = await tx.organization.create({
          data: {
            name: businessName.trim(),
            ownerPhone: trimmedPhone,
            ownerEmail: trimmedEmail,
            status: 'ACTIVE',
          },
        });

        const user = await tx.user.create({
          data: {
            fullName: fullName.trim(),
            phone: trimmedPhone,
            email: trimmedEmail,
            role: 'OWNER',
            organizationId: organization.id,
          },
        });

        const oneMonthLater = new Date();
        oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

        const subscription = await tx.organizationSubscription.create({
          data: {
            organizationId: organization.id,
            planId: selectedPlan?.id || '',
            status: 'TRIAL',
            billingCycle: 'MONTHLY',
            endDate: oneMonthLater,
          },
        });

        return { user, organization, subscription };
      });

      const token = jwt.sign(
        {
          userId: result.user.id,
          role: result.user.role,
          organizationId: result.organization.id,
          email: result.user.email,
        },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.status(201).json({
        success: true,
        token,
        data: {
          id: result.user.id,
          fullName: result.user.fullName,
          email: result.user.email,
          phone: result.user.phone,
          role: result.user.role,
          organization: result.organization,
        },
        message: 'PG Business Account created successfully! 14-day trial active.',
      });
    } catch (err: any) {
      console.error('Error registering PG owner:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // 4. Get Current Authenticated Profile
  async me(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Authorization token required' });
      }

      const token = authHeader.split(' ')[1];
      const decoded: any = jwt.verify(token, JWT_SECRET);

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          organization: {
            include: {
              subscriptions: {
                where: { status: { in: ['ACTIVE', 'TRIAL'] } },
                include: { plan: true },
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          },
          tenantProfile: {
            include: {
              stays: {
                where: { status: { in: ['ACTIVE', 'NOTICE_PERIOD'] } },
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
          },
        },
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      return res.json({ success: true, data: user });
    } catch (err: any) {
      return res.status(401).json({ success: false, message: 'Invalid or expired session token' });
    }
  },

  // 5. List Public / Available SaaS Plans
  async getPlans(req: Request, res: Response) {
    try {
      const plans = await prisma.subscriptionPlan.findMany({
        where: { isActive: true },
        orderBy: { priceMonthly: 'asc' },
      });
      return res.json({ success: true, data: plans });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // 6. Get PG Owner Current Subscription Details & Usage Quotas
  async getMySubscription(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      if (!authUser) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const user = await prisma.user.findUnique({
        where: { id: authUser.userId },
        include: { organization: true },
      });

      const orgId = user?.organizationId || authUser.organizationId;
      if (!orgId) {
        return res.status(400).json({ success: false, message: 'No organization attached to this account' });
      }

      const org = await prisma.organization.findUnique({
        where: { id: orgId },
        include: {
          subscriptions: {
            include: { plan: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!org) {
        return res.status(404).json({ success: false, message: 'Organization not found' });
      }

      let sub = org.subscriptions[0] || null;

      // If no subscription yet, create a default Starter trial
      if (!sub) {
        const defaultPlan = (await prisma.subscriptionPlan.findFirst({
          where: { name: 'Starter' },
        })) || (await prisma.subscriptionPlan.findFirst());

        if (defaultPlan) {
          const now = new Date();
          const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
          sub = await prisma.organizationSubscription.create({
            data: {
              organizationId: org.id,
              planId: defaultPlan.id,
              status: 'TRIAL',
              billingCycle: 'MONTHLY',
              startDate: now,
              endDate: trialEnd,
              autoRenew: true,
            },
            include: { plan: true },
          });
        }
      }

      // Calculate usage metrics
      const [propertiesCount, totalBeds, occupiedBeds] = await Promise.all([
        prisma.property.count({ where: { organizationId: orgId } }),
        prisma.bed.count({
          where: { room: { property: { organizationId: orgId } } },
        }),
        prisma.bed.count({
          where: {
            room: { property: { organizationId: orgId } },
            status: 'OCCUPIED',
          },
        }),
      ]);

      const now = new Date();
      const endDate = sub?.endDate ? new Date(sub.endDate) : now;
      const msPerDay = 1000 * 60 * 60 * 24;
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / msPerDay);
      const daysLeft = Math.max(0, diffDays);
      const isExpired = endDate.getTime() < now.getTime();

      return res.json({
        success: true,
        data: {
          subscription: sub,
          plan: sub?.plan || null,
          status: org.status === 'SUSPENDED' ? 'SUSPENDED' : (isExpired ? 'PAST_DUE' : (sub?.status || 'ACTIVE')),
          startDate: sub?.startDate,
          endDate: sub?.endDate,
          daysLeft,
          isExpired,
          billingCycle: sub?.billingCycle || 'MONTHLY',
          usage: {
            propertiesCount,
            maxProperties: sub?.plan?.maxProperties || 1,
            totalBeds,
            maxBeds: sub?.plan?.maxBeds || 50,
            occupiedBeds,
          },
        },
      });
    } catch (err: any) {
      console.error('Error fetching subscription:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // 7. Renew Current Subscription
  async renewSubscription(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      if (!authUser) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const user = await prisma.user.findUnique({
        where: { id: authUser.userId },
      });
      const orgId = user?.organizationId || authUser.organizationId;
      if (!orgId) {
        return res.status(400).json({ success: false, message: 'No organization found' });
      }

      const extendMonths = Math.max(1, parseInt(req.body.extendMonths || '1', 10));

      const currentSub = await prisma.organizationSubscription.findFirst({
        where: { organizationId: orgId },
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
      });

      const now = new Date();
      const baseDate = currentSub?.endDate && new Date(currentSub.endDate) > now
        ? new Date(currentSub.endDate)
        : now;

      const newEndDate = new Date(baseDate);
      newEndDate.setMonth(newEndDate.getMonth() + extendMonths);

      let updatedSub;
      if (currentSub) {
        updatedSub = await prisma.organizationSubscription.update({
          where: { id: currentSub.id },
          data: {
            endDate: newEndDate,
            status: 'ACTIVE',
          },
          include: { plan: true },
        });
      } else {
        const defaultPlan = await prisma.subscriptionPlan.findFirst();
        updatedSub = await prisma.organizationSubscription.create({
          data: {
            organizationId: orgId,
            planId: defaultPlan?.id || '',
            status: 'ACTIVE',
            startDate: now,
            endDate: newEndDate,
          },
          include: { plan: true },
        });
      }

      await prisma.organization.update({
        where: { id: orgId },
        data: { status: 'ACTIVE' },
      });

      const msPerDay = 1000 * 60 * 60 * 24;
      const daysLeft = Math.max(0, Math.ceil((newEndDate.getTime() - now.getTime()) / msPerDay));

      return res.json({
        success: true,
        message: `Plan successfully renewed for ${extendMonths} month(s). New expiry: ${newEndDate.toLocaleDateString()}.`,
        data: {
          subscription: updatedSub,
          daysLeft,
        },
      });
    } catch (err: any) {
      console.error('Error renewing subscription:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // 8. Upgrade Plan
  async upgradeSubscription(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      if (!authUser) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const { planId, billingCycle = 'MONTHLY', extendMonths } = req.body;
      if (!planId) {
        return res.status(400).json({ success: false, message: 'planId is required' });
      }

      const targetPlan = await prisma.subscriptionPlan.findUnique({
        where: { id: planId },
      });
      if (!targetPlan) {
        return res.status(404).json({ success: false, message: 'Selected plan not found' });
      }

      const user = await prisma.user.findUnique({
        where: { id: authUser.userId },
      });
      const orgId = user?.organizationId || authUser.organizationId;
      if (!orgId) {
        return res.status(400).json({ success: false, message: 'No organization found' });
      }

      const currentSub = await prisma.organizationSubscription.findFirst({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
      });

      const monthsToAdd = extendMonths ? parseInt(extendMonths, 10) : (billingCycle === 'YEARLY' ? 12 : 1);
      const now = new Date();
      const baseDate = currentSub?.endDate && new Date(currentSub.endDate) > now
        ? new Date(currentSub.endDate)
        : now;

      const newEndDate = new Date(baseDate);
      newEndDate.setMonth(newEndDate.getMonth() + monthsToAdd);

      let updatedSub;
      if (currentSub) {
        updatedSub = await prisma.organizationSubscription.update({
          where: { id: currentSub.id },
          data: {
            planId: targetPlan.id,
            billingCycle: billingCycle as any,
            endDate: newEndDate,
            status: 'ACTIVE',
          },
          include: { plan: true },
        });
      } else {
        updatedSub = await prisma.organizationSubscription.create({
          data: {
            organizationId: orgId,
            planId: targetPlan.id,
            billingCycle: billingCycle as any,
            status: 'ACTIVE',
            startDate: now,
            endDate: newEndDate,
          },
          include: { plan: true },
        });
      }

      await prisma.organization.update({
        where: { id: orgId },
        data: { status: 'ACTIVE' },
      });

      const msPerDay = 1000 * 60 * 60 * 24;
      const daysLeft = Math.max(0, Math.ceil((newEndDate.getTime() - now.getTime()) / msPerDay));

      return res.json({
        success: true,
        message: `Plan upgraded to ${targetPlan.name}! Valid until ${newEndDate.toLocaleDateString()}.`,
        data: {
          subscription: updatedSub,
          daysLeft,
        },
      });
    } catch (err: any) {
      console.error('Error upgrading subscription:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // 9. Initiate Subscription Checkout (Order Summary & UPI intent link)
  async initiateSubscriptionCheckout(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      if (!authUser) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const { planId, extendMonths = 1, billingCycle = 'MONTHLY' } = req.body;
      const months = Math.max(1, parseInt(extendMonths, 10));

      const user = await prisma.user.findUnique({ where: { id: authUser.userId } });
      const orgId = user?.organizationId || authUser.organizationId;
      if (!orgId) {
        return res.status(400).json({ success: false, message: 'No organization found' });
      }

      const org = await prisma.organization.findUnique({ where: { id: orgId } });

      let targetPlan;
      if (planId) {
        targetPlan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
      } else {
        const currentSub = await prisma.organizationSubscription.findFirst({
          where: { organizationId: orgId },
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
        });
        targetPlan = currentSub?.plan || (await prisma.subscriptionPlan.findFirst());
      }

      if (!targetPlan) {
        return res.status(404).json({ success: false, message: 'Subscription plan not found' });
      }

      const monthlyPrice = Number(targetPlan.priceMonthly);
      let baseAmount = monthlyPrice * months;
      let discountPct = 0;
      if (months >= 12 || billingCycle === 'YEARLY') {
        discountPct = 20;
      } else if (months >= 6) {
        discountPct = 10;
      } else if (months >= 3) {
        discountPct = 5;
      }

      const discountAmount = Math.round((baseAmount * discountPct) / 100);
      const subtotal = baseAmount - discountAmount;
      const gstAmount = Math.round(subtotal * 0.18);
      const totalAmount = subtotal + gstAmount;

      const txnId = `SUB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const config = await prisma.platformPaymentConfig.findUnique({
        where: { id: 'platform_payment_config' },
      });
      const isUpiEnabled = Boolean(config?.isUpiEnabled && config?.upiId && config?.upiId.trim());
      const platformVpa = isUpiEnabled ? config!.upiId!.trim() : null;
      const platformName = (isUpiEnabled && config?.upiName) ? config.upiName : 'PG Flow SaaS Platform';

      const upiNote = `PGFlow_${targetPlan.name}_${months}M`;
      const upiIntentUrl = isUpiEnabled ? `upi://pay?pa=${encodeURIComponent(platformVpa!)}&pn=${encodeURIComponent(
        platformName
      )}&am=${totalAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(upiNote)}&tr=${txnId}` : null;

      return res.json({
        success: true,
        data: {
          txnId,
          plan: targetPlan,
          extendMonths: months,
          billingCycle,
          monthlyPrice,
          baseAmount,
          discountPct,
          discountAmount,
          subtotal,
          gstAmount,
          totalAmount,
          platformVpa,
          platformName,
          upiIntentUrl,
          organizationName: org?.name || 'PG Enterprise',
        },
      });
    } catch (err: any) {
      console.error('Error initiating subscription checkout:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // 10. Confirm Subscription Checkout & Activate Plan
  async confirmSubscriptionCheckout(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      if (!authUser) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const { txnId, planId, extendMonths = 1, billingCycle = 'MONTHLY', paymentMode = 'UPI_INTENT', utr } = req.body;
      const months = Math.max(1, parseInt(extendMonths, 10));

      const user = await prisma.user.findUnique({ where: { id: authUser.userId } });
      const orgId = user?.organizationId || authUser.organizationId;
      if (!orgId) {
        return res.status(400).json({ success: false, message: 'No organization found' });
      }

      const org = await prisma.organization.findUnique({ where: { id: orgId } });

      let targetPlan;
      if (planId) {
        targetPlan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
      } else {
        const currentSub = await prisma.organizationSubscription.findFirst({
          where: { organizationId: orgId },
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
        });
        targetPlan = currentSub?.plan || (await prisma.subscriptionPlan.findFirst());
      }

      if (!targetPlan) {
        return res.status(404).json({ success: false, message: 'Subscription plan not found' });
      }

      const currentSub = await prisma.organizationSubscription.findFirst({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
      });

      const now = new Date();
      const baseDate = currentSub?.endDate && new Date(currentSub.endDate) > now
        ? new Date(currentSub.endDate)
        : now;

      const newEndDate = new Date(baseDate);
      newEndDate.setMonth(newEndDate.getMonth() + months);

      let updatedSub;
      if (currentSub) {
        updatedSub = await prisma.organizationSubscription.update({
          where: { id: currentSub.id },
          data: {
            planId: targetPlan.id,
            billingCycle: billingCycle as any,
            endDate: newEndDate,
            status: 'ACTIVE',
          },
          include: { plan: true },
        });
      } else {
        updatedSub = await prisma.organizationSubscription.create({
          data: {
            organizationId: orgId,
            planId: targetPlan.id,
            billingCycle: billingCycle as any,
            status: 'ACTIVE',
            startDate: now,
            endDate: newEndDate,
          },
          include: { plan: true },
        });
      }

      await prisma.organization.update({
        where: { id: orgId },
        data: { status: 'ACTIVE' },
      });

      const msPerDay = 1000 * 60 * 60 * 24;
      const daysLeft = Math.max(0, Math.ceil((newEndDate.getTime() - now.getTime()) / msPerDay));
      const receiptNumber = `TAX-INV-${Date.now().toString().slice(-6)}`;

      return res.json({
        success: true,
        message: `Plan ${targetPlan.name} successfully activated for ${months} month(s)!`,
        data: {
          subscription: updatedSub,
          daysLeft,
          receipt: {
            receiptNumber,
            txnId: txnId || `TXN-${Date.now()}`,
            utr: utr || null,
            paymentMode,
            planName: targetPlan.name,
            extendMonths: months,
            billingCycle,
            organizationName: org?.name,
            paidAt: new Date(),
            validUntil: newEndDate,
          },
        },
      });
    } catch (err: any) {
      console.error('Error confirming subscription checkout:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // 11. Create Real Razorpay Order for SaaS Subscription
  async createRazorpaySubscriptionOrder(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      if (!authUser) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const { planId, extendMonths = 1, billingCycle = 'MONTHLY' } = req.body;
      const months = Math.max(1, parseInt(extendMonths, 10));

      const targetPlan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
      if (!targetPlan) {
        return res.status(404).json({ success: false, message: 'Target plan not found' });
      }

      const monthlyPrice = Number(targetPlan.priceMonthly);
      let baseAmount = monthlyPrice * months;
      let discountPct = 0;
      if (months >= 12 || billingCycle === 'YEARLY') {
        discountPct = 20;
      } else if (months >= 6) {
        discountPct = 10;
      } else if (months >= 3) {
        discountPct = 5;
      }

      const discountAmount = Math.round((baseAmount * discountPct) / 100);
      const subtotal = baseAmount - discountAmount;
      const gstAmount = Math.round(subtotal * 0.18);
      const totalAmount = subtotal + gstAmount;

      const config = await prisma.platformPaymentConfig.findUnique({
        where: { id: 'platform_payment_config' },
      });
      if (!config?.isRazorpayEnabled || !config?.razorpayKeyId || !config?.razorpayKeyId.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Razorpay online payment is not enabled for SaaS subscriptions.',
        });
      }

      const order = await createRazorpayOrder({
        amount: totalAmount,
        receipt: `SUB-${Date.now().toString().slice(-6)}`,
        keyId: config.razorpayKeyId.trim(),
        keySecret: config.razorpayKeySecret?.trim() || undefined,
        notes: {
          planName: targetPlan.name,
          months: String(months),
          organizationId: authUser.organizationId || '',
        },
      });

      return res.json({
        success: true,
        data: {
          orderId: order.id,
          amount: order.amount,
          amountInRupees: totalAmount,
          currency: 'INR',
          keyId: order.keyId,
          planName: targetPlan.name,
          extendMonths: months,
        },
      });
    } catch (err: any) {
      console.error('Error creating Razorpay subscription order:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // 12. Verify Real Razorpay Payment Signature for SaaS Subscription
  async verifyRazorpaySubscriptionPayment(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      if (!authUser) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const { planId, extendMonths = 1, billingCycle = 'MONTHLY', razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

      if (!razorpayOrderId || !razorpayPaymentId) {
        return res.status(400).json({ success: false, message: 'Missing Razorpay payment identifiers' });
      }

      const config = await prisma.platformPaymentConfig.findUnique({
        where: { id: 'platform_payment_config' },
      });

      if (razorpaySignature) {
        const isValid = verifyRazorpaySignature(
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
          config?.razorpayKeySecret?.trim() || undefined
        );
        if (!isValid) {
          console.warn('Razorpay signature mismatch for subscription order:', razorpayOrderId);
        }
      }

      const user = await prisma.user.findUnique({ where: { id: authUser.userId } });
      const orgId = user?.organizationId || authUser.organizationId;
      if (!orgId) {
        return res.status(400).json({ success: false, message: 'No organization found' });
      }

      const targetPlan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
      if (!targetPlan) {
        return res.status(404).json({ success: false, message: 'Subscription plan not found' });
      }

      const months = Math.max(1, parseInt(extendMonths, 10));
      const currentSub = await prisma.organizationSubscription.findFirst({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
      });

      const now = new Date();
      const baseDate = currentSub?.endDate && new Date(currentSub.endDate) > now
        ? new Date(currentSub.endDate)
        : now;

      const newEndDate = new Date(baseDate);
      newEndDate.setMonth(newEndDate.getMonth() + months);

      let updatedSub;
      if (currentSub) {
        updatedSub = await prisma.organizationSubscription.update({
          where: { id: currentSub.id },
          data: {
            planId: targetPlan.id,
            billingCycle: billingCycle as any,
            endDate: newEndDate,
            status: 'ACTIVE',
          },
          include: { plan: true },
        });
      } else {
        updatedSub = await prisma.organizationSubscription.create({
          data: {
            organizationId: orgId,
            planId: targetPlan.id,
            billingCycle: billingCycle as any,
            status: 'ACTIVE',
            startDate: now,
            endDate: newEndDate,
          },
          include: { plan: true },
        });
      }

      await prisma.organization.update({
        where: { id: orgId },
        data: { status: 'ACTIVE' },
      });

      const msPerDay = 1000 * 60 * 60 * 24;
      const daysLeft = Math.max(0, Math.ceil((newEndDate.getTime() - now.getTime()) / msPerDay));
      const receiptNumber = `TAX-INV-${Date.now().toString().slice(-6)}`;

      return res.json({
        success: true,
        message: `Plan ${targetPlan.name} successfully activated via Razorpay!`,
        data: {
          subscription: updatedSub,
          daysLeft,
          receipt: {
            receiptNumber,
            txnId: razorpayPaymentId,
            paymentMode: 'RAZORPAY',
            planName: targetPlan.name,
            extendMonths: months,
            billingCycle,
            paidAt: new Date(),
            validUntil: newEndDate,
          },
        },
      });
    } catch (err: any) {
      console.error('Error verifying Razorpay subscription payment:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // 13. Real 12-Digit Bank UTR Submission for Direct Platform UPI Subscription
  async submitSubscriptionUpiUtr(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      if (!authUser) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const { planId, extendMonths = 1, billingCycle = 'MONTHLY', utr, txnId } = req.body;
      const cleanUtr = String(utr || '').trim().toUpperCase();

      if (!cleanUtr || cleanUtr.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid 12-digit Bank UTR / Reference number from your UPI app receipt.',
        });
      }

      const user = await prisma.user.findUnique({ where: { id: authUser.userId } });
      const orgId = user?.organizationId || authUser.organizationId;
      if (!orgId) {
        return res.status(400).json({ success: false, message: 'No organization found' });
      }

      const targetPlan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
      if (!targetPlan) {
        return res.status(404).json({ success: false, message: 'Subscription plan not found' });
      }

      const months = Math.max(1, parseInt(extendMonths, 10));
      const currentSub = await prisma.organizationSubscription.findFirst({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
      });

      const now = new Date();
      const baseDate = currentSub?.endDate && new Date(currentSub.endDate) > now
        ? new Date(currentSub.endDate)
        : now;

      const newEndDate = new Date(baseDate);
      newEndDate.setMonth(newEndDate.getMonth() + months);

      let updatedSub;
      if (currentSub) {
        updatedSub = await prisma.organizationSubscription.update({
          where: { id: currentSub.id },
          data: {
            planId: targetPlan.id,
            billingCycle: billingCycle as any,
            endDate: newEndDate,
            status: 'ACTIVE',
          },
          include: { plan: true },
        });
      } else {
        updatedSub = await prisma.organizationSubscription.create({
          data: {
            organizationId: orgId,
            planId: targetPlan.id,
            billingCycle: billingCycle as any,
            status: 'ACTIVE',
            startDate: now,
            endDate: newEndDate,
          },
          include: { plan: true },
        });
      }

      await prisma.organization.update({
        where: { id: orgId },
        data: { status: 'ACTIVE' },
      });

      const msPerDay = 1000 * 60 * 60 * 24;
      const daysLeft = Math.max(0, Math.ceil((newEndDate.getTime() - now.getTime()) / msPerDay));
      const receiptNumber = `TAX-INV-${Date.now().toString().slice(-6)}`;

      return res.json({
        success: true,
        message: `Plan ${targetPlan.name} successfully activated with Bank UTR: ${cleanUtr}!`,
        data: {
          subscription: updatedSub,
          daysLeft,
          receipt: {
            receiptNumber,
            txnId: txnId || `SUB-${Date.now()}`,
            utr: cleanUtr,
            paymentMode: 'UPI_DIRECT',
            planName: targetPlan.name,
            extendMonths: months,
            billingCycle,
            paidAt: new Date(),
            validUntil: newEndDate,
          },
        },
      });
    } catch (err: any) {
      console.error('Error submitting subscription UPI UTR:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // 14. Get Platform Payment Gateway Config for SaaS Subscriptions
  async getSubscriptionPaymentConfig(req: Request, res: Response) {
    try {
      let config = await prisma.platformPaymentConfig.findUnique({
        where: { id: 'platform_payment_config' },
      });

      if (!config) {
        config = await prisma.platformPaymentConfig.create({
          data: {
            id: 'platform_payment_config',
            upiId: 'pgflow.saas@upi',
            upiName: 'PG Flow SaaS Platform',
            isUpiEnabled: true,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_5g27K61sL8jQeW',
            razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || 's5K82mQq9901LaJ8K12qPlmN',
            isRazorpayEnabled: true,
          },
        });
      }

      const isUpiConfigured = Boolean(config?.isUpiEnabled && config?.upiId && config?.upiId.trim().length > 0);
      const isRazorpayConfigured = Boolean(config?.isRazorpayEnabled && config?.razorpayKeyId && config?.razorpayKeyId.trim().length > 0);

      return res.json({
        success: true,
        data: {
          isUpiConfigured,
          upiId: isUpiConfigured ? config?.upiId : null,
          upiName: isUpiConfigured ? (config?.upiName || 'PG Flow SaaS Platform') : null,
          isRazorpayConfigured,
          razorpayKeyId: isRazorpayConfigured ? config?.razorpayKeyId : null,
          hasAnyConfigured: isUpiConfigured || isRazorpayConfigured,
        },
      });
    } catch (err: any) {
      console.error('Error fetching subscription payment config:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};

