const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function findOrCreateCustomer(data) {
  const existingCustomer = await prisma.customer.findFirst({
    where: {
      name: data.name,
      phone: data.phone,
    },
  });

  if (existingCustomer) {
    return existingCustomer;
  }

  return prisma.customer.create({ data });
}

async function main() {
  console.log('Seeding database...');

  // 1. Admin User
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });
  console.log('Admin user seeded:', admin.username);

  // 2. Business Settings
  const settings = await prisma.businessSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'JAYALAL COCO',
      ownerName: 'R C JAYALAL',
      address1: '374, HEMUDAWA',
      address2: 'SADALANKAWA',
      phone1: '031-2297165',
      phone2: '0766184030',
      phone3: '0782718584',
      phone4: '0716184030',
      regNumber: 'PV-123456',
      secondaryName: 'JS COCO Products',
      footerText: 'Thank You. Come Again!',
    },
  });
  console.log('Business settings seeded');

  // 3. Receipt Settings
  const receiptSettings = await prisma.receiptSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      showLogo: true,
      showBusinessName: true,
      showOwnerName: true,
      showAddress: true,
      showPhoneNumbers: true,
      showRegistrationNumber: true,
      showCustomerName: true,
      showVehicleNumber: true,
      showProduct: true,
      showFirstWeight: true,
      showSecondWeight: true,
      showNetWeight: true,
      showDriverName: true,
      showOperatorName: true,
      showCustomerSignature: true,
      showDriverSignature: true,
      showDateTime: true,
      showFooter: true,
    },
  });
  console.log('Receipt settings seeded');

  // 4. Sample Customers
  const customer1 = await findOrCreateCustomer({
    name: 'Sunil Perera',
    phone: '0771234567',
    address: 'Negombo Road, Dankotuwa',
    type: 'CUSTOMER',
    openingBalance: 0.0,
    currentBalance: 0.0, // Will be updated by entries
    notes: 'Regular coconut buyer',
  });

  await findOrCreateCustomer({
    name: 'Kamal Silva',
    phone: '0717654321',
    address: 'Kuliyapitiya',
    type: 'SUPPLIER',
    openingBalance: 0.0,
    currentBalance: 0.0, // Will be updated by entries
    notes: 'Reliable raw coco husk supplier',
  });

  await findOrCreateCustomer({
    name: 'Nimal Jayasinghe',
    phone: '0783456789',
    address: 'Sadalankawa',
    type: 'BOTH',
    openingBalance: 0.0,
    currentBalance: 0.0,
    notes: 'Supplies husks and buys finished fibers',
  });
  console.log('Sample customers seeded');

  // 5. Sample Batches
  await prisma.batch.upsert({
    where: { batchNumber: 'B-2026-COCO-001' },
    update: {},
    create: {
      batchNumber: 'B-2026-COCO-001',
      batchType: 'COCONUT',
      name: 'Coconut Lot A - May 2026',
      startDate: new Date('2026-05-01'),
      status: 'ACTIVE',
      notes: 'Standard local coconut harvest',
    },
  });

  const huskBatch = await prisma.batch.upsert({
    where: { batchNumber: 'B-2026-HUSK-001' },
    update: {},
    create: {
      batchNumber: 'B-2026-HUSK-001',
      batchType: 'COCO_HUSK',
      name: 'Husk Lot A - May 2026',
      startDate: new Date('2026-05-01'),
      status: 'ACTIVE',
      notes: 'Fiber mill processing batch',
    },
  });
  console.log('Sample batches seeded');

  // 6. Sample Coco Husk Entry with 21-day payment
  const entryDate = new Date();
  entryDate.setDate(entryDate.getDate() - 10); // 10 days ago

  const dueDate = new Date(entryDate);
  dueDate.setDate(dueDate.getDate() + 21); // 21 days from entry date

  const existingHuskEntry = await prisma.cocoHuskEntry.findUnique({
    where: { receiptNumber: 'REC-HUSK-2026-0001' },
  });

  if (existingHuskEntry) {
    console.log('Sample Husk entry already exists, skipping related payment and ledger entries.');
    console.log('Database seeding finished.');
    return;
  }

  const huskEntry = await prisma.cocoHuskEntry.create({
    data: {
      receiptNumber: 'REC-HUSK-2026-0001',
      batchId: huskBatch.id,
      date: entryDate,
      customerId: customer1.id, // Sunil buys from us
      vehicleNumber: 'WP-HN-8902',
      huskCount: 8000,
      ratePerHusk: 10.0,
      totalHuskAmount: 80000.0, // 8000 * 10
      totalWeightKg: 16000.0,
      averageWeightPer1000: 2000.0, // 16000 / 8000 * 1000
      cuttingLabourCost: 15000.0,
      dryingLabourCost: 20000.0,
      transportCost: 10000.0,
      otherExpense: 5000.0,
      totalExpense: 130000.0, // 80000 + 15000 + 20000 + 10000 + 5000
      expectedIncome: 180000.0, // Sold fibers for 180000
      receivedIncome: 80000.0, // Received 80000 partial payment
      paymentDueDate: dueDate,
      paymentStatus: 'PARTIAL',
      profitLoss: -50000.0, // 80000 received - 130000 total expense (loss so far)
      notes: 'First coco husk batch processing entry',
    },
  });

  // Create LedgerEntry for the sale
  await prisma.ledgerEntry.create({
    data: {
      partyId: customer1.id,
      partyType: 'CUSTOMER',
      transactionType: 'SALE',
      debit: 180000.0,
      credit: 0.0,
      amount: 180000.0,
      description: 'Coco Husk Sale: REC-HUSK-2026-0001 (8000 Husks)',
      relatedBatchId: huskBatch.id,
      cocoHuskEntryId: huskEntry.id,
      balanceAfter: 180000.0,
      createdAt: entryDate,
    },
  });

  // Create Payment record
  const payment = await prisma.payment.create({
    data: {
      amount: 80000.0,
      date: entryDate,
      paymentMethod: 'CASH',
      notes: 'Initial payment for Husk Sale REC-HUSK-2026-0001',
      customerId: customer1.id,
      cocoHuskEntryId: huskEntry.id,
      createdAt: entryDate,
    },
  });

  // Create LedgerEntry for the payment
  await prisma.ledgerEntry.create({
    data: {
      partyId: customer1.id,
      partyType: 'CUSTOMER',
      transactionType: 'PAYMENT_RECEIVED',
      debit: 0.0,
      credit: 80000.0,
      amount: 80000.0,
      description: 'Payment Received for REC-HUSK-2026-0001',
      relatedBatchId: huskBatch.id,
      cocoHuskEntryId: huskEntry.id,
      balanceAfter: 100000.0,
      createdAt: entryDate,
    },
  });

  // Update customer currentBalance to 100,000 (Receivable)
  await prisma.customer.update({
    where: { id: customer1.id },
    data: { currentBalance: 100000.0 },
  });

  console.log('Sample Husk entry, Payment, and Ledger entries seeded successfully!');
  console.log('Database seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
