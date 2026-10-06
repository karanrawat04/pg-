import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';

export const InventoryController = {
  // 1. Get Floor-Room-Bed Visual Grid for a Building
  async getBuildingInventoryGrid(req: Request, res: Response) {
    try {
      const propertyId = req.params.propertyId as string;

      const floors = await prisma.floor.findMany({
        where: { propertyId },
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
      });

      // Self-Healing Reconciliation: Ensure any OCCUPIED bed actually has an active stay
      const orphanedBedIds: string[] = [];
      for (const floor of floors) {
        for (const room of floor.rooms) {
          for (const bed of room.beds) {
            if (bed.status === 'OCCUPIED' && bed.stays.length === 0) {
              orphanedBedIds.push(bed.id);
              (bed as any).status = 'VACANT';
            }
          }
        }
      }

      if (orphanedBedIds.length > 0) {
        prisma.bed.updateMany({
          where: { id: { in: orphanedBedIds } },
          data: { status: 'VACANT' },
        }).catch((err) => console.error('Failed to auto-heal orphaned beds:', err));
      }

      return res.json({ success: true, data: floors });
    } catch (error: any) {
      console.error('Error fetching inventory grid:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // 2. Get Available / Vacant Beds in Property
  async getVacantBeds(req: Request, res: Response) {
    try {
      const propertyId = req.params.propertyId as string;
      const roomType = req.query.roomType as string | undefined;

      const vacantBeds = await prisma.bed.findMany({
        where: {
          status: 'VACANT',
          room: {
            propertyId,
            ...(roomType ? { roomType } : {}),
          },
        },
        include: {
          room: {
            select: {
              id: true,
              roomNumber: true,
              roomType: true,
              baseRent: true,
              hasAc: true,
              floor: {
                select: {
                  id: true,
                  floorNumber: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          bedNumber: 'asc',
        },
      });

      return res.json({ success: true, data: vacantBeds });
    } catch (error: any) {
      console.error('Error fetching vacant beds:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // 3. Create Room with Automatic Bed Generation
  async createRoom(req: Request, res: Response) {
    try {
      const { propertyId, floorId, roomNumber, roomType, baseRent, hasAc } = req.body;

      if (!propertyId || !floorId || !roomNumber || !baseRent) {
        return res.status(400).json({
          success: false,
          message: 'propertyId, floorId, Room Name, and baseRent are required',
        });
      }

      const trimmedName = String(roomNumber).trim();

      // Check if room with same name already exists on this floor
      const existing = await prisma.room.findFirst({
        where: {
          floorId,
          roomNumber: { equals: trimmedName, mode: 'insensitive' },
        },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: `A room named "${trimmedName}" already exists on this floor. Please choose a unique room name.`,
        });
      }

      // Map bed count strictly from Room Sharing Type
      const sharingBedsMap: Record<string, number> = {
        SINGLE: 1,
        DOUBLE: 2,
        TRIPLE: 3,
        FOUR_SHARING: 4,
      };
      const totalBeds = sharingBedsMap[roomType] || 2;

      // Create Room and Beds in a transaction
      const room = await prisma.$transaction(async (tx) => {
        const newRoom = await tx.room.create({
          data: {
            propertyId,
            floorId,
            roomNumber: trimmedName,
            roomType: roomType || 'DOUBLE',
            baseRent: Number(baseRent),
            hasAc: Boolean(hasAc),
          },
        });

        // Generate Bed records: RoomName-A, RoomName-B, etc.
        const bedLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
        const bedsData = [];

        for (let i = 0; i < totalBeds; i++) {
          bedsData.push({
            roomId: newRoom.id,
            bedNumber: `${trimmedName}-${bedLetters[i]}`,
            status: 'VACANT' as const,
            customRent: Number(baseRent),
          });
        }

        await tx.bed.createMany({
          data: bedsData,
        });

        return tx.room.findUnique({
          where: { id: newRoom.id },
          include: { beds: true },
        });
      });

      return res.status(201).json({ success: true, data: room });
    } catch (error: any) {
      console.error('Error creating room:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // 3b. Update Room Details
  async updateRoom(req: Request, res: Response) {
    try {
      const roomId = req.params.roomId as string;
      const { roomNumber, baseRent, hasAc, floorId, roomType } = req.body;

      const existingRoom = await prisma.room.findUnique({
        where: { id: roomId },
        include: {
          beds: {
            orderBy: { bedNumber: 'asc' },
            include: {
              stays: { where: { status: { in: ['ACTIVE', 'NOTICE_PERIOD'] } } },
            },
          },
        },
      });

      if (!existingRoom) {
        return res.status(404).json({ success: false, message: 'Room not found' });
      }

      const targetFloorId = floorId || existingRoom.floorId;
      const targetName = roomNumber ? String(roomNumber).trim() : existingRoom.roomNumber;
      const targetRoomType = roomType || existingRoom.roomType;

      // If room name or floor changed, verify uniqueness
      if (targetName !== existingRoom.roomNumber || targetFloorId !== existingRoom.floorId) {
        const duplicate = await prisma.room.findFirst({
          where: {
            floorId: targetFloorId,
            roomNumber: { equals: targetName, mode: 'insensitive' },
            id: { not: roomId },
          },
        });

        if (duplicate) {
          return res.status(400).json({
            success: false,
            message: `A room named "${targetName}" already exists on this floor. Please choose a unique room name.`,
          });
        }
      }

      const sharingBedsMap: Record<string, number> = {
        SINGLE: 1,
        DOUBLE: 2,
        TRIPLE: 3,
        FOUR_SHARING: 4,
      };

      const updated = await prisma.$transaction(async (tx) => {
        // 1. Bed capacity adjustment if roomType changed
        if (targetRoomType && targetRoomType !== existingRoom.roomType) {
          const targetBedCount = sharingBedsMap[targetRoomType] || existingRoom.beds.length;
          const currentBedCount = existingRoom.beds.length;

          if (targetBedCount > currentBedCount) {
            // Need to add more beds
            const bedLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
            const extraCount = targetBedCount - currentBedCount;
            for (let i = 0; i < extraCount; i++) {
              const letterIndex = currentBedCount + i;
              const letter = bedLetters[letterIndex] || `${letterIndex + 1}`;
              await tx.bed.create({
                data: {
                  roomId,
                  bedNumber: `${targetName}-${letter}`,
                  status: 'VACANT',
                  customRent: baseRent ? Number(baseRent) : existingRoom.baseRent,
                },
              });
            }
          } else if (targetBedCount < currentBedCount) {
            // Need to remove excess beds from the end
            const bedsToRemove = existingRoom.beds.slice(targetBedCount);
            const hasOccupied = bedsToRemove.some((b) => b.status === 'OCCUPIED' || b.stays.length > 0);
            if (hasOccupied) {
              throw new Error(
                `Cannot change room sharing type to ${targetRoomType} because bed(s) to be removed are currently occupied. Please vacate residents first.`
              );
            }
            for (const b of bedsToRemove) {
              await tx.bed.delete({ where: { id: b.id } });
            }
          }
        }

        // 2. Update room fields
        const room = await tx.room.update({
          where: { id: roomId },
          data: {
            roomNumber: targetName,
            floorId: targetFloorId,
            roomType: targetRoomType,
            ...(baseRent ? { baseRent: Number(baseRent) } : {}),
            ...(hasAc !== undefined ? { hasAc: Boolean(hasAc) } : {}),
          },
        });

        // 3. If room name changed, update bed numbers prefix: NewName-A, NewName-B
        if (targetName !== existingRoom.roomNumber) {
          const freshBeds = await tx.bed.findMany({ where: { roomId } });
          for (const bed of freshBeds) {
            const parts = bed.bedNumber.split('-');
            const letter = parts.length > 1 ? parts[parts.length - 1] : bed.bedNumber.slice(-1);
            await tx.bed.update({
              where: { id: bed.id },
              data: { bedNumber: `${targetName}-${letter}` },
            });
          }
        }

        return tx.room.findUnique({
          where: { id: roomId },
          include: { beds: { orderBy: { bedNumber: 'asc' } } },
        });
      });

      return res.json({ success: true, data: updated, message: 'Room updated successfully' });
    } catch (error: any) {
      console.error('Error updating room:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // 3c. Delete Room (Validates no active stays exist)
  async deleteRoom(req: Request, res: Response) {
    try {
      const roomId = req.params.roomId as string;

      const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: {
          beds: {
            include: {
              stays: { where: { status: { in: ['ACTIVE', 'NOTICE_PERIOD'] } } },
            },
          },
        },
      });

      if (!room) {
        return res.status(404).json({ success: false, message: 'Room not found' });
      }

      const occupiedBeds = room.beds.filter((b) => b.status === 'OCCUPIED' || b.stays.length > 0);
      if (occupiedBeds.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete Room "${room.roomNumber}" because it has ${occupiedBeds.length} active resident stay(s). Check out all residents first.`,
        });
      }

      // Safe to delete room and its beds
      await prisma.$transaction(async (tx) => {
        await tx.bed.deleteMany({ where: { roomId } });
        await tx.room.delete({ where: { id: roomId } });
      });

      return res.json({ success: true, message: `Room "${room.roomNumber}" deleted successfully.` });
    } catch (error: any) {
      console.error('Error deleting room:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // 4. Update Bed Status
  async updateBedStatus(req: Request, res: Response) {
    try {
      const bedId = req.params.bedId as string;
      const { status } = req.body;

      if (!['VACANT', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid bed status' });
      }

      const updatedBed = await prisma.bed.update({
        where: { id: bedId },
        data: { status },
      });

      return res.json({ success: true, data: updatedBed });
    } catch (error: any) {
      console.error('Error updating bed status:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // 4b. Update Full Bed Details (Label, Rent, Status)
  async updateBed(req: Request, res: Response) {
    try {
      const bedId = req.params.bedId as string;
      const { bedNumber, customRent, status } = req.body;

      const existingBed = await prisma.bed.findUnique({
        where: { id: bedId },
        include: {
          stays: { where: { status: { in: ['ACTIVE', 'NOTICE_PERIOD'] } } },
        },
      });

      if (!existingBed) {
        return res.status(404).json({ success: false, message: 'Bed not found' });
      }

      // Check status validity
      if (status) {
        if (!['VACANT', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'].includes(status)) {
          return res.status(400).json({ success: false, message: 'Invalid bed status' });
        }
        if (existingBed.stays.length > 0 && status !== 'OCCUPIED') {
          return res.status(400).json({
            success: false,
            message: `Bed has an active resident stay. Check out or shift resident before changing status to ${status}.`,
          });
        }
      }

      const trimmedNumber = bedNumber ? String(bedNumber).trim() : existingBed.bedNumber;
      if (trimmedNumber !== existingBed.bedNumber) {
        const duplicate = await prisma.bed.findFirst({
          where: {
            roomId: existingBed.roomId,
            bedNumber: { equals: trimmedNumber, mode: 'insensitive' },
            id: { not: bedId },
          },
        });
        if (duplicate) {
          return res.status(400).json({
            success: false,
            message: `A bed named "${trimmedNumber}" already exists in this room.`,
          });
        }
      }

      const updated = await prisma.bed.update({
        where: { id: bedId },
        data: {
          bedNumber: trimmedNumber,
          ...(customRent !== undefined ? { customRent: Number(customRent) } : {}),
          ...(status ? { status } : {}),
        },
        include: {
          room: {
            select: {
              roomNumber: true,
              roomType: true,
              baseRent: true,
              hasAc: true,
            },
          },
        },
      });

      return res.json({ success: true, data: updated, message: 'Bed updated successfully' });
    } catch (error: any) {
      console.error('Error updating bed:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // 5. Add Extra Floor to Building
  async addFloor(req: Request, res: Response) {
    try {
      const { propertyId, floorNumber, name } = req.body;

      if (!propertyId || floorNumber === undefined) {
        return res.status(400).json({ success: false, message: 'propertyId and floorNumber are required' });
      }

      const floor = await prisma.floor.create({
        data: {
          propertyId,
          floorNumber: parseInt(floorNumber, 10),
          name: name || `${floorNumber}th Floor`,
        },
      });

      return res.status(201).json({ success: true, data: floor });
    } catch (error: any) {
      console.error('Error adding floor:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // 6. Add Single Bed to Existing Room
  async addBedToRoom(req: Request, res: Response) {
    try {
      const roomId = req.params.roomId as string;
      const { bedNumber, customRent } = req.body;

      const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: { beds: { orderBy: { bedNumber: 'asc' } } },
      });

      if (!room) {
        return res.status(404).json({ success: false, message: 'Room not found' });
      }

      // Find first unused letter A-Z, or fallback to number to guarantee NO collisions
      const existingBedNumbers = new Set(room.beds.map((b) => b.bedNumber.toUpperCase()));
      let assignedBedNumber = bedNumber ? String(bedNumber).trim() : '';

      if (!assignedBedNumber) {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (let i = 0; i < alphabet.length; i++) {
          const candidate = `${room.roomNumber}-${alphabet[i]}`;
          if (!existingBedNumbers.has(candidate.toUpperCase())) {
            assignedBedNumber = candidate;
            break;
          }
        }
        if (!assignedBedNumber) {
          assignedBedNumber = `${room.roomNumber}-${room.beds.length + 1}`;
        }
      }

      const bed = await prisma.bed.create({
        data: {
          roomId,
          bedNumber: assignedBedNumber,
          customRent: customRent ? Number(customRent) : room.baseRent,
          status: 'VACANT',
        },
      });

      return res.status(201).json({ success: true, data: bed });
    } catch (error: any) {
      console.error('Error adding bed to room:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // 7. Delete Vacant Bed
  async deleteBed(req: Request, res: Response) {
    try {
      const bedId = req.params.bedId as string;

      const bed = await prisma.bed.findUnique({
        where: { id: bedId },
        include: {
          stays: { where: { status: { in: ['ACTIVE', 'NOTICE_PERIOD'] } } },
        },
      });

      if (!bed) {
        return res.status(404).json({ success: false, message: 'Bed not found' });
      }

      if (bed.status === 'OCCUPIED' || bed.stays.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete bed with an active resident stay. Check out the tenant first.',
        });
      }

      await prisma.$transaction(async (tx) => {
        // Clean up any historical checked-out stays to prevent foreign key errors
        const oldStays = await tx.tenantStay.findMany({ where: { bedId } });
        for (const s of oldStays) {
          await tx.paymentTransaction.deleteMany({
            where: { invoice: { tenantStayId: s.id } },
          });
          await tx.invoice.deleteMany({
            where: { tenantStayId: s.id },
          });
          await tx.tenantStay.delete({ where: { id: s.id } });
        }
        await tx.bed.delete({ where: { id: bedId } });
      });

      return res.json({ success: true, message: 'Bed deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting bed:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },
};
