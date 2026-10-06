import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';

export const AdminController = {
  // 1. Get Platform-wide KPIs & MRR
  async getPlatformMetrics(req: Request, res: Response) {
    try {
      const [totalOwners, totalProperties, totalBeds, occupiedBeds, activeSubscriptions, plans] = await Promise.all([
        prisma.organization.count(),
        prisma.property.count(),
        prisma.bed.count(),
        prisma.bed.count({ where: { status: 'OCCUPIED' } }),
        prisma.organizationSubscription.findMany({
          where: { status: { in: ['ACTIVE', 'TRIAL'] } },
          include: { plan: true },
        }),
        prisma.subscriptionPlan.findMany(),
      ]);

      // Calculate Monthly Recurring Revenue (MRR) from active plans
      const mrr = activeSubscriptions.reduce((sum, sub) => {
        return sum + Number(sub.plan?.priceMonthly || 0);
      }, 0);

      // Total rent volume invoiced across all properties
      const invoicesAgg = await prisma.invoice.aggregate({
        _sum: { totalDue: true, amountPaid: true },
      });

      return res.json({
        success: true,
        data: {
          totalOwners,
          totalProperties,
          totalBeds,
          occupiedBeds,
          vacantBeds: totalBeds - occupiedBeds,
          occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
          activeSubscriptionsCount: activeSubscriptions.length,
          mrr,
          totalGmv: Number(invoicesAgg._sum.totalDue || 0),
          totalCollectedGmv: Number(invoicesAgg._sum.amountPaid || 0),
        },
      });
    } catch (err: any) {
      console.error('Error fetching admin metrics:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // 2. List All PG Owners (Organizations)
  async listOrganizations(req: Request, res: Response) {
    try {
      const search = req.query.search as string | undefined;

      const organizations = await prisma.organization.findMany({
        where: search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { ownerEmail: { contains: search, mode: 'insensitive' } },
                { ownerPhone: { contains: search } },
              ],
            }
          : undefined,
        include: {
          properties: {
            select: {
              id: true,
              name: true,
              city: true,
              _count: { select: { rooms: true } },
            },
          },
          subscriptions: {
            include: { plan: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          users: {
            where: { role: 'OWNER' },
            select: { id: true, fullName: true, email: true, phone: true },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Augment with total beds per organization
      const augmented = await Promise.all(
        organizations.map(async (org) => {
          const totalBeds = await prisma.bed.count({
            where: { room: { property: { organizationId: org.id } } },
          });
          const occupiedBeds = await prisma.bed.count({
            where: {
              status: 'OCCUPIED',
              room: { property: { organizationId: org.id } },
            },
          });

          return {
            ...org,
            totalBeds,
            occupiedBeds,
            currentSubscription: org.subscriptions[0] || null,
            primaryOwner: org.users[0] || null,
          };
        })
      );

      return res.json({ success: true, data: augmented });
    } catch (err: any) {
      console.error('Error listing organizations:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // 3. Update PG Owner Account Status (Active / Suspended)
  async updateOrganizationStatus(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { status } = req.body;

      if (!status || !['ACTIVE', 'SUSPENDED'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Valid status (ACTIVE or SUSPENDED) is required' });
      }

      const updated = await prisma.organization.update({
        where: { id },
        data: { status },
      });

      return res.json({
        success: true,
        data: updated,
        message: `PG Owner account status set to ${status}.`,
      });
    } catch (err: any) {
      console.error('Error updating org status:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // 4. Update / Extend PG Owner Subscription
  async updateOrganizationSubscription(req: Request, res: Response) {
    try {
      const id = req.params.id as string; // organizationId
      const { planId, status, extendMonths } = req.body;

      const currentSub = await prisma.organizationSubscription.findFirst({
        where: { organizationId: id },
        orderBy: { createdAt: 'desc' },
      });

      let newEndDate = currentSub?.endDate ? new Date(currentSub.endDate) : new Date();
      if (extendMonths && Number(extendMonths) > 0) {
        newEndDate.setMonth(newEndDate.getMonth() + Number(extendMonths));
      }

      let sub;
      if (currentSub) {
        sub = await prisma.organizationSubscription.update({
          where: { id: currentSub.id },
          data: {
            ...(planId ? { planId } : {}),
            ...(status ? { status } : {}),
            endDate: newEndDate,
          },
          include: { plan: true },
        });
      } else {
        sub = await prisma.organizationSubscription.create({
          data: {
            organizationId: id,
            planId: planId || '',
            status: status || 'ACTIVE',
            endDate: newEndDate,
          },
          include: { plan: true },
        });
      }

      return res.json({
        success: true,
        data: sub,
        message: 'Organization subscription updated successfully.',
      });
    } catch (err: any) {
      console.error('Error updating subscription:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // 5. List All SaaS Subscription Plans
  async listPlans(req: Request, res: Response) {
    try {
      const plans = await prisma.subscriptionPlan.findMany({
        orderBy: { priceMonthly: 'asc' },
        include: {
          _count: {
            select: { subscriptions: true },
          },
        },
      });

      return res.json({ success: true, data: plans });
    } catch (err: any) {
      console.error('Error listing plans:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // 6. Create New SaaS Subscription Plan
  async createPlan(req: Request, res: Response) {
    try {
      const { name, description, priceMonthly, priceYearly, maxProperties, maxBeds, features } = req.body;

      if (!name || priceMonthly === undefined) {
        return res.status(400).json({ success: false, message: 'Plan name and priceMonthly are required.' });
      }

      const plan = await prisma.subscriptionPlan.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          priceMonthly: Number(priceMonthly),
          priceYearly: Number(priceYearly || Number(priceMonthly) * 10),
          maxProperties: parseInt(maxProperties, 10) || 1,
          maxBeds: parseInt(maxBeds, 10) || 50,
          features: Array.isArray(features) ? features : [],
          isActive: true,
        },
      });

      return res.status(201).json({ success: true, data: plan, message: 'Subscription plan created.' });
    } catch (err: any) {
      console.error('Error creating plan:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // 7. Update SaaS Subscription Plan
  async updatePlan(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { name, description, priceMonthly, priceYearly, maxProperties, maxBeds, features, isActive } = req.body;

      const plan = await prisma.subscriptionPlan.update({
        where: { id },
        data: {
          ...(name ? { name: name.trim() } : {}),
          ...(description !== undefined ? { description: description ? description.trim() : null } : {}),
          ...(priceMonthly !== undefined ? { priceMonthly: Number(priceMonthly) } : {}),
          ...(priceYearly !== undefined ? { priceYearly: Number(priceYearly) } : {}),
          ...(maxProperties !== undefined ? { maxProperties: parseInt(maxProperties, 10) } : {}),
          ...(maxBeds !== undefined ? { maxBeds: parseInt(maxBeds, 10) } : {}),
          ...(features !== undefined ? { features: Array.isArray(features) ? features : [] } : {}),
          ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        },
      });

      return res.json({ success: true, data: plan, message: 'Subscription plan updated.' });
    } catch (err: any) {
      console.error('Error updating plan:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // 8. Fetch Platform Payment Configuration for Super Admin
  async getPaymentConfig(req: Request, res: Response) {
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

      return res.json({
        success: true,
        data: {
          upiId: config.upiId || '',
          upiName: config.upiName || '',
          isUpiEnabled: config.isUpiEnabled,
          razorpayKeyId: config.razorpayKeyId || '',
          razorpayKeySecret: config.razorpayKeySecret || '',
          isRazorpayEnabled: config.isRazorpayEnabled,
        },
      });
    } catch (err: any) {
      console.error('Error fetching platform payment config:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // 9. Update Platform Payment Configuration by Super Admin
  async updatePaymentConfig(req: Request, res: Response) {
    try {
      const { upiId, upiName, isUpiEnabled, razorpayKeyId, razorpayKeySecret, isRazorpayEnabled } = req.body;

      const config = await prisma.platformPaymentConfig.upsert({
        where: { id: 'platform_payment_config' },
        create: {
          id: 'platform_payment_config',
          upiId: upiId !== undefined ? String(upiId).trim() : null,
          upiName: upiName !== undefined ? String(upiName).trim() : null,
          isUpiEnabled: Boolean(isUpiEnabled),
          razorpayKeyId: razorpayKeyId !== undefined ? String(razorpayKeyId).trim() : null,
          razorpayKeySecret: razorpayKeySecret !== undefined ? String(razorpayKeySecret).trim() : null,
          isRazorpayEnabled: Boolean(isRazorpayEnabled),
        },
        update: {
          ...(upiId !== undefined ? { upiId: String(upiId).trim() || null } : {}),
          ...(upiName !== undefined ? { upiName: String(upiName).trim() || null } : {}),
          ...(isUpiEnabled !== undefined ? { isUpiEnabled: Boolean(isUpiEnabled) } : {}),
          ...(razorpayKeyId !== undefined ? { razorpayKeyId: String(razorpayKeyId).trim() || null } : {}),
          ...(razorpayKeySecret !== undefined ? { razorpayKeySecret: String(razorpayKeySecret).trim() || null } : {}),
          ...(isRazorpayEnabled !== undefined ? { isRazorpayEnabled: Boolean(isRazorpayEnabled) } : {}),
        },
      });

      return res.json({
        success: true,
        data: config,
        message: 'Platform payment configuration updated successfully.',
      });
    } catch (err: any) {
      console.error('Error updating platform payment config:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};

