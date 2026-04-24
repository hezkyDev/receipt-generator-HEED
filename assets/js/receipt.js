const DEFAULT_LOGO = "HEED_DEV-logo.png";

function getInvoices() { return getData(STORAGE_KEYS.invoices); }
function getClients() { return getData(STORAGE_KEYS.clients); }
function getSessions() { return getData(STORAGE_KEYS.sessions); }
function getPayments() { return getData(STORAGE_KEYS.payments); }

function getInvoiceIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("invoiceId");
}

function loadInvoice(invoiceId) {
  const invoice = getInvoices().find((item) => item.id === invoiceId);
  if (!invoice) return null;

  const client = getClients().find((item) => item.id === invoice.clientId);
  const sessions = getSessions().filter((item) => invoice.sessionIds.includes(item.id));
  const payments = getPayments().filter((item) => item.invoiceId === invoice.id);
  return { invoice, client, sessions, payments };
}

function renderReceipt() {
  const invoiceId = getInvoiceIdFromUrl();
  const list = document.getElementById("receiptInvoiceSelect");
  if (list) {
    const invoices = getInvoices();
    list.innerHTML = invoices.length ? `<option value="">Select invoice</option>` : `<option value="">No invoices found</option>`;
    invoices.forEach((invoice) => {
      const option = document.createElement("option");
      option.value = invoice.id;
      option.textContent = invoice.number;
      if (invoice.id === invoiceId) option.selected = true;
      list.appendChild(option);
    });
  }

  const payload = invoiceId ? loadInvoice(invoiceId) : null;
  if (!payload) {
    document.getElementById("receiptSheet").innerHTML = `<div class="empty-state">Select an invoice to preview receipt/invoice.</div>`;
    return;
  }

  const { invoice, client, sessions, payments } = payload;
  const paymentInfo = computeInvoiceBalance(invoice, payments);
  const rows = sessions.map((session) => `
    <tr>
      <td>${session.type || "OT Session"} - ${formatDisplayDate(session.date)}</td>
      <td>1</td>
      <td>${currency(session.rate)}</td>
      <td>${currency(session.rate)}</td>
    </tr>
  `).join("");

  document.getElementById("receiptSheet").innerHTML = `
    <div class="receipt-top">
      <div class="branding">
        <div class="logo-box"><img id="previewLogo" alt="Company logo" src="${DEFAULT_LOGO}" /></div>
        <div class="company-name">HEED DEVELOPMENT THERAPY</div>
        <div class="company-address">JALAN 1/48A,\nBANDAR BARU SENTUL,\n51000 KUALA LUMPUR</div>
      </div>

      <div class="summary-card">
        <div class="label">Balance Due</div>
        <div class="due-amount">${currency(paymentInfo.balance)}</div>
        <div class="meta-title">Date</div>
        <div class="date-content">${formatDisplayDate(invoice.invoiceDate)}</div>
        <div class="invoice-label">Invoice</div>
        <div class="invoice-number">${invoice.number}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="bill-box">
        <div class="bill-title">Bill To:</div>
        <div class="bill-content">${client ? client.name : "-"}${client?.guardian ? `\n${client.guardian}` : ""}</div>
      </div>
      <div class="date-box">
        <div class="bill-title">Period:</div>
        <div class="date-content">${formatDisplayDate(invoice.from)} to ${formatDisplayDate(invoice.to)}</div>
      </div>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th class="table-head">Item</th>
          <th class="table-head">Quantity</th>
          <th class="table-head">Rate</th>
          <th class="table-head">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="totals">
      <div class="total-row"><span>Subtotal:</span><strong>${currency(invoice.subtotal)}</strong></div>
      <div class="total-row"><span>Tax (0%):</span><strong>${currency(0)}</strong></div>
      <div class="total-row"><span>Paid:</span><strong>${currency(paymentInfo.paid)}</strong></div>
      <div class="total-row grand-total"><span>Balance:</span><strong>${currency(paymentInfo.balance)}</strong></div>
    </div>

    <div class="bottom-notes">
      <div class="note-block">
        <h3>Notes</h3>
        <p>Generated from saved sessions.\nPayment status updates automatically from Payment Tracker.</p>
      </div>
      <div class="note-block">
        <h3>Banking Notes Detail</h3>
        <p>BANK NAME: MAYBANK\nACCOUNT NAME: HEED DEVELOPMENT THERAPY\nACCOUNT NUMBER: 564472639518</p>
      </div>
    </div>
  `;
}

document.getElementById("receiptInvoiceSelect")?.addEventListener("change", (e) => {
  if (!e.target.value) return;
  window.location.href = `receipt.html?invoiceId=${e.target.value}`;
});

renderReceipt();