const AgentWalletTransaction = require("../../models/agent/AgentWalletTransaction");
const { sendSuccess, sendError } = require("../../helpers/apiResponse");

// GET /api/agent/wallet/my-transactions
const getMyWalletTransactions = async (req, res) => {
  try {
    const transactions = await AgentWalletTransaction.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    // Current balance = latest transaction's balanceAfter (0 if none yet)
    const currentBalance = transactions.length
      ? transactions[0].balanceAfter
      : 0;

    const totals = transactions.reduce(
      (acc, tx) => {
        if (tx.type === "credit") acc.totalCredit += tx.amount;
        if (tx.type === "debit") acc.totalDebit += tx.amount;
        return acc;
      },
      { totalCredit: 0, totalDebit: 0 }
    );

    return sendSuccess(res, 200, "Wallet transactions fetched successfully", {
      data: transactions,
      currentBalance,
      ...totals,
    });
  } catch (error) {
    console.error("Get my wallet transactions error:", error);
    return sendError(
      res,
      500,
      error.message || "Failed to fetch wallet transactions"
    );
  }
};

module.exports = { getMyWalletTransactions };
