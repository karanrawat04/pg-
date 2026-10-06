import { Router } from 'express';
import { ComplaintsController } from './complaints.controller.js';

export const complaintsRouter = Router();

// Raise complaint (Message + max 3 media items)
complaintsRouter.post('/', ComplaintsController.raiseComplaint);

// List complaints (filter by propertyId, status)
complaintsRouter.get('/', ComplaintsController.listComplaints);

// Update status (OPEN, IN_PROGRESS, RESOLVED)
complaintsRouter.patch('/:id/status', ComplaintsController.updateComplaintStatus);

// Pre-signed URL for direct image/video cloud upload
complaintsRouter.post('/presigned-url', ComplaintsController.getUploadUrl);
