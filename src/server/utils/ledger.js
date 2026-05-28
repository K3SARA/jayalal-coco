const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Calculates the balanceAfter value based on previousBalance, partyType, debit, and credit.
 */
function calculateBalanceAfter(previousBalance, partyType, debit, credit) {
  const prev = Number(previousBalance) || 0;
  const db = Number(debit) || 0;
  const cr = Number(credit) || 0;

  if (partyType === 'CUSTOMER') {
    return prev + db - cr;
  } else if (partyType === 'SUPPLIER') {
    return prev + cr - db;
  }
  return prev;
}

/**
 * Recalculates the entire ledger history for a given customer/supplier.
 * Updates the running balanceAfter for each LedgerEntry and syncs the Customer's currentBalance.
 */
async function recalculateCustomerLedger(customerId) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!customer) {
    console.error(`Customer with ID ${customerId} not found for ledger recalculation.`);
    return;
  }

  // Get all ledger entries for this party in chronological order
  const entries = await prisma.ledgerEntry.findMany({
    where: { partyId: customerId },
    orderBy: [
      { createdAt: 'asc' },
      { id: 'asc' },
    ],
  });

  let runningBalance = Number(customer.openingBalance) || 0;

  for (const entry of entries) {
    // If the customer type is CUSTOMER, use CUSTOMER formula.
    // If SUPPLIER, use SUPPLIER formula.
    // If BOTH, use the direction saved in entry.partyType (which is CUSTOMER or SUPPLIER).
    let entryPartyType = entry.partyType;
    if (customer.type === 'CUSTOMER') entryPartyType = 'CUSTOMER';
    if (customer.type === 'SUPPLIER') entryPartyType = 'SUPPLIER';

    const balanceAfter = calculateBalanceAfter(runningBalance, entryPartyType, entry.debit, entry.credit);

    if (entry.balanceAfter !== balanceAfter) {
      await prisma.ledgerEntry.update({
        where: { id: entry.id },
        data: { balanceAfter },
      });
    }

    runningBalance = balanceAfter;
  }

  // Update customer's current balance
  // For BOTH type, we calculate components dynamically on fetch, but save the runningBalance in currentBalance.
  await prisma.customer.update({
    where: { id: customerId },
    data: { currentBalance: runningBalance },
  });
}

module.exports = {
  calculateBalanceAfter,
  recalculateCustomerLedger,
};
