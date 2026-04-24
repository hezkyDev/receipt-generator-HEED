const SESSIONS_STORAGE_KEY = STORAGE_KEYS.sessions;
const SESSION_CLIENTS_STORAGE_KEY = STORAGE_KEYS.clients;

function getSessions() {
  return getData(SESSIONS_STORAGE_KEY);
}
function saveSessions(sessions) {
  setData(SESSIONS_STORAGE_KEY, sessions);
}
function getClients() {
  return getData(SESSION_CLIENTS_STORAGE_KEY);
}

function populateClientDropdown() {
  const select = document.getElementById("sessionClient");
  if (!select) return;
  const clients = getClients();
  select.innerHTML = clients.length
    ? `<option value="">Select client</option>`
    : `<option value="">No clients found</option>`;

  clients.forEach((client) => {
    const option = document.createElement("option");
    option.value = client.id;
    option.textContent = client.name;
    option.dataset.rate = client.rate || "";
    select.appendChild(option);
  });
}

function autoFillRate() {
  const select = document.getElementById("sessionClient");
  const rateInput = document.getElementById("sessionRate");
  const selectedOption = select.options[select.selectedIndex];
  if (selectedOption && selectedOption.dataset.rate) {
    rateInput.value = selectedOption.dataset.rate;
  }
}

function renderSessions() {
  const sessionList = document.getElementById("sessionList");
  if (!sessionList) return;

  const sessions = [...getSessions()].sort((a, b) => new Date(b.date) - new Date(a.date));
  const clients = getClients();

  sessionList.innerHTML = "";

  if (sessions.length === 0) {
    sessionList.innerHTML = `<div class="empty-state">No sessions added yet.</div>`;
    return;
  }

  sessions.forEach((session) => {
    const client = clients.find((c) => c.id === session.clientId);
    const clientName = client ? client.name : "Unknown Client";
    const badgeClass = session.status === "Completed"
      ? "badge-paid"
      : session.status === "Pending Payment"
      ? "badge-pending"
      : "badge-cancelled";

    const card = document.createElement("div");
    card.className = "record-card";
    card.innerHTML = `
      <h4>${clientName}</h4>
      <div class="record-meta">Date: ${formatDisplayDate(session.date)}
Type: ${session.type || "-"}
Duration: ${session.duration || "-"}
Rate: ${currency(session.rate)}
Remarks: ${session.remarks || "-"}</div>
      <div class="status-badge ${badgeClass}">${session.status}</div>
      <div class="record-actions">
        <button class="warn" data-id="${session.id}">Delete</button>
      </div>
    `;
    card.querySelector("button").addEventListener("click", () => {
      saveSessions(getSessions().filter((item) => item.id !== session.id));
      renderSessions();
    });
    sessionList.appendChild(card);
  });
}

function clearSessionForm() {
  document.getElementById("sessionClient").value = "";
  document.getElementById("sessionDate").value = todayISO();
  document.getElementById("sessionType").value = "OT Session";
  document.getElementById("sessionDuration").value = "";
  document.getElementById("sessionRate").value = "";
  document.getElementById("sessionStatus").value = "Completed";
  document.getElementById("sessionRemarks").value = "";
}

function addSession() {
  const clientId = document.getElementById("sessionClient").value;
  const date = document.getElementById("sessionDate").value;
  const type = document.getElementById("sessionType").value.trim();
  const duration = document.getElementById("sessionDuration").value.trim();
  const rate = document.getElementById("sessionRate").value.trim();
  const status = document.getElementById("sessionStatus").value;
  const remarks = document.getElementById("sessionRemarks").value.trim();

  if (!clientId) return alert("Please select a client.");
  if (!date) return alert("Please select session date.");

  const sessions = getSessions();
  sessions.push({
    id: crypto.randomUUID(),
    clientId,
    date,
    type,
    duration,
    rate: Number(rate || 0),
    status,
    remarks
  });
  saveSessions(sessions);
  clearSessionForm();
  populateClientDropdown();
  renderSessions();
}

function clearAllSessions() {
  if (!confirm("Delete all sessions?")) return;
  localStorage.removeItem(SESSIONS_STORAGE_KEY);
  renderSessions();
}

document.getElementById("saveSessionBtn")?.addEventListener("click", addSession);
document.getElementById("clearSessionsBtn")?.addEventListener("click", clearAllSessions);
document.getElementById("sessionClient")?.addEventListener("change", autoFillRate);

populateClientDropdown();
clearSessionForm();
renderSessions();