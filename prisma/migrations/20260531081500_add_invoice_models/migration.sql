-- CreateTable
CREATE TABLE "Invoice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceNumber" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerId" INTEGER NOT NULL,
    "customerName" TEXT NOT NULL,
    "itemsJson" TEXT NOT NULL,
    "subTotal" REAL NOT NULL,
    "discountPercent" REAL NOT NULL DEFAULT 0.0,
    "discountAmount" REAL NOT NULL DEFAULT 0.0,
    "taxPercent" REAL NOT NULL DEFAULT 0.0,
    "taxAmount" REAL NOT NULL DEFAULT 0.0,
    "totalAmount" REAL NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'CASH',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InvoiceProduct" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'Unit',
    "defaultRate" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LedgerEntry" (
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
    "invoiceId" INTEGER,
    "balanceAfter" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LedgerEntry_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LedgerEntry_relatedBatchId_fkey" FOREIGN KEY ("relatedBatchId") REFERENCES "Batch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LedgerEntry_coconutEntryId_fkey" FOREIGN KEY ("coconutEntryId") REFERENCES "CoconutEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LedgerEntry_cocoHuskEntryId_fkey" FOREIGN KEY ("cocoHuskEntryId") REFERENCES "CocoHuskEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LedgerEntry_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_LedgerEntry" ("amount", "balanceAfter", "cocoHuskEntryId", "coconutEntryId", "createdAt", "credit", "debit", "description", "id", "partyId", "partyType", "relatedBatchId", "transactionType", "updatedAt") SELECT "amount", "balanceAfter", "cocoHuskEntryId", "coconutEntryId", "createdAt", "credit", "debit", "description", "id", "partyId", "partyType", "relatedBatchId", "transactionType", "updatedAt" FROM "LedgerEntry";
DROP TABLE "LedgerEntry";
ALTER TABLE "new_LedgerEntry" RENAME TO "LedgerEntry";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceProduct_name_key" ON "InvoiceProduct"("name");
