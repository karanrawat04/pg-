import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authenticateToken } from './auth.middleware.js';

export const authRouter = Router();

// Send OTP to email
authRouter.post('/send-otp', AuthController.sendOtp);

// Verify OTP and issue JWT session
authRouter.post('/verify-otp', AuthController.verifyOtp);

// Register new PG Owner business account
authRouter.post('/register-owner', AuthController.registerOwner);

// Fetch current user session
authRouter.get('/me', AuthController.me);

// SaaS Subscription Management for PG Owners
authRouter.get('/plans', AuthController.getPlans);
authRouter.get('/subscription', authenticateToken as any, AuthController.getMySubscription);
authRouter.post('/subscription/renew', authenticateToken as any, AuthController.renewSubscription);
authRouter.post('/subscription/upgrade', authenticateToken as any, AuthController.upgradeSubscription);
authRouter.post('/subscription/initiate-checkout', authenticateToken as any, AuthController.initiateSubscriptionCheckout);
authRouter.post('/subscription/confirm-checkout', authenticateToken as any, AuthController.confirmSubscriptionCheckout);
authRouter.get('/subscription/payment-config', AuthController.getSubscriptionPaymentConfig);
authRouter.post('/subscription/razorpay/create-order', authenticateToken as any, AuthController.createRazorpaySubscriptionOrder);
authRouter.post('/subscription/razorpay/verify', authenticateToken as any, AuthController.verifyRazorpaySubscriptionPayment);
authRouter.post('/subscription/upi/submit-utr', authenticateToken as any, AuthController.submitSubscriptionUpiUtr);


