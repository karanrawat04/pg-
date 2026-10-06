import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { authenticateToken, requireRole } from '../auth/auth.middleware.js';

export const adminRouter = Router();

// Secure all admin routes to SUPER_ADMIN role
adminRouter.use(authenticateToken as any, requireRole('SUPER_ADMIN') as any);

// 1. Platform KPIs & MRR metrics
adminRouter.get('/metrics', AdminController.getPlatformMetrics);

// 2. PG Owners / Organizations Management
adminRouter.get('/organizations', AdminController.listOrganizations);
adminRouter.patch('/organizations/:id/status', AdminController.updateOrganizationStatus);
adminRouter.post('/organizations/:id/subscription', AdminController.updateOrganizationSubscription);

// 3. SaaS Subscription Plans Management
adminRouter.get('/plans', AdminController.listPlans);
adminRouter.post('/plans', AdminController.createPlan);
adminRouter.patch('/plans/:id', AdminController.updatePlan);

// 4. Platform Payment Gateway & UPI Configuration
adminRouter.get('/payment-config', AdminController.getPaymentConfig);
adminRouter.put('/payment-config', AdminController.updatePaymentConfig);

