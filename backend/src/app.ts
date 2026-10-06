import express from 'express';
import cors from 'cors';
import { authRouter } from './modules/auth/auth.router.js';
import { adminRouter } from './modules/admin/admin.router.js';
import { propertiesRouter } from './modules/properties/properties.router.js';
import { inventoryRouter } from './modules/inventory/inventory.router.js';
import { tenantsRouter } from './modules/tenants/tenants.router.js';
import { billingRouter } from './modules/billing/billing.router.js';
import { complaintsRouter } from './modules/complaints/complaints.router.js';

export const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Healthcheck Route
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PG Flow Core API',
    timestamp: new Date().toISOString(),
  });
});

// Modular Routes
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/tenants', tenantsRouter);
app.use('/api/billing', billingRouter);
app.use('/api/complaints', complaintsRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});
