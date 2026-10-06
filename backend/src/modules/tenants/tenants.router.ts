import { Router } from 'express';
import { TenantsController } from './tenants.controller.js';

export const tenantsRouter = Router();

// List tenants (supports ?propertyId=xyz)
tenantsRouter.get('/', TenantsController.listTenants);

// Onboard new tenant (supports 1 or more beds)
tenantsRouter.post('/onboard', TenantsController.onboardTenant);

// Single tenant details
tenantsRouter.get('/:id', TenantsController.getTenantDetails);

// Checkout tenant / free all allocated beds
tenantsRouter.post('/:id/checkout', TenantsController.checkoutTenant);

// Shift bed
tenantsRouter.post('/shift-bed', TenantsController.shiftBed);

// Update tenant profile details
tenantsRouter.patch('/:id', TenantsController.updateTenant);

// Revise monthly rent / escalation
tenantsRouter.post('/:id/revise-rent', TenantsController.reviseRent);

// Delete tenant with confirmation
tenantsRouter.delete('/:id', TenantsController.deleteTenant);

