import { Router } from 'express';
import { PropertiesController } from './properties.controller.js';
import { optionalAuthenticateToken } from '../auth/auth.middleware.js';

export const propertiesRouter = Router();

// Extract authenticated session if provided
propertiesRouter.use(optionalAuthenticateToken as any);

// Dropdown list of all properties
propertiesRouter.get('/', PropertiesController.listProperties);

// Single property details
propertiesRouter.get('/:id', PropertiesController.getPropertyById);

// Building-scoped dashboard statistics
propertiesRouter.get('/:id/dashboard', PropertiesController.getPropertyDashboard);

// Add new property
propertiesRouter.post('/', PropertiesController.createProperty);

// Update property
propertiesRouter.patch('/:id', PropertiesController.updateProperty);

// Delete property
propertiesRouter.delete('/:id', PropertiesController.deleteProperty);
