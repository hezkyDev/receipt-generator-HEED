const CLIENTS_STORAGE_KEY = STORAGE_KEYS.clients;

function getClients() {
  return getData(CLIENTS_STORAGE_KEY);
}

function saveClients(clients) {
  setData(CLIENTS_STORAGE_KEY, clients);
}

function renderClients() {
  const clientList = document.getElementById("clientList");
  if (!clientList) return;

  const clients = getClients();
  clientList.innerHTML = "";

  if (clients.length === 0) {
    clientList.innerHTML = `<div class="empty-state">No clients added yet.</div>`;
    return;
  }

  clients.forEach((client) => {
    const card = document.createElement("div");
    card.className = "record-card";

    card.innerHTML = `
      <h4>${client.name}</h4>
      <div class="record-meta">Guardian: ${client.guardian || "-"}
Phone: ${client.phone || "-"}
Email: ${client.email || "-"}
Rate: ${currency(client.rate)}
Notes: ${client.notes || "-"}</div>
      <div class="record-actions">
        <button class="warn" data-id="${client.id}">Delete</button>
      </div>
    `;

    card.querySelector("button").addEventListener("click", () => {
      const updated = getClients().filter((item) => item.id !== client.id);
      saveClients(updated);
      renderClients();
    });

    clientList.appendChild(card);
  });
}

function clearClientForm() {
  ["clientName", "clientGuardian", "clientPhone", "clientEmail", "clientRate", "clientNotes"].forEach((id) => {
    document.getElementById(id).value = "";
  });
}

function addClient() {
  const name = document.getElementById("clientName").value.trim();
  const guardian = document.getElementById("clientGuardian").value.trim();
  const phone = document.getElementById("clientPhone").value.trim();
  const email = document.getElementById("clientEmail").value.trim();
  const rate = document.getElementById("clientRate").value.trim();
  const notes = document.getElementById("clientNotes").value.trim();

  if (!name) {
    alert("Please enter client name.");
    return;
  }

  const clients = getClients();
  clients.push({
    id: crypto.randomUUID(),
    name,
    guardian,
    phone,
    email,
    rate: Number(rate || 0),
    notes
  });

  saveClients(clients);
  clearClientForm();
  renderClients();
}

function clearAllClients() {
  if (!confirm("Delete all clients?")) return;
  localStorage.removeItem(CLIENTS_STORAGE_KEY);
  renderClients();
}

document.getElementById("saveClientBtn")?.addEventListener("click", addClient);
document.getElementById("clearClientsBtn")?.addEventListener("click", clearAllClients);
renderClients();