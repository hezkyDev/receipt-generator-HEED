const STORAGE_KEYS = {
  clients: "heed_clients",
  sessions: "heed_sessions",
  invoices: "heed_invoices",
  payments: "heed_payments"
};

function getData(key) {
  return JSON.parse(localStorage.getItem(key) || "[]");
}

function setData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function currency(value) {
  return `RM ${Number(value || 0).toFixed(2)}`;
}

function todayISO() {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function getCurrentMonthSessionCount(sessions) {
  const now = new Date();
  return sessions.filter((session) => {
    if (!session.date) return false;
    const d = new Date(session.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
}

function computeInvoiceBalance(invoice, payments) {
  const paid = payments
    .filter((payment) => payment.invoiceId === invoice.id)
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  return {
    paid,
    balance: Number(invoice.total || 0) - paid
  };
}

(function initDashboard() {
  const clientCountEl = document.getElementById("dashboardClientCount");
  const sessionCountEl = document.getElementById("dashboardSessionCount");
  const monthSessionCountEl = document.getElementById("dashboardMonthSessionCount");
  const invoiceCountEl = document.getElementById("dashboardInvoiceCount");
  const unpaidCountEl = document.getElementById("dashboardUnpaidCount");

  const clients = getData(STORAGE_KEYS.clients);
  const sessions = getData(STORAGE_KEYS.sessions);
  const invoices = getData(STORAGE_KEYS.invoices);
  const payments = getData(STORAGE_KEYS.payments);

  if (clientCountEl) clientCountEl.textContent = clients.length;
  if (sessionCountEl) sessionCountEl.textContent = sessions.length;
  if (monthSessionCountEl) monthSessionCountEl.textContent = getCurrentMonthSessionCount(sessions);
  if (invoiceCountEl) invoiceCountEl.textContent = invoices.length;
  if (unpaidCountEl) {
    const unpaid = invoices.filter((invoice) => computeInvoiceBalance(invoice, payments).balance > 0.009).length;
    unpaidCountEl.textContent = unpaid;
  }
})();