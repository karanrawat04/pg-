import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';

export const ComplaintsController = {
  // 1. Raise New Complaint (Tenant Portal)
  async raiseComplaint(req: Request, res: Response) {
    try {
      const { propertyId, roomId, tenantId, category, message, mediaUrls } = req.body;

      if (!propertyId || !tenantId || !message) {
        return res.status(400).json({
          success: false,
          message: 'propertyId, tenantId, and message are required',
        });
      }

      // Enforce user rule: NOT MORE THAN 3 MEDIA ITEMS
      const mediaList = Array.isArray(mediaUrls) ? mediaUrls : [];
      if (mediaList.length > 3) {
        return res.status(400).json({
          success: false,
          message: 'You can upload a maximum of 3 media files (images or video).',
        });
      }

      const complaint = await prisma.complaint.create({
        data: {
          propertyId,
          roomId: roomId || null,
          tenantId,
          category: category || 'OTHER',
          message,
          mediaUrls: mediaList,
          status: 'OPEN',
        },
        include: {
          property: { select: { name: true } },
          room: { select: { roomNumber: true } },
        },
      });

      return res.status(201).json({ success: true, data: complaint });
    } catch (error: any) {
      console.error('Error raising complaint:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // 2. List Complaints for PG Owner (Filtered by Property & Status)
  async listComplaints(req: Request, res: Response) {
    try {
      const { propertyId, status } = req.query;

      const complaints = await prisma.complaint.findMany({
        where: {
          ...(propertyId ? { propertyId: String(propertyId) } : {}),
          ...(status ? { status: status as any } : {}),
        },
        include: {
          property: { select: { id: true, name: true } },
          room: { select: { id: true, roomNumber: true } },
          tenant: {
            include: {
              user: { select: { fullName: true, phone: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.json({ success: true, data: complaints });
    } catch (error: any) {
      console.error('Error listing complaints:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // 3. Update Complaint Status (Owner / Staff action)
  async updateComplaintStatus(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { status } = req.body;

      if (!['OPEN', 'IN_PROGRESS', 'RESOLVED'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status must be OPEN, IN_PROGRESS, or RESOLVED',
        });
      }

      const complaint = await prisma.complaint.update({
        where: { id },
        data: {
          status,
          resolvedAt: status === 'RESOLVED' ? new Date() : null,
        },
      });

      return res.json({ success: true, data: complaint });
    } catch (error: any) {
      console.error('Error updating complaint status:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // 4. Generate Pre-signed Upload URL for Direct Cloud Uploads (Images/Video)
  async getUploadUrl(req: Request, res: Response) {
    try {
      const { fileType, fileName } = req.body;

      if (!fileType) {
        return res.status(400).json({ success: false, message: 'fileType is required' });
      }

      // Generate a mock or real cloudflare/S3 pre-signed upload URL
      const uniqueKey = `complaints/${Date.now()}-${fileName || 'media'}`;
      const uploadUrl = `https://storage.pgflow.com/upload/${uniqueKey}?signature=valid-upload-token`;
      const publicUrl = `https://cdn.pgflow.com/${uniqueKey}`;

      return res.json({
        success: true,
        data: {
          uploadUrl,
          publicUrl,
          key: uniqueKey,
        },
      });
    } catch (error: any) {
      console.error('Error generating upload URL:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },
};
