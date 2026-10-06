import { Router } from 'express';
import { BillingController } from './billing.controller.js';
import { authenticateToken } from '../auth/auth.middleware.js';

export const billingRouter = Router();

// List invoices (filter by propertyId, status, billingMonth)
billingRouter.get('/invoices', BillingController.listInvoices);

// Active dues for tenant
billingRouter.get('/invoices/tenant/:tenantId', BillingController.getTenantActiveDues);

// Payment Gateway Configuration Endpoints
billingRouter.get('/payment-config/owner', authenticateToken as any, BillingController.getOwnerPaymentConfig);
billingRouter.patch('/payment-config/owner', authenticateToken as any, BillingController.updateOwnerPaymentConfig);
billingRouter.get('/payment-config/tenant/:invoiceId', BillingController.getTenantInvoicePaymentConfig);

// Initiate zero-fee UPI payment
billingRouter.post('/pay/initiate', BillingController.initiateUpiPayment);

// Real Razorpay Rent Payment Integration
billingRouter.post('/pay/razorpay/create-order', BillingController.createRazorpayRentOrder);
billingRouter.post('/pay/razorpay/verify', BillingController.verifyRazorpayRentPayment);

// Payment confirmation webhook & manual verification
billingRouter.post('/pay/webhook', BillingController.handlePaymentWebhook);
billingRouter.post('/pay/verify', BillingController.handlePaymentWebhook);

// Offline cash collection entry
billingRouter.post('/pay/cash', BillingController.recordCashPayment);

// Get printable/downloadable receipt
billingRouter.get('/invoices/:invoiceId/receipt', BillingController.getInvoiceReceipt);
