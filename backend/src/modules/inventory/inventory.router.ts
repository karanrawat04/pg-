import { Router } from 'express';
import { InventoryController } from './inventory.controller.js';

export const inventoryRouter = Router();

// Get visual floor-room-bed grid for building
inventoryRouter.get('/properties/:propertyId/grid', InventoryController.getBuildingInventoryGrid);

// Find vacant beds for new tenant allocation
inventoryRouter.get('/properties/:propertyId/vacant-beds', InventoryController.getVacantBeds);

// Add floor to building
inventoryRouter.post('/floors', InventoryController.addFloor);

// Create new room with beds
inventoryRouter.post('/rooms', InventoryController.createRoom);

// Update room details
inventoryRouter.patch('/rooms/:roomId', InventoryController.updateRoom);

// Delete room
inventoryRouter.delete('/rooms/:roomId', InventoryController.deleteRoom);

// Add single bed to room
inventoryRouter.post('/rooms/:roomId/beds', InventoryController.addBedToRoom);

// Update details of specific bed (bedNumber, customRent, status)
inventoryRouter.patch('/beds/:bedId', InventoryController.updateBed);

// Update status of specific bed
inventoryRouter.patch('/beds/:bedId/status', InventoryController.updateBedStatus);

// Delete vacant bed
inventoryRouter.delete('/beds/:bedId', InventoryController.deleteBed);
