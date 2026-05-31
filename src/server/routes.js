const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, JWT_SECRET } = require('./middleware/auth');
const { recalculateCustomerLedger } = require('./utils/ledger');

const router = express.Router();
const prisma = new PrismaClient();

// Helper to determine husk payment status
function getHuskPaymentStatus(entry) {
  const balance = entry.expectedIncome - entry.receivedIncome;
  if (balance <= 0) return 'PAID';
  if (entry.receivedIncome > 0) return 'PARTIAL';
  
  const today = new Date();
  const dueDate = new Date(entry.paymentDueDate);
  if (today > dueDate) return 'OVERDUE';
  return 'PENDING';
}

// ----------------------------------------------------
// 1. AUTHENTICATION ENDPOINTS
// ----------------------------------------------------

// POST /api/auth/setup-admin
router.post('/auth/setup-admin', async (req, res) => {
  try {
    const existing = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });
    if (existing) {
      return res.status(400).json({ error: 'Admin already configured.' });
    }

    const passwordHash = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        passwordHash,
        role: 'ADMIN',
      },
    });

    res.json({ success: true, message: 'Admin setup completed.', username: admin.username });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/login
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required.' });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/me
router.get('/auth/me', authenticateToken, async (req, res) => {
  res.json({ user: req.user });
});


// ----------------------------------------------------
// 2. BUSINESS & RECEIPT SETTINGS
// ----------------------------------------------------

// GET /api/settings/business
router.get('/settings/business', async (req, res) => {
  try {
    let settings = await prisma.businessSettings.findUnique({ where: { id: 1 } });
    if (!settings) {
      settings = await prisma.businessSettings.create({ data: { id: 1 } });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/settings/business
router.put('/settings/business', authenticateToken, async (req, res) => {
  try {
    const { name, ownerName, address1, address2, phone1, phone2, phone3, phone4, regNumber, secondaryName, logoUrl, footerText } = req.body;
    const settings = await prisma.businessSettings.upsert({
      where: { id: 1 },
      update: { name, ownerName, address1, address2, phone1, phone2, phone3, phone4, regNumber, secondaryName, logoUrl, footerText },
      create: { id: 1, name, ownerName, address1, address2, phone1, phone2, phone3, phone4, regNumber, secondaryName, logoUrl, footerText },
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/settings/receipt
router.get('/settings/receipt', async (req, res) => {
  try {
    let settings = await prisma.receiptSettings.findUnique({ where: { id: 1 } });
    if (!settings) {
      settings = await prisma.receiptSettings.create({ data: { id: 1 } });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/settings/receipt
router.put('/settings/receipt', authenticateToken, async (req, res) => {
  try {
    const data = req.body;
    delete data.id;
    delete data.createdAt;
    delete data.updatedAt;

    const settings = await prisma.receiptSettings.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ----------------------------------------------------
// 3. CUSTOMER / SUPPLIER ENDPOINTS
// ----------------------------------------------------

// GET /api/customers
router.get('/customers', async (req, res) => {
  try {
    const { search, type } = req.query;
    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
      ];
    }
    if (type && type !== 'ALL') {
      where.type = type;
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/customers/:id
router.get('/customers/:id', async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/customers
router.post('/customers', authenticateToken, async (req, res) => {
  try {
    const { name, phone, address, type, openingBalance, notes, isActive } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and Type are required.' });
    }

    const opBal = Number(openingBalance) || 0;

    const customer = await prisma.customer.create({
      data: {
        name,
        phone,
        address,
        type,
        openingBalance: opBal,
        currentBalance: opBal,
        notes,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    // Create opening balance ledger entry if non-zero
    if (opBal !== 0) {
      let debit = 0;
      let credit = 0;
      let pType = type === 'BOTH' ? 'CUSTOMER' : type;

      if (pType === 'CUSTOMER') {
        debit = opBal;
      } else {
        credit = opBal;
      }

      await prisma.ledgerEntry.create({
        data: {
          partyId: customer.id,
          partyType: pType,
          transactionType: 'ADJUSTMENT',
          debit,
          credit,
          amount: opBal,
          description: 'Opening Balance',
          balanceAfter: opBal,
        },
      });
      await recalculateCustomerLedger(customer.id);
    }

    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/customers/:id
router.put('/customers/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, phone, address, type, openingBalance, notes, isActive } = req.body;

    const currentCustomer = await prisma.customer.findUnique({ where: { id } });
    if (!currentCustomer) return res.status(404).json({ error: 'Customer not found' });

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name,
        phone,
        address,
        type,
        openingBalance: Number(openingBalance) || 0,
        notes,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    // Update opening balance entry if changed
    const opEntry = await prisma.ledgerEntry.findFirst({
      where: { partyId: id, description: 'Opening Balance' },
    });

    const newOpBal = Number(openingBalance) || 0;
    if (newOpBal !== currentCustomer.openingBalance) {
      let debit = 0;
      let credit = 0;
      let pType = type === 'BOTH' ? 'CUSTOMER' : type;
      if (pType === 'CUSTOMER') {
        debit = newOpBal;
      } else {
        credit = newOpBal;
      }

      if (opEntry) {
        if (newOpBal === 0) {
          await prisma.ledgerEntry.delete({ where: { id: opEntry.id } });
        } else {
          await prisma.ledgerEntry.update({
            where: { id: opEntry.id },
            data: { debit, credit, amount: newOpBal, partyType: pType },
          });
        }
      } else if (newOpBal !== 0) {
        await prisma.ledgerEntry.create({
          data: {
            partyId: id,
            partyType: pType,
            transactionType: 'ADJUSTMENT',
            debit,
            credit,
            amount: newOpBal,
            description: 'Opening Balance',
            balanceAfter: newOpBal,
          },
        });
      }
    }

    await recalculateCustomerLedger(id);
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/customers/:id
router.delete('/customers/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Cascade is set up for payments and ledger entries. 
    await prisma.customer.delete({ where: { id } });
    res.json({ success: true, message: 'Customer and all related records deleted.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/customers/:id/ledger
router.get('/customers/:id/ledger', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const ledger = await prisma.ledgerEntry.findMany({
      where: { partyId: id },
      orderBy: [
        { createdAt: 'asc' },
        { id: 'asc' },
      ],
    });
    res.json(ledger);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/customers/:id/payment (Add independent general payment)
router.post('/customers/:id/payment', authenticateToken, async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    const { amount, date, paymentMethod, notes, transactionSide } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid positive amount required.' });
    }
    if (!transactionSide || (transactionSide !== 'CUSTOMER' && transactionSide !== 'SUPPLIER')) {
      return res.status(400).json({ error: 'Valid transactionSide (CUSTOMER/SUPPLIER) is required.' });
    }

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) return res.status(404).json({ error: 'Customer not found.' });

    const paymentDate = date ? new Date(date) : new Date();

    const payment = await prisma.payment.create({
      data: {
        amount: parseFloat(amount),
        date: paymentDate,
        paymentMethod: paymentMethod || 'CASH',
        notes: notes || 'General ledger payment',
        customerId,
      },
    });

    // Record ledger entry
    let debit = 0;
    let credit = 0;
    let transactionType = 'PAYMENT_RECEIVED';

    if (transactionSide === 'CUSTOMER') {
      credit = parseFloat(amount); // payment reduces what customer owes us
      transactionType = 'PAYMENT_RECEIVED';
    } else {
      debit = parseFloat(amount); // payment reduces what we owe supplier
      transactionType = 'PAYMENT_MADE';
    }

    await prisma.ledgerEntry.create({
      data: {
        partyId: customerId,
        partyType: transactionSide,
        transactionType,
        debit,
        credit,
        amount: parseFloat(amount),
        description: notes || (transactionSide === 'CUSTOMER' ? 'Payment Received' : 'Payment Made'),
        balanceAfter: 0.0, // recalculated below
        createdAt: paymentDate,
      },
    });

    await recalculateCustomerLedger(customerId);
    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/customers/:id/adjustment (Add manual balance adjustment)
router.post('/customers/:id/adjustment', authenticateToken, async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    const { amount, type, description, date, transactionSide } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid positive amount is required.' });
    }
    if (!type || (type !== 'DEBIT' && type !== 'CREDIT')) {
      return res.status(400).json({ error: 'Type must be DEBIT or CREDIT.' });
    }
    if (!transactionSide || (transactionSide !== 'CUSTOMER' && transactionSide !== 'SUPPLIER')) {
      return res.status(400).json({ error: 'transactionSide must be CUSTOMER or SUPPLIER.' });
    }

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) return res.status(404).json({ error: 'Customer not found.' });

    const adjDate = date ? new Date(date) : new Date();
    const val = parseFloat(amount);

    await prisma.ledgerEntry.create({
      data: {
        partyId: customerId,
        partyType: transactionSide,
        transactionType: 'ADJUSTMENT',
        debit: type === 'DEBIT' ? val : 0,
        credit: type === 'CREDIT' ? val : 0,
        amount: val,
        description: description || `Manual Adjustment (${type})`,
        balanceAfter: 0.0, // recalculated below
        createdAt: adjDate,
      },
    });

    await recalculateCustomerLedger(customerId);
    res.json({ success: true, message: 'Adjustment recorded successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ----------------------------------------------------
// 4. BATCH MANAGEMENT ENDPOINTS
// ----------------------------------------------------

// GET /api/batches
router.get('/batches', async (req, res) => {
  try {
    const { status, type } = req.query;
    const where = {};
    if (status) where.status = status;
    if (type) where.batchType = type;

    const batches = await prisma.batch.findMany({
      where,
      orderBy: { startDate: 'desc' },
    });
    res.json(batches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/batches/:id
router.get('/batches/:id', async (req, res) => {
  try {
    const batch = await prisma.batch.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!batch) return res.status(404).json({ error: 'Batch not found' });
    res.json(batch);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/batches
router.post('/batches', authenticateToken, async (req, res) => {
  try {
    const { batchNumber, batchType, name, startDate, notes } = req.body;
    if (!batchNumber || !batchType || !name || !startDate) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Check uniqueness
    const exists = await prisma.batch.findUnique({ where: { batchNumber } });
    if (exists) return res.status(400).json({ error: 'Batch number already exists.' });

    const batch = await prisma.batch.create({
      data: {
        batchNumber,
        batchType,
        name,
        startDate: new Date(startDate),
        status: 'ACTIVE',
        notes,
      },
    });
    res.status(201).json(batch);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/batches/:id
router.put('/batches/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, startDate, endDate, status, notes } = req.body;

    const batch = await prisma.batch.update({
      where: { id },
      data: {
        name,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status,
        notes,
      },
    });
    res.json(batch);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/batches/:id/close
router.post('/batches/:id/close', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const batch = await prisma.batch.update({
      where: { id },
      data: {
        status: 'CLOSED',
        endDate: new Date(),
      },
    });
    res.json(batch);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/batches/:id/summary
router.get('/batches/:id/summary', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const batch = await prisma.batch.findUnique({
      where: { id },
      include: {
        coconutEntries: true,
        cocoHuskEntries: true,
        expenses: true,
      },
    });

    if (!batch) return res.status(404).json({ error: 'Batch not found.' });

    let totalEntries = 0;
    let totalWeight = 0;
    let expectedIncome = 0;
    let receivedIncome = 0;
    let batchHuskExpenses = 0;
    let coconutsCost = 0;

    if (batch.batchType === 'COCONUT') {
      totalEntries = batch.coconutEntries.length;
      batch.coconutEntries.forEach(e => {
        totalWeight += e.netWeight;
        coconutsCost += e.totalAmount;
      });
    } else {
      totalEntries = batch.cocoHuskEntries.length;
      batch.cocoHuskEntries.forEach(e => {
        totalWeight += e.totalWeightKg;
        expectedIncome += e.expectedIncome;
        receivedIncome += e.receivedIncome;
        batchHuskExpenses += e.totalExpense;
      });
    }

    const directExpenses = batch.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalExpenses = directExpenses + batchHuskExpenses + coconutsCost;

    res.json({
      batch,
      summary: {
        totalEntries,
        totalWeight,
        expectedIncome,
        receivedIncome,
        directExpenses,
        totalExpenses,
        profitLoss: batch.batchType === 'COCONUT' ? -totalExpenses : (receivedIncome - totalExpenses),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ----------------------------------------------------
// 5. COCONUT MODULE ENDPOINTS
// ----------------------------------------------------

// GET /api/coconut
router.get('/coconut', async (req, res) => {
  try {
    const { batchId, customerId, startDate, endDate } = req.query;
    const where = {};
    if (batchId) where.batchId = parseInt(batchId);
    if (customerId) where.customerId = parseInt(customerId);
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const entries = await prisma.coconutEntry.findMany({
      where,
      include: {
        customer: true,
        batch: true,
        payments: true,
      },
      orderBy: { date: 'desc' },
    });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/coconut
router.post('/coconut', authenticateToken, async (req, res) => {
  try {
    const {
      batchId, date, customerId, vehicleNumber, productName,
      firstWeight, secondWeight, ratePerKg, transportCost, otherExpenses,
      operatorName, driverName, notes,
    } = req.body;

    if (!batchId || !customerId || !firstWeight || !secondWeight) {
      return res.status(400).json({ error: 'Batch, Customer, 1st Weight, and 2nd Weight are required.' });
    }

    const customer = await prisma.customer.findUnique({ where: { id: parseInt(customerId) } });
    if (!customer) return res.status(400).json({ error: 'Customer not found.' });

    const first = parseFloat(firstWeight);
    const second = parseFloat(secondWeight);
    if (first < 0 || second < 0) return res.status(400).json({ error: 'Weights cannot be negative.' });

    const netWeight = first - second;
    const rate = ratePerKg ? parseFloat(ratePerKg) : 0;
    if (rate < 0) return res.status(400).json({ error: 'Rate cannot be negative.' });

    const totalAmount = netWeight * rate;
    const entryDate = date ? new Date(date) : new Date();

    // Unique receipt number generation
    const count = await prisma.coconutEntry.count();
    const receiptNumber = `REC-COCO-${Date.now()}-${count + 1}`;

    const coconutEntry = await prisma.coconutEntry.create({
      data: {
        receiptNumber,
        batchId: parseInt(batchId),
        date: entryDate,
        customerId: parseInt(customerId),
        vehicleNumber,
        productName: productName || 'Coconut',
        firstWeight: first,
        secondWeight: second,
        netWeight,
        ratePerKg: rate,
        totalAmount,
        transportCost: parseFloat(transportCost) || 0,
        otherExpenses: parseFloat(otherExpenses) || 0,
        operatorName,
        driverName,
        notes,
      },
    });

    // Customer ledger entry
    let debit = 0;
    let credit = 0;
    let transactionType = 'SALE';
    let entryPartyType = 'CUSTOMER';

    if (customer.type === 'SUPPLIER') {
      credit = totalAmount; // Supplier purchase credit
      transactionType = 'PURCHASE';
      entryPartyType = 'SUPPLIER';
    } else {
      debit = totalAmount; // Customer sale debit
      transactionType = 'SALE';
      entryPartyType = 'CUSTOMER';
    }

    await prisma.ledgerEntry.create({
      data: {
        partyId: customer.id,
        partyType: entryPartyType,
        transactionType,
        debit,
        credit,
        amount: totalAmount,
        description: `Coconut ${transactionType === 'SALE' ? 'Sale' : 'Purchase'}: ${receiptNumber} (Net: ${netWeight}kg)`,
        relatedBatchId: parseInt(batchId),
        coconutEntryId: coconutEntry.id,
        balanceAfter: 0.0, // calculated
        createdAt: entryDate,
      },
    });

    await recalculateCustomerLedger(customer.id);
    res.status(201).json(coconutEntry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/coconut/:id
router.get('/coconut/:id', async (req, res) => {
  try {
    const entry = await prisma.coconutEntry.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        customer: true,
        batch: true,
        payments: true,
      },
    });
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/coconut/:id
router.put('/coconut/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      batchId, date, customerId, vehicleNumber, productName,
      firstWeight, secondWeight, ratePerKg, transportCost, otherExpenses,
      operatorName, driverName, notes,
    } = req.body;

    const oldEntry = await prisma.coconutEntry.findUnique({ where: { id } });
    if (!oldEntry) return res.status(404).json({ error: 'Entry not found' });

    const customer = await prisma.customer.findUnique({ where: { id: parseInt(customerId) } });
    if (!customer) return res.status(400).json({ error: 'Customer not found.' });

    const first = parseFloat(firstWeight);
    const second = parseFloat(secondWeight);
    const netWeight = first - second;
    const rate = ratePerKg ? parseFloat(ratePerKg) : 0;
    const totalAmount = netWeight * rate;
    const entryDate = date ? new Date(date) : new Date();

    const coconutEntry = await prisma.coconutEntry.update({
      where: { id },
      data: {
        batchId: parseInt(batchId),
        date: entryDate,
        customerId: parseInt(customerId),
        vehicleNumber,
        productName: productName || 'Coconut',
        firstWeight: first,
        secondWeight: second,
        netWeight,
        ratePerKg: rate,
        totalAmount,
        transportCost: parseFloat(transportCost) || 0,
        otherExpenses: parseFloat(otherExpenses) || 0,
        operatorName,
        driverName,
        notes,
      },
    });

    // Update corresponding ledger entry
    const ledger = await prisma.ledgerEntry.findFirst({ where: { coconutEntryId: id } });
    if (ledger) {
      let debit = 0;
      let credit = 0;
      let transactionType = 'SALE';
      let entryPartyType = 'CUSTOMER';

      if (customer.type === 'SUPPLIER') {
        credit = totalAmount;
        transactionType = 'PURCHASE';
        entryPartyType = 'SUPPLIER';
      } else {
        debit = totalAmount;
        transactionType = 'SALE';
        entryPartyType = 'CUSTOMER';
      }

      await prisma.ledgerEntry.update({
        where: { id: ledger.id },
        data: {
          partyId: customer.id,
          partyType: entryPartyType,
          transactionType,
          debit,
          credit,
          amount: totalAmount,
          description: `Coconut ${transactionType === 'SALE' ? 'Sale' : 'Purchase'}: ${coconutEntry.receiptNumber} (Net: ${netWeight}kg)`,
          relatedBatchId: parseInt(batchId),
          createdAt: entryDate,
        },
      });
    }

    await recalculateCustomerLedger(oldEntry.customerId);
    if (oldEntry.customerId !== customer.id) {
      await recalculateCustomerLedger(customer.id);
    }

    res.json(coconutEntry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/coconut/:id
router.delete('/coconut/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const entry = await prisma.coconutEntry.findUnique({ where: { id } });
    if (!entry) return res.status(404).json({ error: 'Entry not found' });

    await prisma.coconutEntry.delete({ where: { id } });
    await recalculateCustomerLedger(entry.customerId);

    res.json({ success: true, message: 'Coconut Entry deleted.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/coconut/:id/payment (Pay Coconut entry)
router.post('/coconut/:id/payment', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { amount, date, paymentMethod, notes } = req.body;
    
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid positive amount is required.' });

    const entry = await prisma.coconutEntry.findUnique({
      where: { id },
      include: { customer: true },
    });
    if (!entry) return res.status(404).json({ error: 'Coconut entry not found.' });

    const pDate = date ? new Date(date) : new Date();

    const payment = await prisma.payment.create({
      data: {
        amount: parseFloat(amount),
        date: pDate,
        paymentMethod: paymentMethod || 'CASH',
        notes: notes || `Payment for Coconut Receipt: ${entry.receiptNumber}`,
        customerId: entry.customerId,
        coconutEntryId: entry.id,
      },
    });

    let debit = 0;
    let credit = 0;
    let transactionType = 'PAYMENT_RECEIVED';
    let side = 'CUSTOMER';

    if (entry.customer.type === 'SUPPLIER') {
      debit = parseFloat(amount); // Payment made to supplier
      transactionType = 'PAYMENT_MADE';
      side = 'SUPPLIER';
    } else {
      credit = parseFloat(amount); // Payment received from customer
      transactionType = 'PAYMENT_RECEIVED';
      side = 'CUSTOMER';
    }

    await prisma.ledgerEntry.create({
      data: {
        partyId: entry.customerId,
        partyType: side,
        transactionType,
        debit,
        credit,
        amount: parseFloat(amount),
        description: notes || `Payment for Coconut Entry: ${entry.receiptNumber}`,
        relatedBatchId: entry.batchId,
        coconutEntryId: entry.id,
        balanceAfter: 0.0,
        createdAt: pDate,
      },
    });

    await recalculateCustomerLedger(entry.customerId);
    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ----------------------------------------------------
// 6. COCO HUSK MODULE ENDPOINTS
// ----------------------------------------------------

// GET /api/husk
router.get('/husk', async (req, res) => {
  try {
    const { batchId, customerId, startDate, endDate } = req.query;
    const where = {};
    if (batchId) where.batchId = parseInt(batchId);
    if (customerId) where.customerId = parseInt(customerId);
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const entries = await prisma.cocoHuskEntry.findMany({
      where,
      include: {
        customer: true,
        batch: true,
        payments: true,
      },
      orderBy: { date: 'desc' },
    });

    // Attach dynamic paymentStatus calculations to verify
    const entriesWithStatus = entries.map(e => ({
      ...e,
      paymentStatus: getHuskPaymentStatus(e),
    }));

    res.json(entriesWithStatus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/husk
router.post('/husk', authenticateToken, async (req, res) => {
  try {
    const {
      batchId, date, customerId, vehicleNumber, huskCount, ratePerHusk,
      firstWeight, secondWeight, cuttingLabourCost, dryingLabourCost, transportCost,
      otherExpense, expectedIncome, receivedIncome, notes,
    } = req.body;

    if (!batchId || !customerId || !huskCount || !ratePerHusk) {
      return res.status(400).json({ error: 'Batch, Customer, Husk Count, and Rate are required.' });
    }

    const customer = await prisma.customer.findUnique({ where: { id: parseInt(customerId) } });
    if (!customer) return res.status(400).json({ error: 'Customer not found.' });

    const countVal = parseFloat(huskCount);
    const rateVal = parseFloat(ratePerHusk);
    if (countVal < 0 || rateVal < 0) return res.status(400).json({ error: 'Husk Count and Rate cannot be negative.' });

    const firstWeightVal = parseFloat(firstWeight) || 0;
    const secondWeightVal = parseFloat(secondWeight) || 0;
    const totalWeight = firstWeightVal - secondWeightVal;
    if (totalWeight < 0) return res.status(400).json({ error: 'Net weight cannot be negative.' });

    const totalHuskAmount = countVal * rateVal;
    const averageWeight = countVal > 0 ? (totalWeight / countVal) * 1000 : 0;

    const cut = parseFloat(cuttingLabourCost) || 0;
    const dry = parseFloat(dryingLabourCost) || 0;
    const trans = parseFloat(transportCost) || 0;
    const other = parseFloat(otherExpense) || 0;

    const totalExpense = totalHuskAmount + cut + dry + trans + other;
    const expInc = parseFloat(expectedIncome) || 0;
    const recInc = parseFloat(receivedIncome) || 0;
    const profitLoss = recInc - totalExpense;

    const entryDate = date ? new Date(date) : new Date();
    const dueDate = new Date(entryDate);
    dueDate.setDate(dueDate.getDate() + 21); // auto 21 days

    const countEntries = await prisma.cocoHuskEntry.count();
    const receiptNumber = `REC-HUSK-${Date.now()}-${countEntries + 1}`;

    // Status evaluation
    const tempEntry = { expectedIncome: expInc, receivedIncome: recInc, paymentDueDate: dueDate };
    const paymentStatus = getHuskPaymentStatus(tempEntry);

    const huskEntry = await prisma.cocoHuskEntry.create({
      data: {
        receiptNumber,
        batchId: parseInt(batchId),
        date: entryDate,
        customerId: parseInt(customerId),
        vehicleNumber,
        firstWeight: firstWeightVal,
        secondWeight: secondWeightVal,
        huskCount: countVal,
        ratePerHusk: rateVal,
        totalHuskAmount,
        totalWeightKg: totalWeight,
        averageWeightPer1000: averageWeight,
        cuttingLabourCost: cut,
        dryingLabourCost: dry,
        transportCost: trans,
        otherExpense: other,
        totalExpense,
        expectedIncome: expInc,
        receivedIncome: recInc,
        paymentDueDate: dueDate,
        paymentStatus,
        profitLoss,
        notes,
      },
    });

    // Ledger records
    let debit = 0;
    let credit = 0;
    let transactionType = 'SALE';
    let side = 'CUSTOMER';

    if (customer.type === 'SUPPLIER') {
      credit = totalHuskAmount; // supplier purchase credit
      transactionType = 'PURCHASE';
      side = 'SUPPLIER';
    } else {
      debit = expInc; // Customer sale debit
      transactionType = 'SALE';
      side = 'CUSTOMER';
    }

    await prisma.ledgerEntry.create({
      data: {
        partyId: customer.id,
        partyType: side,
        transactionType,
        debit,
        credit,
        amount: customer.type === 'SUPPLIER' ? totalHuskAmount : expInc,
        description: `Coco Husk ${transactionType === 'SALE' ? 'Sale' : 'Purchase'}: ${receiptNumber} (${countVal} Husks)`,
        relatedBatchId: parseInt(batchId),
        cocoHuskEntryId: huskEntry.id,
        balanceAfter: 0.0,
        createdAt: entryDate,
      },
    });

    // Handle initial payment if exists
    if (recInc > 0) {
      await prisma.payment.create({
        data: {
          amount: recInc,
          date: entryDate,
          paymentMethod: 'CASH',
          notes: `Initial payment for Husk entry: ${receiptNumber}`,
          customerId: customer.id,
          cocoHuskEntryId: huskEntry.id,
          createdAt: entryDate,
        },
      });

      let pDebit = 0;
      let pCredit = 0;
      let pTransType = 'PAYMENT_RECEIVED';

      if (customer.type === 'SUPPLIER') {
        pDebit = recInc;
        pTransType = 'PAYMENT_MADE';
      } else {
        pCredit = recInc;
        pTransType = 'PAYMENT_RECEIVED';
      }

      await prisma.ledgerEntry.create({
        data: {
          partyId: customer.id,
          partyType: side,
          transactionType: pTransType,
          debit: pDebit,
          credit: pCredit,
          amount: recInc,
          description: `Initial Payment for Husk: ${receiptNumber}`,
          relatedBatchId: parseInt(batchId),
          cocoHuskEntryId: huskEntry.id,
          balanceAfter: 0.0,
          createdAt: entryDate,
        },
      });
    }

    await recalculateCustomerLedger(customer.id);
    res.status(201).json(huskEntry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/husk/:id
router.get('/husk/:id', async (req, res) => {
  try {
    const entry = await prisma.cocoHuskEntry.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        customer: true,
        batch: true,
        payments: true,
      },
    });
    if (!entry) return res.status(440).json({ error: 'Entry not found' });
    res.json({ ...entry, paymentStatus: getHuskPaymentStatus(entry) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/husk/:id
router.put('/husk/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      batchId, date, customerId, vehicleNumber, huskCount, ratePerHusk,
      firstWeight, secondWeight, cuttingLabourCost, dryingLabourCost, transportCost,
      otherExpense, expectedIncome, receivedIncome, notes,
    } = req.body;

    const oldEntry = await prisma.cocoHuskEntry.findUnique({ where: { id }, include: { payments: true } });
    if (!oldEntry) return res.status(404).json({ error: 'Entry not found' });

    const customer = await prisma.customer.findUnique({ where: { id: parseInt(customerId) } });
    if (!customer) return res.status(400).json({ error: 'Customer not found.' });

    const countVal = parseFloat(huskCount);
    const rateVal = parseFloat(ratePerHusk);
    const firstWeightVal = parseFloat(firstWeight) || 0;
    const secondWeightVal = parseFloat(secondWeight) || 0;
    const totalWeight = firstWeightVal - secondWeightVal;
    
    const totalHuskAmount = countVal * rateVal;
    const averageWeight = countVal > 0 ? (totalWeight / countVal) * 1000 : 0;

    const cut = parseFloat(cuttingLabourCost) || 0;
    const dry = parseFloat(dryingLabourCost) || 0;
    const trans = parseFloat(transportCost) || 0;
    const other = parseFloat(otherExpense) || 0;
    const totalExpense = totalHuskAmount + cut + dry + trans + other;

    const expInc = parseFloat(expectedIncome) || 0;
    // We cannot reduce receivedIncome below the total amount of payments recorded!
    const paymentsSum = oldEntry.payments.reduce((s, p) => s + p.amount, 0);
    const recInc = Math.max(parseFloat(receivedIncome) || 0, paymentsSum);

    const profitLoss = recInc - totalExpense;
    const entryDate = date ? new Date(date) : new Date();
    const dueDate = new Date(entryDate);
    dueDate.setDate(dueDate.getDate() + 21);

    const tempEntry = { expectedIncome: expInc, receivedIncome: recInc, paymentDueDate: dueDate };
    const paymentStatus = getHuskPaymentStatus(tempEntry);

    const huskEntry = await prisma.cocoHuskEntry.update({
      where: { id },
      data: {
        batchId: parseInt(batchId),
        date: entryDate,
        customerId: parseInt(customerId),
        vehicleNumber,
        firstWeight: firstWeightVal,
        secondWeight: secondWeightVal,
        huskCount: countVal,
        ratePerHusk: rateVal,
        totalHuskAmount,
        totalWeightKg: totalWeight,
        averageWeightPer1000: averageWeight,
        cuttingLabourCost: cut,
        dryingLabourCost: dry,
        transportCost: trans,
        otherExpense: other,
        totalExpense,
        expectedIncome: expInc,
        receivedIncome: recInc,
        paymentDueDate: dueDate,
        paymentStatus,
        profitLoss,
        notes,
      },
    });

    // Update main entry ledger entry
    const ledger = await prisma.ledgerEntry.findFirst({
      where: { cocoHuskEntryId: id, transactionType: { in: ['SALE', 'PURCHASE'] } },
    });

    if (ledger) {
      let debit = 0;
      let credit = 0;
      let transactionType = 'SALE';
      let side = 'CUSTOMER';

      if (customer.type === 'SUPPLIER') {
        credit = totalHuskAmount;
        transactionType = 'PURCHASE';
        side = 'SUPPLIER';
      } else {
        debit = expInc;
        transactionType = 'SALE';
        side = 'CUSTOMER';
      }

      await prisma.ledgerEntry.update({
        where: { id: ledger.id },
        data: {
          partyId: customer.id,
          partyType: side,
          transactionType,
          debit,
          credit,
          amount: customer.type === 'SUPPLIER' ? totalHuskAmount : expInc,
          description: `Coco Husk ${transactionType === 'SALE' ? 'Sale' : 'Purchase'}: ${huskEntry.receiptNumber} (${countVal} Husks)`,
          relatedBatchId: parseInt(batchId),
          createdAt: entryDate,
        },
      });
    }

    await recalculateCustomerLedger(oldEntry.customerId);
    if (oldEntry.customerId !== customer.id) {
      await recalculateCustomerLedger(customer.id);
    }

    res.json(huskEntry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/husk/:id
router.delete('/husk/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const entry = await prisma.cocoHuskEntry.findUnique({ where: { id } });
    if (!entry) return res.status(404).json({ error: 'Entry not found' });

    await prisma.cocoHuskEntry.delete({ where: { id } });
    await recalculateCustomerLedger(entry.customerId);

    res.json({ success: true, message: 'Coco Husk entry deleted.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/husk/:id/payment (Add Payment to Husk Entry)
router.post('/husk/:id/payment', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { amount, date, paymentMethod, notes } = req.body;

    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid positive amount is required.' });

    const entry = await prisma.cocoHuskEntry.findUnique({
      where: { id },
      include: { customer: true },
    });
    if (!entry) return res.status(440).json({ error: 'Coco husk entry not found.' });

    const pDate = date ? new Date(date) : new Date();
    const payVal = parseFloat(amount);

    const payment = await prisma.payment.create({
      data: {
        amount: payVal,
        date: pDate,
        paymentMethod: paymentMethod || 'CASH',
        notes: notes || `Payment for Coco Husk Receipt: ${entry.receiptNumber}`,
        customerId: entry.customerId,
        cocoHuskEntryId: entry.id,
      },
    });

    // Update coco husk entry receivedIncome & status
    const newReceived = entry.receivedIncome + payVal;
    const newProfit = newReceived - entry.totalExpense;

    const tempEntry = { expectedIncome: entry.expectedIncome, receivedIncome: newReceived, paymentDueDate: entry.paymentDueDate };
    const newStatus = getHuskPaymentStatus(tempEntry);

    await prisma.cocoHuskEntry.update({
      where: { id },
      data: {
        receivedIncome: newReceived,
        profitLoss: newProfit,
        paymentStatus: newStatus,
      },
    });

    // Create ledger entry
    let debit = 0;
    let credit = 0;
    let transactionType = 'PAYMENT_RECEIVED';
    let side = 'CUSTOMER';

    if (entry.customer.type === 'SUPPLIER') {
      debit = payVal;
      transactionType = 'PAYMENT_MADE';
      side = 'SUPPLIER';
    } else {
      credit = payVal;
      transactionType = 'PAYMENT_RECEIVED';
      side = 'CUSTOMER';
    }

    await prisma.ledgerEntry.create({
      data: {
        partyId: entry.customerId,
        partyType: side,
        transactionType,
        debit,
        credit,
        amount: payVal,
        description: notes || `Payment for Coco Husk Entry: ${entry.receiptNumber}`,
        relatedBatchId: entry.batchId,
        cocoHuskEntryId: entry.id,
        balanceAfter: 0.0,
        createdAt: pDate,
      },
    });

    await recalculateCustomerLedger(entry.customerId);
    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ----------------------------------------------------
// 7. EXPENSES MODULE ENDPOINTS
// ----------------------------------------------------

// GET /api/expenses
router.get('/expenses', async (req, res) => {
  try {
    const { batchId } = req.query;
    const where = {};
    if (batchId) where.batchId = parseInt(batchId);

    const expenses = await prisma.expense.findMany({
      where,
      include: { batch: true },
      orderBy: { date: 'desc' },
    });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/expenses
router.post('/expenses', authenticateToken, async (req, res) => {
  try {
    const { batchId, expenseType, amount, date, description } = req.body;
    if (!batchId || !expenseType || !amount || !date) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const expense = await prisma.expense.create({
      data: {
        batchId: parseInt(batchId),
        expenseType,
        amount: parseFloat(amount),
        date: new Date(date),
        description,
      },
    });
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/expenses/:id
router.put('/expenses/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { batchId, expenseType, amount, date, description } = req.body;

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        batchId: parseInt(batchId),
        expenseType,
        amount: parseFloat(amount),
        date: new Date(date),
        description,
      },
    });
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/expenses/:id
router.delete('/expenses/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.expense.delete({ where: { id } });
    res.json({ success: true, message: 'Expense deleted.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ----------------------------------------------------
// 8. PAYMENT TRACKING ENDPOINTS
// ----------------------------------------------------

// GET /api/payments
router.get('/payments', async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        customer: true,
        coconutEntry: true,
        cocoHuskEntry: true,
      },
      orderBy: { date: 'desc' },
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/payments/pending (husk entries where balance > 0)
router.get('/payments/pending', async (req, res) => {
  try {
    const husks = await prisma.cocoHuskEntry.findMany({
      include: { customer: true, batch: true },
      orderBy: { date: 'desc' },
    });

    const pending = husks
      .map(e => ({ ...e, paymentStatus: getHuskPaymentStatus(e) }))
      .filter(e => e.paymentStatus === 'PENDING' || e.paymentStatus === 'PARTIAL' || e.paymentStatus === 'OVERDUE');

    res.json(pending);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ----------------------------------------------------
// 9. REPORTS ENDPOINTS
// ----------------------------------------------------

// GET /api/reports/dashboard
router.get('/reports/dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Today's entries
    const cocoToday = await prisma.coconutEntry.count({
      where: { date: { gte: today } },
    });
    const huskToday = await prisma.cocoHuskEntry.count({
      where: { date: { gte: today } },
    });

    // Active batches
    const activeCocoBatches = await prisma.batch.count({
      where: { batchType: 'COCONUT', status: 'ACTIVE' },
    });
    const activeHuskBatches = await prisma.batch.count({
      where: { batchType: 'COCO_HUSK', status: 'ACTIVE' },
    });

    // Standalone expenses + entry expenses
    const directExpenses = await prisma.expense.findMany();
    const directExpSum = directExpenses.reduce((s, e) => s + e.amount, 0);

    const huskEntries = await prisma.cocoHuskEntry.findMany();
    const huskExpSum = huskEntries.reduce((s, e) => s + e.totalExpense, 0);

    const cocoEntries = await prisma.coconutEntry.findMany();
    const cocoCostSum = cocoEntries.reduce((s, e) => s + e.totalAmount, 0);

    const totalExpensesSum = directExpSum + huskExpSum + cocoCostSum;

    // Income
    const huskIncome = huskEntries.reduce((s, e) => s + e.receivedIncome, 0);
    // Coconut income: if coconut entry is custom sale, payments received. If it's purchase, we paid it.
    // Let's sum all general payment received (credit entries)
    const allCredits = await prisma.ledgerEntry.findMany({
      where: { transactionType: 'PAYMENT_RECEIVED' },
    });
    const totalPaymentsReceived = allCredits.reduce((s, c) => s + c.credit, 0);

    // Profit/Loss:
    // Profit = Total Income (Husk expectedIncome or receivedIncome? Let's use expectedIncome for total, or receivedIncome).
    // Let's define Profit = Expected Income from all Sales - Total Expenses.
    // Since expected income represents sales:
    const cocoSales = await prisma.ledgerEntry.findMany({
      where: { transactionType: 'SALE' },
    });
    const cocoSalesSum = cocoSales.reduce((s, sale) => s + sale.debit, 0);
    const huskSalesSum = huskEntries.reduce((s, e) => s + e.expectedIncome, 0);

    const totalSalesRevenue = cocoSalesSum + huskSalesSum;
    const totalProfitLoss = totalSalesRevenue - totalExpensesSum;

    // Receivables and Payables separately
    const customers = await prisma.customer.findMany({ where: { isActive: true } });
    
    let totalReceivable = 0;
    let totalPayable = 0;

    for (const c of customers) {
      if (c.type === 'CUSTOMER') {
        totalReceivable += Math.max(0, c.currentBalance);
      } else if (c.type === 'SUPPLIER') {
        totalPayable += Math.max(0, c.currentBalance);
      } else if (c.type === 'BOTH') {
        // For BOTH, calculate components dynamically:
        const ledgers = await prisma.ledgerEntry.findMany({ where: { partyId: c.id } });
        
        let customerBalance = 0;
        let supplierBalance = 0;

        for (const entry of ledgers) {
          if (entry.partyType === 'CUSTOMER') {
            customerBalance = customerBalance + entry.debit - entry.credit;
          } else if (entry.partyType === 'SUPPLIER') {
            supplierBalance = supplierBalance + entry.credit - entry.debit;
          }
        }

        if (customerBalance > 0) totalReceivable += customerBalance;
        if (supplierBalance > 0) totalPayable += supplierBalance;
      }
    }

    // Pending 21-day payments
    const pendingHuskPayments = huskEntries
      .map(e => ({ ...e, paymentStatus: getHuskPaymentStatus(e) }))
      .filter(e => e.paymentStatus !== 'PAID');
    const pendingHuskCount = pendingHuskPayments.length;
    const pendingHuskBalance = pendingHuskPayments.reduce((s, e) => s + (e.expectedIncome - e.receivedIncome), 0);

    res.json({
      todayTransactions: cocoToday + huskToday,
      activeCocoBatches,
      activeHuskBatches,
      pendingPaymentsCount: pendingHuskCount,
      pendingPaymentsAmount: pendingHuskBalance,
      totalExpenses: totalExpensesSum,
      totalReceivedIncome: totalPaymentsReceived,
      totalProfitLoss,
      totalReceivable,
      totalPayable,
      netPosition: totalReceivable - totalPayable,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/daily
router.get('/reports/daily', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0,0,0,0);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const cocoEntries = await prisma.coconutEntry.findMany({
      where: { date: { gte: targetDate, lt: nextDate } },
      include: { customer: true },
    });

    const huskEntries = await prisma.cocoHuskEntry.findMany({
      where: { date: { gte: targetDate, lt: nextDate } },
      include: { customer: true },
    });

    const expenses = await prisma.expense.findMany({
      where: { date: { gte: targetDate, lt: nextDate } },
    });

    const payments = await prisma.payment.findMany({
      where: { date: { gte: targetDate, lt: nextDate } },
      include: { customer: true },
    });

    res.json({
      coconut: cocoEntries,
      husk: huskEntries,
      expenses,
      payments,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/customer/:id
router.get('/reports/customer/:id', async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    const { startDate, endDate } = req.query;

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) return res.status(404).json({ error: 'Customer not found.' });

    const where = { partyId: customerId };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const ledger = await prisma.ledgerEntry.findMany({
      where,
      orderBy: [
        { createdAt: 'asc' },
        { id: 'asc' },
      ],
      include: {
        batch: true,
      },
    });

    // Compute dynamic running balances
    let totalDebit = ledger.reduce((s, e) => s + e.debit, 0);
    let totalCredit = ledger.reduce((s, e) => s + e.credit, 0);

    // Separate Receivable and Payable if BOTH type
    let dynamicReceivable = 0;
    let dynamicPayable = 0;

    if (customer.type === 'BOTH') {
      ledger.forEach(e => {
        if (e.partyType === 'CUSTOMER') {
          dynamicReceivable = dynamicReceivable + e.debit - e.credit;
        } else if (e.partyType === 'SUPPLIER') {
          dynamicPayable = dynamicPayable + e.credit - e.debit;
        }
      });
    }

    res.json({
      customer,
      ledger,
      totals: {
        totalDebit,
        totalCredit,
        dynamicReceivable,
        dynamicPayable,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/profit-loss
router.get('/reports/profit-loss', async (req, res) => {
  try {
    const { startDate, endDate, productType } = req.query;
    
    const cocoWhere = {};
    const huskWhere = {};
    const expWhere = {};

    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;

      if (start || end) {
        const range = {};
        if (start) range.gte = start;
        if (end) range.lte = end;
        
        cocoWhere.date = range;
        huskWhere.date = range;
        expWhere.date = range;
      }
    }

    let cocoRevenue = 0;
    let cocoCost = 0;
    let huskRevenue = 0;
    let huskCost = 0;
    let directExp = 0;

    if (!productType || productType === 'ALL' || productType === 'COCONUT') {
      const cocoEntries = await prisma.coconutEntry.findMany({ where: cocoWhere, include: { customer: true } });
      cocoEntries.forEach(e => {
        if (e.customer.type === 'CUSTOMER') {
          cocoRevenue += e.totalAmount;
        } else {
          cocoCost += e.totalAmount;
        }
      });
    }

    if (!productType || productType === 'ALL' || productType === 'COCO_HUSK') {
      const huskEntries = await prisma.cocoHuskEntry.findMany({ where: huskWhere });
      huskEntries.forEach(e => {
        huskRevenue += e.expectedIncome;
        huskCost += e.totalExpense; // includes raw husk cost + processing costs
      });
    }

    if (!productType || productType === 'ALL') {
      const expenses = await prisma.expense.findMany({ where: expWhere });
      directExp = expenses.reduce((s, e) => s + e.amount, 0);
    }

    const totalRevenue = cocoRevenue + huskRevenue;
    const totalCost = cocoCost + huskCost + directExp;
    const netProfitLoss = totalRevenue - totalCost;

    res.json({
      revenue: totalRevenue,
      expenses: directExp,
      profitLoss: netProfitLoss,
      details: {
        coconutSales: cocoRevenue,
        huskSales: huskRevenue,
        coconutPurchases: cocoCost,
        huskPurchases: huskCost,
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/pending-payments
router.get('/reports/pending-payments', async (req, res) => {
  try {
    const husks = await prisma.cocoHuskEntry.findMany({
      include: { customer: true, batch: true },
      orderBy: { paymentDueDate: 'asc' },
    });

    const list = husks
      .map(e => ({
        ...e,
        paymentStatus: getHuskPaymentStatus(e),
      }))
      .filter(e => e.paymentStatus !== 'PAID');

    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/payments
router.get('/reports/payments', async (req, res) => {
  try {
    const batches = await prisma.batch.findMany({
      include: {
        coconutEntries: {
          include: { payments: true }
        },
        cocoHuskEntries: {
          include: { payments: true }
        }
      },
      orderBy: { startDate: 'desc' },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = batches.map(b => {
      const startDate = new Date(b.startDate);
      const deadlineDate = new Date(startDate);
      deadlineDate.setDate(deadlineDate.getDate() + 21);

      // Diff in days
      const diffTime = deadlineDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let totalCostOrIncome = 0;
      let outstandingBalance = 0;

      if (b.batchType === 'COCONUT') {
        b.coconutEntries.forEach(e => {
          totalCostOrIncome += e.totalAmount;
          const paid = e.payments.reduce((sum, p) => sum + p.amount, 0);
          outstandingBalance += Math.max(0, e.totalAmount - paid);
        });
      } else {
        b.cocoHuskEntries.forEach(e => {
          totalCostOrIncome += e.expectedIncome;
          const paid = e.payments.reduce((sum, p) => sum + p.amount, 0);
          outstandingBalance += Math.max(0, e.expectedIncome - e.receivedIncome);
        });
      }

      return {
        id: b.id,
        batchNumber: b.batchNumber,
        name: b.name,
        batchType: b.batchType,
        startDate: b.startDate,
        deadlineDate,
        daysRemaining,
        totalCostOrIncome,
        outstandingBalance,
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ----------------------------------------------------
// 10. QUICK BILLING INVOICE ENDPOINTS
// ----------------------------------------------------

// GET /api/invoices
router.get('/invoices', async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: { customer: true },
      orderBy: { date: 'desc' }
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/invoices/:id
router.get('/invoices/:id', async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { customer: true }
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/invoices
router.post('/invoices', authenticateToken, async (req, res) => {
  try {
    const {
      date, customerId, customerName, items, subTotal,
      discountPercent, discountAmount, taxPercent, taxAmount,
      totalAmount, paymentMethod, notes
    } = req.body;

    if (!customerId || !items || items.length === 0 || !totalAmount) {
      return res.status(400).json({ error: 'Customer, items, and total amount are required.' });
    }

    const customer = await prisma.customer.findUnique({ where: { id: parseInt(customerId) } });
    if (!customer) return res.status(400).json({ error: 'Customer not found.' });

    const invoiceDate = date ? new Date(date) : new Date();

    // Generate unique invoice number
    const count = await prisma.invoice.count();
    const dateStr = invoiceDate.toISOString().slice(0, 10).replace(/-/g, '');
    const invoiceNumber = `INV-${dateStr}-${1000 + count + 1}`;

    // Save the Invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        date: invoiceDate,
        customerId: parseInt(customerId),
        customerName: customerName || customer.name,
        itemsJson: JSON.stringify(items),
        subTotal: parseFloat(subTotal) || 0,
        discountPercent: parseFloat(discountPercent) || 0,
        discountAmount: parseFloat(discountAmount) || 0,
        taxPercent: parseFloat(taxPercent) || 0,
        taxAmount: parseFloat(taxAmount) || 0,
        totalAmount: parseFloat(totalAmount),
        paymentMethod: paymentMethod || 'CASH',
        notes: notes || ''
      }
    });

    const entryPartyType = customer.type === 'SUPPLIER' ? 'SUPPLIER' : 'CUSTOMER';

    // 1. Create Ledger Entry for the Sale
    await prisma.ledgerEntry.create({
      data: {
        partyId: customer.id,
        partyType: entryPartyType,
        transactionType: 'SALE',
        debit: parseFloat(totalAmount),
        credit: 0,
        amount: parseFloat(totalAmount),
        description: `Quick Invoice Sale: ${invoiceNumber}`,
        invoiceId: invoice.id,
        balanceAfter: 0.0, // calculated below
        createdAt: invoiceDate
      }
    });

    // 2. If CASH, also create a Payment and Ledger Entry for Payment Received
    if (paymentMethod === 'CASH') {
      const payment = await prisma.payment.create({
        data: {
          amount: parseFloat(totalAmount),
          date: invoiceDate,
          paymentMethod: 'CASH',
          notes: `Full payment for Invoice: ${invoiceNumber}`,
          customerId: customer.id,
          createdAt: invoiceDate
        }
      });

      await prisma.ledgerEntry.create({
        data: {
          partyId: customer.id,
          partyType: entryPartyType,
          transactionType: 'PAYMENT_RECEIVED',
          debit: 0,
          credit: parseFloat(totalAmount),
          amount: parseFloat(totalAmount),
          description: `Cash payment received for Invoice: ${invoiceNumber}`,
          invoiceId: invoice.id,
          balanceAfter: 0.0, // calculated below
          createdAt: invoiceDate
        }
      });
    }

    // Recalculate Ledger for this customer
    await recalculateCustomerLedger(customer.id);

    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/invoices/:id
router.delete('/invoices/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const inv = await prisma.invoice.findUnique({ where: { id } });
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });

    // delete payment if any
    await prisma.payment.deleteMany({
      where: {
        customerId: inv.customerId,
        notes: { contains: inv.invoiceNumber }
      }
    });

    // delete the invoice itself (cascades to ledger entries)
    await prisma.invoice.delete({ where: { id } });

    // recalculate customer balance
    await recalculateCustomerLedger(inv.customerId);

    res.json({ success: true, message: 'Invoice and associated entries deleted.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 11. QUICK BILLING ITEM/PRODUCT ENDPOINTS
// ----------------------------------------------------

// GET /api/invoice-products
router.get('/invoice-products', async (req, res) => {
  try {
    const products = await prisma.invoiceProduct.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/invoice-products
router.post('/invoice-products', authenticateToken, async (req, res) => {
  try {
    const { name, unit, defaultRate } = req.body;
    if (!name) return res.status(400).json({ error: 'Product name is required.' });

    const product = await prisma.invoiceProduct.create({
      data: {
        name,
        unit: unit || 'Unit',
        defaultRate: parseFloat(defaultRate) || 0.0
      }
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/invoice-products/:id
router.put('/invoice-products/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, unit, defaultRate } = req.body;

    const product = await prisma.invoiceProduct.update({
      where: { id },
      data: {
        name,
        unit,
        defaultRate: parseFloat(defaultRate) || 0.0
      }
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/invoice-products/:id
router.delete('/invoice-products/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.invoiceProduct.delete({ where: { id } });
    res.json({ success: true, message: 'Billing product deleted.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

