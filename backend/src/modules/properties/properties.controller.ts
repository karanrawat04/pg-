import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { AuthRequest } from '../auth/auth.middleware.js';

export const PropertiesController = {
  // 1. List all properties (Strictly isolated by Organization / Role)
  async listProperties(req: AuthRequest, res: Response) {
    try {
      const user = req.user;
      let whereClause: any = undefined;

      if (user) {
        if (user.role === 'SUPER_ADMIN') {
          // Super admin can filter by query organizationId or see all
          const queryOrgId = req.query.organizationId as string | undefined;
          whereClause = queryOrgId ? { organizationId: queryOrgId } : undefined;
        } else if (user.role === 'OWNER' || user.role === 'STAFF') {
          // PG Owners and Staff must strictly see only their own organization's properties
          const orgId = user.organizationId || (req.query.organizationId as string);
          if (!orgId) {
            return res.json({ success: true, data: [] });
          }
          whereClause = { organizationId: orgId };
        } else if (user.role === 'TENANT') {
          // Resident only sees the property where they have an active stay
          const activeStay = await prisma.tenantStay.findFirst({
            where: {
              tenant: { userId: user.userId },
              status: { in: ['ACTIVE', 'NOTICE_PERIOD'] },
            },
            include: {
              bed: {
                include: { room: true },
              },
            },
          });

          if (!activeStay?.bed?.room?.propertyId) {
            return res.json({ success: true, data: [] });
          }
          whereClause = { id: activeStay.bed.room.propertyId };
        }
      } else {
        // Unauthenticated or fallback by query or x-organization-id header
        const orgId = (req.query.organizationId as string) || (req.headers['x-organization-id'] as string);
        if (orgId) {
          whereClause = { organizationId: orgId };
        } else {
          // Never leak cross-organization properties without an organization scope
          return res.json({ success: true, data: [] });
        }
      }

      const properties = await prisma.property.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          genderType: true,
          totalFloors: true,
          amenities: true,
          _count: {
            select: {
              rooms: true,
              complaints: {
                where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      return res.json({ success: true, data: properties });
    } catch (error: any) {
      console.error('Error listing properties:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // 2. Get Single Property Details with Floors, Rooms & Beds
  async getPropertyById(req: Request, res: Response) {
    try {
      const id = req.params.id as string;

      const property = await prisma.property.findUnique({
        where: { id },
        include: {
          floors: {
            orderBy: { floorNumber: 'asc' },
            include: {
              rooms: {
                orderBy: { roomNumber: 'asc' },
                include: {
                  beds: {
                    orderBy: { bedNumber: 'asc' },
                    include: {
                      stays: {
                        where: { status: { in: ['ACTIVE', 'NOTICE_PERIOD'] } },
                        include: {
                          tenant: {
                            include: {
                              user: {
                                select: {
                                  fullName: true,
                                  phone: true,
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!property) {
        return res.status(404).json({ success: false, message: 'Property not found' });
      }

      return res.json({ success: true, data: property });
    } catch (error: any) {
      console.error('Error fetching property:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // 3. Property-Scoped Dashboard Metrics (For Owner Dashboard)
  async getPropertyDashboard(req: Request, res: Response) {
    try {
      const id = req.params.id as string;

      // Bed Occupancy Statistics
      const beds = await prisma.bed.findMany({
        where: {
          room: { propertyId: id },
        },
        select: { status: true },
      });

      const totalBeds = beds.length;
      const occupiedBeds = beds.filter((b) => b.status === 'OCCUPIED').length;
      const vacantBeds = beds.filter((b) => b.status === 'VACANT').length;
      const reservedBeds = beds.filter((b) => b.status === 'RESERVED').length;

      // Invoicing & Revenue Stats (Current Month)
      const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
      const invoices = await prisma.invoice.findMany({
        where: {
          billingMonth: currentMonth,
          stay: {
            bed: {
              room: { propertyId: id },
            },
          },
        },
        select: {
          totalDue: true,
          amountPaid: true,
          status: true,
        },
      });

      let totalExpectedRent = 0;
      let totalCollectedRent = 0;
      let totalOverdueRent = 0;
      let overdueTenantsCount = 0;

      for (const inv of invoices) {
        const due = Number(inv.totalDue);
        const paid = Number(inv.amountPaid);
        totalExpectedRent += due;
        totalCollectedRent += paid;

        if (inv.status === 'OVERDUE' || (due > paid && inv.status !== 'PAID')) {
          totalOverdueRent += due - paid;
          overdueTenantsCount++;
        }
      }

      // Complaints Stats (Simplified: Open, In Progress, Resolved)
      const complaints = await prisma.complaint.findMany({
        where: { propertyId: id },
        select: { status: true },
      });

      const openComplaints = complaints.filter((c) => c.status === 'OPEN').length;
      const inProgressComplaints = complaints.filter((c) => c.status === 'IN_PROGRESS').length;
      const resolvedComplaints = complaints.filter((c) => c.status === 'RESOLVED').length;

      return res.json({
        success: true,
        data: {
          propertyId: id,
          billingMonth: currentMonth,
          occupancy: {
            totalBeds,
            occupiedBeds,
            vacantBeds,
            reservedBeds,
            occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
          },
          financials: {
            expected: totalExpectedRent,
            collected: totalCollectedRent,
            overdue: totalOverdueRent,
            overdueTenantsCount,
          },
          complaints: {
            open: openComplaints,
            inProgress: inProgressComplaints,
            resolved: resolvedComplaints,
            total: complaints.length,
          },
        },
      });
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // 4. Create New Property (with automatic floor creation)
  async createProperty(req: AuthRequest, res: Response) {
    try {
      const {
        organizationId,
        name,
        address,
        city,
        genderType,
        totalFloors,
        hasGroundFloor = true,
        hasBasement = false,
        amenities,
      } = req.body;

      if (!name || !city) {
        return res.status(400).json({
          success: false,
          message: 'name and city are required',
        });
      }

      // Resolve organization ID from authenticated user, payload, or header
      const user = req.user;
      let orgId = organizationId || user?.organizationId || (req.headers['x-organization-id'] as string);

      if (!orgId) {
        return res.status(400).json({
          success: false,
          message: 'Organization ID is required to create a property. Please log in as a PG Owner.',
        });
      }

      // Check organization suspension & SaaS plan limits
      const org = await prisma.organization.findUnique({
        where: { id: orgId },
        include: {
          subscriptions: {
            where: { status: { in: ['ACTIVE', 'TRIAL'] } },
            include: { plan: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!org) {
        return res.status(404).json({ success: false, message: 'Organization not found.' });
      }

      if (org.status === 'SUSPENDED') {
        return res.status(403).json({
          success: false,
          message: 'Your PG account is currently suspended. You cannot create new buildings.',
        });
      }

      const currentSub = org.subscriptions[0];
      if (currentSub?.plan) {
        const existingCount = await prisma.property.count({ where: { organizationId: orgId } });
        if (existingCount >= currentSub.plan.maxProperties) {
          return res.status(403).json({
            success: false,
            message: `Plan Limit Reached: Your current plan (${currentSub.plan.name}) allows up to ${currentSub.plan.maxProperties} PG building(s). Please upgrade your plan in the Admin Portal to add more properties.`,
          });
        }
      }

      const numUpperFloors = Math.max(0, parseInt(totalFloors || '2', 10));

      const property = await prisma.$transaction(async (tx) => {
        // Automatically prepare Floor records
        const floorRecords = [];

        if (hasBasement) {
          floorRecords.push({
            floorNumber: -1,
            name: 'Basement Floor (B1)',
          });
        }

        if (hasGroundFloor) {
          floorRecords.push({
            floorNumber: 0,
            name: 'Ground Floor',
          });
        }

        for (let i = 1; i <= numUpperFloors; i++) {
          const floorLabel = i === 1 ? '1st Floor' : i === 2 ? '2nd Floor' : i === 3 ? '3rd Floor' : `${i}th Floor`;
          floorRecords.push({
            floorNumber: i,
            name: floorLabel,
          });
        }

        // If somehow no floors were selected, default to at least Ground Floor
        if (floorRecords.length === 0) {
          floorRecords.push({
            floorNumber: 0,
            name: 'Ground Floor',
          });
        }

        const prop = await tx.property.create({
          data: {
            organizationId: orgId,
            name,
            address: address || '',
            city,
            genderType: genderType || 'UNISEX',
            totalFloors: floorRecords.length,
            amenities: Array.isArray(amenities) ? amenities : [],
          },
        });

        await tx.floor.createMany({
          data: floorRecords.map((f) => ({
            ...f,
            propertyId: prop.id,
          })),
        });

        return tx.property.findUnique({
          where: { id: prop.id },
          include: { floors: { orderBy: { floorNumber: 'asc' } } },
        });
      });

      return res.status(201).json({ success: true, data: property });
    } catch (error: any) {
      console.error('Error creating property:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // 5. Update Property Details
  async updateProperty(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const user = req.user;

      if (user && user.role !== 'SUPER_ADMIN') {
        const existing = await prisma.property.findUnique({ where: { id } });
        if (!existing || existing.organizationId !== user.organizationId) {
          return res.status(403).json({ success: false, message: 'Unauthorized to modify this property.' });
        }
      }

      const {
        name,
        city,
        address,
        genderType,
        amenities,
        hasGroundFloor,
        hasBasement,
        upperFloors,
        totalFloors,
      } = req.body;

      // Normalize genderType if needed (COED -> UNISEX, MENS -> MALE, WOMENS -> FEMALE)
      let normalizedGender = genderType;
      if (genderType === 'COED') normalizedGender = 'UNISEX';
      else if (genderType === 'MENS') normalizedGender = 'MALE';
      else if (genderType === 'WOMENS') normalizedGender = 'FEMALE';

      const existingProp = await prisma.property.findUnique({
        where: { id },
        include: {
          floors: {
            orderBy: { floorNumber: 'asc' },
            include: {
              rooms: {
                include: {
                  beds: {
                    include: {
                      stays: { where: { status: { in: ['ACTIVE', 'NOTICE_PERIOD'] } } },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!existingProp) {
        return res.status(404).json({ success: false, message: 'Property not found' });
      }

      const updated = await prisma.$transaction(async (tx) => {
        // 1. Manage Ground Floor (floorNumber: 0)
        if (hasGroundFloor !== undefined) {
          const groundFloor = existingProp.floors.find((f) => f.floorNumber === 0);
          if (hasGroundFloor && !groundFloor) {
            await tx.floor.create({
              data: { propertyId: id, floorNumber: 0, name: 'Ground Floor' },
            });
          } else if (!hasGroundFloor && groundFloor) {
            if (groundFloor.rooms.length > 0) {
              const hasActiveStays = groundFloor.rooms.some((r) =>
                r.beds.some((b) => b.stays.length > 0)
              );
              if (hasActiveStays) {
                throw new Error(
                  'Cannot remove Ground Floor because it contains rooms with active resident stays.'
                );
              }
              for (const r of groundFloor.rooms) {
                await tx.bed.deleteMany({ where: { roomId: r.id } });
                await tx.room.delete({ where: { id: r.id } });
              }
            }
            await tx.floor.delete({ where: { id: groundFloor.id } });
          }
        }

        // 2. Manage Basement Floor (floorNumber: -1)
        if (hasBasement !== undefined) {
          const basementFloor = existingProp.floors.find((f) => f.floorNumber === -1);
          if (hasBasement && !basementFloor) {
            await tx.floor.create({
              data: { propertyId: id, floorNumber: -1, name: 'Basement Floor (B1)' },
            });
          } else if (!hasBasement && basementFloor) {
            if (basementFloor.rooms.length > 0) {
              const hasActiveStays = basementFloor.rooms.some((r) =>
                r.beds.some((b) => b.stays.length > 0)
              );
              if (hasActiveStays) {
                throw new Error(
                  'Cannot remove Basement Floor because it contains rooms with active resident stays.'
                );
              }
              for (const r of basementFloor.rooms) {
                await tx.bed.deleteMany({ where: { roomId: r.id } });
                await tx.room.delete({ where: { id: r.id } });
              }
            }
            await tx.floor.delete({ where: { id: basementFloor.id } });
          }
        }

        // 3. Manage Upper Floors (floorNumber > 0)
        if (upperFloors !== undefined) {
          const targetUpper = Math.max(0, parseInt(String(upperFloors), 10));
          const currentUpper = existingProp.floors.filter((f) => f.floorNumber > 0);

          if (targetUpper > currentUpper.length) {
            const maxUpperNum =
              currentUpper.length > 0
                ? Math.max(...currentUpper.map((f) => f.floorNumber))
                : 0;
            const extraCount = targetUpper - currentUpper.length;
            for (let i = 1; i <= extraCount; i++) {
              const nextNum = maxUpperNum + i;
              const label =
                nextNum === 1
                  ? '1st Floor'
                  : nextNum === 2
                  ? '2nd Floor'
                  : nextNum === 3
                  ? '3rd Floor'
                  : `${nextNum}th Floor`;
              await tx.floor.create({
                data: { propertyId: id, floorNumber: nextNum, name: label },
              });
            }
          } else if (targetUpper < currentUpper.length) {
            const floorsToRemove = currentUpper.slice(targetUpper);
            for (const f of floorsToRemove) {
              if (f.rooms.length > 0) {
                const hasActiveStays = f.rooms.some((r) =>
                  r.beds.some((b) => b.stays.length > 0)
                );
                if (hasActiveStays) {
                  throw new Error(
                    `Cannot remove ${f.name} because it contains rooms with active resident stays.`
                  );
                }
                for (const r of f.rooms) {
                  await tx.bed.deleteMany({ where: { roomId: r.id } });
                  await tx.room.delete({ where: { id: r.id } });
                }
              }
              await tx.floor.delete({ where: { id: f.id } });
            }
          }
        }

        // 4. Calculate final total floor count
        const finalTotalFloors = await tx.floor.count({ where: { propertyId: id } });

        // 5. Update Property metadata
        const prop = await tx.property.update({
          where: { id },
          data: {
            ...(name ? { name: String(name).trim() } : {}),
            ...(city ? { city: String(city).trim() } : {}),
            ...(address !== undefined ? { address: String(address).trim() } : {}),
            ...(normalizedGender ? { genderType: normalizedGender } : {}),
            ...(amenities ? { amenities } : {}),
            totalFloors: finalTotalFloors,
          },
          include: {
            floors: { orderBy: { floorNumber: 'asc' } },
          },
        });

        return prop;
      });

      return res.json({ success: true, data: updated, message: 'Property updated successfully' });
    } catch (err: any) {
      console.error('Error updating property:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // 6. Delete Property (Validates ownership & no active resident stays exist)
  async deleteProperty(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const user = req.user;

      if (user && user.role !== 'SUPER_ADMIN') {
        const existing = await prisma.property.findUnique({ where: { id } });
        if (!existing || existing.organizationId !== user.organizationId) {
          return res.status(403).json({ success: false, message: 'Unauthorized to delete this property.' });
        }
      }

      const activeStays = await prisma.tenantStay.count({
        where: {
          status: { in: ['ACTIVE', 'NOTICE_PERIOD'] },
          bed: { room: { propertyId: id } },
        },
      });

      if (activeStays > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete building with ${activeStays} active resident stay(s). Check out all residents first.`,
        });
      }

      await prisma.property.delete({ where: { id } });
      return res.json({ success: true, message: 'Building deleted successfully.' });
    } catch (err: any) {
      console.error('Error deleting property:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};
