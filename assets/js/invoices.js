const INVOICES_STORAGE_KEY = STORAGE_KEYS.invoices;
const INVOICE_SESSIONS_STORAGE_KEY = STORAGE_KEYS.sessions;
const INVOICE_CLIENTS_STORAGE_KEY = STORAGE_KEYS.clients;
const PAYMENTS_STORAGE_KEY = STORAGE_KEYS.payments;

const monthNames = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

function getInvoices() { return getData(INVOICES_STORAGE_KEY); }
function saveInvoices(data) { setData(INVOICES_STORAGE_KEY, data); }
function getSessions() { return getData(INVOICE_SESSIONS_STORAGE_KEY); }
function getClients() { return getData(INVOICE_CLIENTS_STORAGE_KEY); }
function getPayments() { return getData(PAYMENTS_STORAGE_KEY); }

function populateInvoiceClients() {
  const select = document.getElementById("invoiceClient");
  if (!select) return;
  const clients = getClients();
  select.innerHTML = clients.length ? `<option value="">Select client</option>` : `<option value="">No clients found</option>`;
  clients.forEach((client) => {
    const option = document.createElement("option");
    option.value = client.id;
    option.textContent = client.name;
    select.appendChild(option);
  });
}

function generateInvoiceNumber(dateStr) {
  const d = new Date(dateStr || todayISO());
  const year = d.getFullYear();
  const month = d.getMonth();
  const key = `heed-invoice-counter-${year}-${String(month + 1).padStart(2, "0")}`;
  const next = Number(localStorage.getItem(key) || 0) + 1;
  localStorage.setItem(key, String(next));
  return `# ${year}/${monthNames[month]}/${String(next).padStart(3, "0")}`;
}

function loadClientSessionsForRange() {
  const clientId = document.getElementById("invoiceClient").value;
  const from = document.getElementById("invoiceFrom").value;
  const to = document.getElementById("invoiceTo").value;
  const list = document.getElementById("invoiceSessionList");
  list.innerHTML = "";
  if (!clientId || !from || !to) {
    list.innerHTML = `<div class="empty-state">Select client and date range to load sessions.</div>`;
    return;
  }

  const sessions = getSessions().filter((session) => {
    return session.clientId === clientId && session.status !== "Cancelled" && session.date >= from && session.date <= to;
  });

  if (!sessions.length) {
    list.innerHTML = `<div class="empty-state">No sessions found for this range.</div>`;
    return;
  }

  sessions.sort((a, b) => a.date.localeCompare(b.date)).forEach((session) => {
    const row = document.createElement("label");
    row.className = "record-card";
    row.innerHTML = `
      <div style="display:flex; gap:12px; align-items:flex-start;">
        <input type="checkbox" class="invoice-session-checkbox" value="${session.id}" checked />
        <div class="record-meta">Date: ${formatDisplayDate(session.date)}
Type: ${session.type || "-"}
Duration: ${session.duration || "-"}
Rate: ${currency(session.rate)}</div>
      </div>
    `;
    list.appendChild(row);
  });
}

function createInvoice() {
  const clientId = document.getElementById("invoiceClient").value;
  const invoiceDate = document.getElementById("invoiceDate").value;
  const from = document.getElementById("invoiceFrom").value;
  const to = document.getElementById("invoiceTo").value;
  const selectedIds = [...document.querySelectorAll(".invoice-session-checkbox:checked")].map((el) => el.value);

  if (!clientId) return alert("Please select a client.");
  if (!invoiceDate) return alert("Please select invoice date.");
  if (!selectedIds.length) return alert("Please select at least one session.");

  const sessions = getSessions().filter((session) => selectedIds.includes(session.id));
  const subtotal = sessions.reduce((sum, session) => sum + Number(session.rate || 0), 0);
  const total = subtotal;

  const invoices = getInvoices();
  invoices.push({
    id: crypto.randomUUID(),
    number: generateInvoiceNumber(invoiceDate),
    clientId,
    invoiceDate,
    from,
    to,
    sessionIds: selectedIds,
    subtotal,
    tax: 0,
    total,
    createdAt: new Date().toISOString()
  });
  saveInvoices(invoices);
  renderInvoices();
  alert("Invoice created.");
}

function renderInvoices() {
  const list = document.getElementById("invoiceList");
  if (!list) return;
  const invoices = [...getInvoices()].sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate));
  const clients = getClients();
  const payments = getPayments();
  list.innerHTML = "";

  if (!invoices.length) {
    list.innerHTML = `<div class="empty-state">No invoices created yet.</div>`;
    return;
  }

  invoices.forEach((invoice) => {
    const client = clients.find((c) => c.id === invoice.clientId);
    const balanceInfo = computeInvoiceBalance(invoice, payments);
    const badgeClass = balanceInfo.balance <= 0.009 ? "badge-paid" : balanceInfo.paid > 0 ? "badge-pending" : "badge-unpaid";
    const badgeText = balanceInfo.balance <= 0.009 ? "Paid" : balanceInfo.paid > 0 ? "Partially Paid" : "Unpaid";

    const card = document.createElement("div");
    card.className = "record-card";
    card.innerHTML = `
      <h4>${invoice.number}</h4>
      <div class="record-meta">Client: ${client ? client.name : "-"}
Date: ${formatDisplayDate(invoice.invoiceDate)}
Period: ${formatDisplayDate(invoice.from)} to ${formatDisplayDate(invoice.to)}
Sessions: ${invoice.sessionIds.length}
Total: ${currency(invoice.total)}
Paid: ${currency(balanceInfo.paid)}
Balance: ${currency(balanceInfo.balance)}</div>
      <div class="status-badge ${badgeClass}">${badgeText}</div>
      <div class="record-actions">
        <button class="accent" data-action="open" data-id="${invoice.id}">Open in Receipt</button>
        <button class="warn" data-action="delete" data-id="${invoice.id}">Delete</button>
      </div>
    `;
    card.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.dataset.action === "delete") {
          saveInvoices(getInvoices().filter((item) => item.id !== invoice.id));
          renderInvoices();
        } else {
          window.location.href = `receipt.html?invoiceId=${invoice.id}`;
        }
      });
    });
    list.appendChild(card);
  });
}

document.getElementById("loadSessionsBtn")?.addEventListener("click", loadClientSessionsForRange);
document.getElementById("createInvoiceBtn")?.addEventListener("click", createInvoice);

populateInvoiceClients();
document.getElementById("invoiceDate") && (document.getElementById("invoiceDate").value = todayISO());
document.getElementById("invoiceFrom") && (document.getElementById("invoiceFrom").value = todayISO().slice(0,8)+"01");
document.getElementById("invoiceTo") && (document.getElementById("invoiceTo").value = todayISO());
renderInvoices();