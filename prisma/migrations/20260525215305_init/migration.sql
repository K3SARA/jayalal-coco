-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BusinessSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "name" TEXT NOT NULL DEFAULT 'JAYALAL COCO',
    "ownerName" TEXT NOT NULL DEFAULT 'R C JAYALAL',
    "address1" TEXT NOT NULL DEFAULT '374, HEMUDAWA',
    "address2" TEXT NOT NULL DEFAULT 'SADALANKAWA',
    "phone1" TEXT NOT NULL DEFAULT '031-2297165',
    "phone2" TEXT NOT NULL DEFAULT '0766184030',
    "phone3" TEXT NOT NULL DEFAULT '0782718584',
    "phone4" TEXT NOT NULL DEFAULT '0716184030',
    "regNumber" TEXT NOT NULL DEFAULT '',
    "secondaryName" TEXT NOT NULL DEFAULT 'JS COCO Products',
    "logoUrl" TEXT,
    "footerText" TEXT NOT NULL DEFAULT 'Thank You. Come Again!',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ReceiptSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "showLogo" BOOLEAN NOT NULL DEFAULT true,
    "showBusinessName" BOOLEAN NOT NULL DEFAULT true,
    "showOwnerName" BOOLEAN NOT NULL DEFAULT true,
    "showAddress" BOOLEAN NOT NULL DEFAULT true,
    "showPhoneNumbers" BOOLEAN NOT NULL DEFAULT true,
    "showRegistrationNumber" BOOLEAN NOT NULL DEFAULT true,
    "showCustomerName" BOOLEAN NOT NULL DEFAULT true,
    "showVehicleNumber" BOOLEAN NOT NULL DEFAULT true,
    "showProduct" BOOLEAN NOT NULL DEFAULT true,
    "showFirstWeight" BOOLEAN NOT NULL DEFAULT true,
    "showSecondWeight" BOOLEAN NOT NULL DEFAULT true,
    "showNetWeight" BOOLEAN NOT NULL DEFAULT true,
    "showDriverName" BOOLEAN NOT NULL DEFAULT true,
    "showOperatorName" BOOLEAN NOT NULL DEFAULT true,
    "showCustomerSignature" BOOLEAN NOT NULL DEFAULT true,
    "showDriverSignature" BOOLEAN NOT NULL DEFAULT true,
    "showDateTime" BOOLEAN NOT NULL DEFAULT true,
    "showFooter" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "type" TEXT NOT NULL,
    "openingBalance" REAL NOT NULL DEFAULT 0.0,
    "currentBalance" REAL NOT NULL DEFAULT 0.0,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "batchNumber" TEXT NOT NULL,
    "batchType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CoconutEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "receiptNumber" TEXT NOT NULL,
    "batchId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "customerId" INTEGER NOT NULL,
    "vehicleNumber" TEXT,
    "productName" TEXT NOT NULL DEFAULT 'Coconut',
    "firstWeight" REAL NOT NULL,
    "secondWeight" REAL NOT NULL,
    "netWeight" REAL NOT NULL,
    "ratePerKg" REAL,
    "totalAmount" REAL NOT NULL DEFAULT 0.0,
    "transportCost" REAL NOT NULL DEFAULT 0.0,
    "otherExpenses" REAL NOT NULL DEFAULT 0.0,
    "operatorName" TEXT,
    "driverName" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CoconutEntry_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CoconutEntry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CocoHuskEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "receiptNumber" TEXT NOT NULL,
    "batchId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "customerId" INTEGER NOT NULL,
    "vehicleNumber" TEXT,
    "huskCount" REAL NOT NULL,
    "ratePerHusk" REAL NOT NULL,
    "totalHuskAmount" REAL NOT NULL,
    "totalWeightKg" REAL NOT NULL,
    "averageWeightPer1000" REAL NOT NULL,
    "cuttingLabourCost" REAL NOT NULL DEFAULT 0.0,
    "dryingLabourCost" REAL NOT NULL DEFAULT 0.0,
    "transportCost" REAL NOT NULL DEFAULT 0.0,
    "otherExpense" REAL NOT NULL DEFAULT 0.0,
    "totalExpense" REAL NOT NULL,
    "expectedIncome" REAL NOT NULL DEFAULT 0.0,
    "receivedIncome" REAL NOT NULL DEFAULT 0.0,
    "paymentDueDate" DATETIME NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "profitLoss" REAL NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CocoHuskEntry_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CocoHuskEntry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "batchId" INTEGER NOT NULL,
    "expenseType" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Expense_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'CASH',
    "notes" TEXT,
    "customerId" INTEGER NOT NULL,
    "coconutEntryId" INTEGER,
    "cocoHuskEntryId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payment_coconutEntryId_fkey" FOREIGN KEY ("coconutEntryId") REFERENCES "CoconutEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payment_cocoHuskEntryId_fkey" FOREIGN KEY ("cocoHuskEntryId") REFERENCES "CocoHuskEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "partyId" INTEGER NOT NULL,
    "partyType" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "debit" REAL NOT NULL DEFAULT 0.0,
    "credit" REAL NOT NULL DEFAULT 0.0,
    "amount" REAL NOT NULL DEFAULT 0.0,
    "description" TEXT,
    "relatedBatchId" INTEGER,
    "coconutEntryId" INTEGER,
    "cocoHuskEntryId" INTEGER,
    "balanceAfter" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LedgerEntry_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LedgerEntry_relatedBatchId_fkey" FOREIGN KEY ("relatedBatchId") REFERENCES "Batch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LedgerEntry_coconutEntryId_fkey" FOREIGN KEY ("coconutEntryId") REFERENCES "CoconutEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LedgerEntry_cocoHuskEntryId_fkey" FOREIGN KEY ("cocoHuskEntryId") REFERENCES "CocoHuskEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_batchNumber_key" ON "Batch"("batchNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CoconutEntry_receiptNumber_key" ON "CoconutEntry"("receiptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CocoHuskEntry_receiptNumber_key" ON "CocoHuskEntry"("receiptNumber");
