"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seed...');
    // 1. Clean existing records
    await prisma.paymentTransaction.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.tenantStay.deleteMany();
    await prisma.complaint.deleteMany();
    await prisma.bed.deleteMany();
    await prisma.room.deleteMany();
    await prisma.floor.deleteMany();
    await prisma.property.deleteMany();
    await prisma.tenant.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();
    // 2. Create Organization
    const org = await prisma.organization.create({
        data: {
            name: 'Starlight Living Spaces',
            ownerPhone: '9876543210',
            ownerEmail: 'rajesh@starlightliving.in',
            gstNumber: '29ABCDE1234F1Z5',
        },
    });
    // 3. Create PG Owner User
    const ownerUser = await prisma.user.create({
        data: {
            organizationId: org.id,
            fullName: 'Rajesh Sharma',
            phone: '9876543210',
            email: 'rajesh@starlightliving.in',
            role: 'OWNER',
        },
    });
    // 4. Create Property 1: "Sunshine Grand Boys PG - HSR Layout"
    const property1 = await prisma.property.create({
        data: {
            organizationId: org.id,
            name: 'Sunshine Grand Boys PG - HSR Layout',
            address: 'Plot 42, 14th Main, Sector 4, HSR Layout',
            city: 'Bangalore',
            genderType: 'MALE',
            totalFloors: 3,
            amenities: ['High Speed WiFi', 'Daily Housekeeping', 'RO Water', 'CCTV Security', 'Washing Machine'],
        },
    });
    // 5. Create Property 2: "Starlight Premium Coliving - Koramangala"
    const property2 = await prisma.property.create({
        data: {
            organizationId: org.id,
            name: 'Starlight Premium Coliving - Koramangala',
            address: '7th Block, Near Forum Mall, Koramangala',
            city: 'Bangalore',
            genderType: 'UNISEX',
            totalFloors: 2,
            amenities: ['High Speed WiFi', 'AC Rooms', 'Gym & Lounge', 'Biometric Access', 'Power Backup'],
        },
    });
    // 6. Create Floors & Rooms for Property 1
    // Floor 1
    const floor1 = await prisma.floor.create({
        data: { propertyId: property1.id, floorNumber: 1, name: '1st Floor' },
    });
    // Floor 2
    const floor2 = await prisma.floor.create({
        data: { propertyId: property1.id, floorNumber: 2, name: '2nd Floor' },
    });
    // Room 101 (2-Sharing)
    const room101 = await prisma.room.create({
        data: {
            propertyId: property1.id,
            floorId: floor1.id,
            roomNumber: '101',
            roomType: 'DOUBLE',
            baseRent: 8500.0,
            hasAc: true,
        },
    });
    // Room 102 (3-Sharing)
    const room102 = await prisma.room.create({
        data: {
            propertyId: property1.id,
            floorId: floor1.id,
            roomNumber: '102',
            roomType: 'TRIPLE',
            baseRent: 7000.0,
            hasAc: false,
        },
    });
    // Room 201 (Single Sharing)
    const room201 = await prisma.room.create({
        data: {
            propertyId: property1.id,
            floorId: floor2.id,
            roomNumber: '201',
            roomType: 'SINGLE',
            baseRent: 14000.0,
            hasAc: true,
        },
    });
    // Beds for Room 101
    const bed101A = await prisma.bed.create({
        data: { roomId: room101.id, bedNumber: '101-A', status: 'OCCUPIED', customRent: 8500 },
    });
    const bed101B = await prisma.bed.create({
        data: { roomId: room101.id, bedNumber: '101-B', status: 'VACANT', customRent: 8500 },
    });
    // Beds for Room 102
    const bed102A = await prisma.bed.create({
        data: { roomId: room102.id, bedNumber: '102-A', status: 'OCCUPIED', customRent: 7000 },
    });
    const bed102B = await prisma.bed.create({
        data: { roomId: room102.id, bedNumber: '102-B', status: 'OCCUPIED', customRent: 7000 },
    });
    const bed102C = await prisma.bed.create({
        data: { roomId: room102.id, bedNumber: '102-C', status: 'VACANT', customRent: 7000 },
    });
    // Beds for Room 201
    const bed201A = await prisma.bed.create({
        data: { roomId: room201.id, bedNumber: '201-A', status: 'OCCUPIED', customRent: 14000 },
    });
    // 7. Create Floors & Rooms for Property 2 (Koramangala)
    const floorP2_1 = await prisma.floor.create({
        data: { propertyId: property2.id, floorNumber: 1, name: 'Ground Floor' },
    });
    const roomP2_G1 = await prisma.room.create({
        data: {
            propertyId: property2.id,
            floorId: floorP2_1.id,
            roomNumber: 'G-01',
            roomType: 'DOUBLE',
            baseRent: 12000.0,
            hasAc: true,
        },
    });
    await prisma.bed.create({
        data: { roomId: roomP2_G1.id, bedNumber: 'G-01-A', status: 'VACANT', customRent: 12000 },
    });
    await prisma.bed.create({
        data: { roomId: roomP2_G1.id, bedNumber: 'G-01-B', status: 'VACANT', customRent: 12000 },
    });
    // 8. Create Tenants & Stays
    // Tenant 1: Karan Rawat
    const userTenant1 = await prisma.user.create({
        data: {
            fullName: 'Karan Rawat',
            phone: '9811223344',
            email: 'karan@example.com',
            role: 'TENANT',
        },
    });
    const tenant1 = await prisma.tenant.create({
        data: {
            userId: userTenant1.id,
            emergencyPhone: '9811223300',
            kycStatus: 'VERIFIED',
        },
    });
    const stay1 = await prisma.tenantStay.create({
        data: {
            tenantId: tenant1.id,
            bedId: bed101A.id,
            checkInDate: new Date('2026-08-01'),
            agreedRent: 8500.0,
            securityDeposit: 15000.0,
            status: 'ACTIVE',
        },
    });
    // Tenant 2: Amit Verma
    const userTenant2 = await prisma.user.create({
        data: {
            fullName: 'Amit Verma',
            phone: '9922334455',
            email: 'amit@example.com',
            role: 'TENANT',
        },
    });
    const tenant2 = await prisma.tenant.create({
        data: {
            userId: userTenant2.id,
            emergencyPhone: '9922334400',
            kycStatus: 'VERIFIED',
        },
    });
    const stay2 = await prisma.tenantStay.create({
        data: {
            tenantId: tenant2.id,
            bedId: bed102A.id,
            checkInDate: new Date('2026-07-15'),
            agreedRent: 7000.0,
            securityDeposit: 14000.0,
            status: 'ACTIVE',
        },
    });
    // Tenant 3: Rohan Gupta (Single Room)
    const userTenant3 = await prisma.user.create({
        data: {
            fullName: 'Rohan Gupta',
            phone: '9733445566',
            email: 'rohan@example.com',
            role: 'TENANT',
        },
    });
    const tenant3 = await prisma.tenant.create({
        data: {
            userId: userTenant3.id,
            emergencyPhone: '9733445500',
            kycStatus: 'VERIFIED',
        },
    });
    const stay3 = await prisma.tenantStay.create({
        data: {
            tenantId: tenant3.id,
            bedId: bed201A.id,
            checkInDate: new Date('2026-09-01'),
            agreedRent: 14000.0,
            securityDeposit: 25000.0,
            status: 'ACTIVE',
        },
    });
    // 9. Generate Monthly Invoices
    const currentMonth = new Date().toISOString().slice(0, 7);
    // Invoice 1: Karan (PAID via PhonePe UPI - 0% fee)
    const inv1 = await prisma.invoice.create({
        data: {
            tenantStayId: stay1.id,
            invoiceNumber: `INV-${currentMonth}-101A`,
            billingMonth: currentMonth,
            rentAmount: 8500.0,
            totalDue: 8500.0,
            amountPaid: 8500.0,
            status: 'PAID',
            dueDate: new Date(),
            paidAt: new Date(),
        },
    });
    await prisma.paymentTransaction.create({
        data: {
            invoiceId: inv1.id,
            gatewayTxnId: `PHONEPE-${Date.now()}-01`,
            paymentMode: 'UPI_PHONEPE',
            amount: 8500.0,
            feeDeducted: 0.0, // 0.00 fee!
            status: 'SUCCESS',
            settledAt: new Date(),
        },
    });
    // Invoice 2: Amit (PENDING - Due Soon)
    await prisma.invoice.create({
        data: {
            tenantStayId: stay2.id,
            invoiceNumber: `INV-${currentMonth}-102A`,
            billingMonth: currentMonth,
            rentAmount: 7000.0,
            totalDue: 7000.0,
            amountPaid: 0.0,
            status: 'PENDING',
            dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days remaining
        },
    });
    // Invoice 3: Rohan (OVERDUE - Late Rent)
    await prisma.invoice.create({
        data: {
            tenantStayId: stay3.id,
            invoiceNumber: `INV-${currentMonth}-201A`,
            billingMonth: currentMonth,
            rentAmount: 14000.0,
            lateFine: 500.0,
            totalDue: 14500.0,
            amountPaid: 0.0,
            status: 'OVERDUE',
            dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days overdue
        },
    });
    // 10. Complaints (Simple Message + max 3 Media Items)
    await prisma.complaint.create({
        data: {
            propertyId: property1.id,
            roomId: room101.id,
            tenantId: tenant1.id,
            category: 'WIFI',
            message: 'WiFi signal dropping frequently on 1st floor during evening hours.',
            mediaUrls: [
                'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
            ],
            status: 'OPEN',
        },
    });
    await prisma.complaint.create({
        data: {
            propertyId: property1.id,
            roomId: room102.id,
            tenantId: tenant2.id,
            category: 'PLUMBING',
            message: 'Washroom tap has a slow leak under the sink basin.',
            mediaUrls: [
                'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
            ],
            status: 'IN_PROGRESS',
        },
    });
    await prisma.complaint.create({
        data: {
            propertyId: property1.id,
            roomId: room201.id,
            tenantId: tenant3.id,
            category: 'ELECTRICAL',
            message: 'AC remote sensor battery replaced and tested.',
            mediaUrls: [],
            status: 'RESOLVED',
            resolvedAt: new Date(),
        },
    });
    console.log('✅ Database seeded successfully with multi-building PG ecosystem data!');
}
main()
    .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
