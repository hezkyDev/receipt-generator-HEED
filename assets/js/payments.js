const PAYMENTS_KEY = STORAGE_KEYS.payments;
function getPayments() { return getData(PAYMENTS_KEY); }
function savePayments(data) { setData(PAYMENTS_KEY, data); }
function getInvoices() { return getData(STORAGE_KEYS.invoices); }
function getClients() { return getData(STORAGE_KEYS.clients); }

function populateInvoices() {
  const select = document.getElementById("paymentInvoice");
  if (!select) return;
  const invoices = getInvoices();
  const clients = getClients();
  const payments = getPayments();
  select.innerHTML = invoices.length ? `<option value="">Select invoice</option>` : `<option value="">No invoices found</option>`;
  invoices.forEach((invoice) => {
    const client = clients.find((c) => c.id === invoice.clientId);
    const balanceInfo = computeInvoiceBalance(invoice, payments);
    const option = document.createElement("option");
    option.value = invoice.id;
    option.textContent = `${invoice.number} — ${client ? client.name : "-"} — Balance ${currency(balanceInfo.balance)}`;
    option.dataset.balance = balanceInfo.balance;
    select.appendChild(option);
  });
}

function autoFillPaymentAmount() {
  const select = document.getElementById("paymentInvoice");
  const amountInput = document.getElementById("paymentAmount");
  const option = select.options[select.selectedIndex];
  if (option && option.dataset.balance) amountInput.value = Number(option.dataset.balance).toFixed(2);
}

function renderPayments() {
  const list = document.getElementById("paymentList");
  if (!list) return;
  const payments = [...getPayments()].sort((a,b) => new Date(b.paymentDate) - new Date(a.paymentDate));
  const invoices = getInvoices();
  const clients = getClients();
  list.innerHTML = "";
  if (!payments.length) {
    list.innerHTML = `<div class="empty-state">No payments recorded yet.</div>`;
    return;
  }
  payments.forEach((payment) => {
    const invoice = invoices.find((i) => i.id === payment.invoiceId);
    const client = invoice ? clients.find((c) => c.id === invoice.clientId) : null;
    const card = document.createElement("div");
    card.className = "record-card";
    card.innerHTML = `
      <h4>${invoice ? invoice.number : "Unknown Invoice"}</h4>
      <div class="record-meta">Client: ${client ? client.name : "-"}
Date: ${formatDisplayDate(payment.paymentDate)}
Amount: ${currency(payment.amount)}
Method: ${payment.method || "-"}
Reference: ${payment.reference || "-"}</div>
      <div class="status-badge badge-paid">Payment Received</div>
      <div class="record-actions">
        <button class="warn" data-id="${payment.id}">Delete</button>
      </div>
    `;
    card.querySelector("button").addEventListener("click", () => {
      savePayments(getPayments().filter((item) => item.id !== payment.id));
      populateInvoices();
      renderPayments();
    });
    list.appendChild(card);
  });
}

function addPayment() {
  const invoiceId = document.getElementById("paymentInvoice").value;
  const paymentDate = document.getElementById("paymentDate").value;
  const amount = Number(document.getElementById("paymentAmount").value || 0);
  const method = document.getElementById("paymentMethod").value;
  const reference = document.getElementById("paymentReference").value.trim();

  if (!invoiceId) return alert("Please select an invoice.");
  if (!paymentDate) return alert("Please select payment date.");
  if (amount <= 0) return alert("Please enter valid amount.");

  const payments = getPayments();
  payments.push({
    id: crypto.randomUUID(),
    invoiceId,
    paymentDate,
    amount,
    method,
    reference
  });
  savePayments(payments);
  document.getElementById("paymentAmount").value = "";
  document.getElementById("paymentReference").value = "";
  populateInvoices();
  renderPayments();
}

document.getElementById("paymentInvoice")?.addEventListener("change", autoFillPaymentAmount);
document.getElementById("savePaymentBtn")?.addEventListener("click", addPayment);
document.getElementById("paymentDate") && (document.getElementById("paymentDate").value = todayISO());

populateInvoices();
renderPayments();