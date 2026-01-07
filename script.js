// DOM helpers
const $ = (id) => document.getElementById(id);

// Elements
const setupScreen = $("setup-screen");
const setupDisplayName = $("setup-displayname");
const setupVaultChoice = $("setup-vault-choice");
const setupPassword = $("setup-password");
const setupSaveBtn = $("setup-save-btn");

const appContainer = $("app-container");
const pages = document.querySelectorAll(".page");
const navItems = document.querySelectorAll(".nav-item");

const countNormal = $("count-normal");
const countProtected = $("count-protected");
const vaultStatusText = $("vault-status-text");
const openVaultBtn = $("open-vault-btn");

const normalTitle = $("normal-title");
const normalContent = $("normal-content");
const addNormalBtn = $("add-normal-btn");
const normalDocsList = $("normal-docs-list");
const normalSearch = $("normal-search");

const vaultTitle = $("vault-title");
const vaultContent = $("vault-content");
const addVaultBtn = $("add-vault-btn");
const vaultDocsList = $("vault-docs-list");
const lockVaultBtn = $("lock-vault-btn");
const vaultSearch = $("vault-search");

const profileName = $("profile-name");
const profileSerial = $("profile-serial");
const profileVaultEnabled = $("profile-vault-enabled");
const recentDocsList = $("recent-docs-list");

const vaultModal = $("vault-modal");
const vaultPasswordInput = $("vault-password-input");
const vaultUnlockBtn = $("vault-unlock-btn");
const vaultCancelBtn = $("vault-cancel-btn");

const mobileMenuBtn = $("mobile-menu-btn");
const sidebarEl = document.querySelector(".sidebar");

const vaultExportBtn = $("vault-export-btn");
const vaultImportBtn = $("vault-import-btn");
const vaultImportInput = $("vault-import-input");

// Storage keys
const STORAGE_PROFILE = "docvault_profile";
const STORAGE_NORMAL = "docvault_normal_docs";
const STORAGE_VAULT = "docvault_protected_vault";

// State
let profile = null;
let normalDocs = [];
let decryptedVaultData = [];
let vaultUnlocked = false;
let normalSearchTerm = "";
let vaultSearchTerm = "";

// Storage helpers
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const load = (k, d) => JSON.parse(localStorage.getItem(k)) ?? d;

// Serial
const generateSerialID = () =>
  `DOC-${Math.floor(1000 + Math.random() * 9000)}-${Math.random()
    .toString(16)
    .slice(2, 6)
    .toUpperCase()}`;

// Page switch
function switchPage(id) {
  pages.forEach((p) => p.classList.remove("visible"));
  $(id)?.classList.add("visible");
}

function setActiveNav(pageId) {
  navItems.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.page === pageId);
  });
}

// Dashboard
function updateDashboard() {
  countNormal.textContent = normalDocs.length;

  const enc = load(STORAGE_VAULT, null);
  countProtected.textContent = enc?.count || 0;

  if (vaultUnlocked) {
    vaultStatusText.textContent = "Unlocked";
    openVaultBtn.textContent = "Lock Vault";
    openVaultBtn.classList.remove("btn-accent");
    openVaultBtn.classList.add("btn-ghost");
  } else {
    vaultStatusText.textContent = "Locked";
    openVaultBtn.textContent = "Unlock Vault";
    openVaultBtn.classList.remove("btn-ghost");
    openVaultBtn.classList.add("btn-accent");
  }

  renderRecentDocs();
}

// Crypto helpers
const bufToBase64 = (b) => btoa(String.fromCharCode(...new Uint8Array(b)));
const base64ToBuf = (b) =>
  Uint8Array.from(atob(b), (c) => c.charCodeAt(0)).buffer;

async function deriveKey(password, salt, iterations = 100000) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    key,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptVault(data, password) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(JSON.stringify(data))
  );
  return {
    salt: bufToBase64(salt),
    iv: bufToBase64(iv),
    ciphertext: bufToBase64(cipher),
    iterations: 100000,
    count: data.length,
  };
}

async function decryptVault(enc, password) {
  const dec = new TextDecoder();
  const key = await deriveKey(password, base64ToBuf(enc.salt), enc.iterations);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(base64ToBuf(enc.iv)) },
    key,
    base64ToBuf(enc.ciphertext)
  );
  return JSON.parse(dec.decode(plain));
}

// Setup
function startSetup() {
  setupScreen.classList.remove("hidden");

  setupVaultChoice.onchange = () =>
    ($("password-area").style.display =
      setupVaultChoice.value === "yes" ? "block" : "none");

  setupSaveBtn.onclick = async () => {
    if (setupVaultChoice.value === "yes" && setupPassword.value.length < 4)
      return alert("Password must be at least 4 characters.");

    profile = {
      displayName: setupDisplayName.value.trim() || "User",
      serialId: generateSerialID(),
      vaultEnabled: setupVaultChoice.value === "yes",
    };

    save(STORAGE_PROFILE, profile);

    if (profile.vaultEnabled)
      save(STORAGE_VAULT, await encryptVault([], setupPassword.value));

    finishSetup();
  };
}

function finishSetup() {
  setupScreen.classList.add("hidden");
  initializeApp();
}

// App init
function initializeApp() {
  appContainer.classList.remove("hidden");

  profileName.textContent = profile.displayName;
  profileSerial.textContent = profile.serialId;
  profileVaultEnabled.textContent = profile.vaultEnabled ? "Yes" : "No";

  normalDocs = load(STORAGE_NORMAL, []);

  updateDashboard();
  renderNormalDocs();
  renderVaultDocs();

  mobileMenuBtn?.addEventListener("click", () =>
    sidebarEl.classList.toggle("sidebar-open")
  );

  navItems.forEach((btn) =>
    btn.addEventListener("click", () => {
      navItems.forEach((n) => n.classList.remove("active"));
      btn.classList.add("active");
      switchPage(btn.dataset.page);
      sidebarEl?.classList.remove("sidebar-open");
    })
  );

  addNormalBtn.onclick = () =>
    addDoc(
      normalDocs,
      normalTitle,
      normalContent,
      STORAGE_NORMAL,
      renderNormalDocs
    );

  addVaultBtn.onclick = async () => {
    if (!vaultUnlocked) return alert("Unlock vault first.");
    await addVaultDoc();
  };

  lockVaultBtn?.addEventListener("click", lockVault);

  normalSearch.oninput = () => {
    normalSearchTerm = normalSearch.value.toLowerCase();
    renderNormalDocs();
  };

  vaultSearch.oninput = () => {
    vaultSearchTerm = vaultSearch.value.toLowerCase();
    renderVaultDocs();
  };

  openVaultBtn.onclick = () => {
    if (vaultUnlocked) lockVault();
    else openVaultModal();
  };

  vaultCancelBtn.onclick = closeVaultModal;
  vaultUnlockBtn.onclick = unlockVault;

  vaultExportBtn.onclick = exportVault;
  vaultImportBtn.onclick = () => vaultImportInput.click();
  vaultImportInput.onchange = importVault;
}

// Shared doc logic
function addDoc(arr, titleEl, contentEl, key, renderFn) {
  if (!titleEl.value.trim() && !contentEl.value.trim())
    return alert("Add a title or content.");

  arr.push({
    title: titleEl.value.trim(),
    content: contentEl.value.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  save(key, arr);
  titleEl.value = "";
  contentEl.value = "";
  renderFn();
  updateDashboard();
}

function renderDocs(listEl, docs, search, isVault = false) {
  listEl.innerHTML = "";

  const filtered = search
    ? docs.filter((d) => (d.title || "").toLowerCase().includes(search))
    : docs;

  if (!filtered.length)
    return (listEl.innerHTML =
      "<div style='color:#78716c;font-size:14px'>No documents.</div>");

  filtered.forEach((doc) => {
    const el = document.createElement("div");
    el.className = "doc-item";
    el.innerHTML = `
      <div class="doc-item-title">${doc.title || "(No title)"}</div>
      <div class="doc-item-content">${doc.content || ""}</div>
      <div class="doc-actions">
        <button class="doc-edit-btn">Edit</button>
        <button class="doc-delete-btn">Delete</button>
      </div>
    `;

    el.querySelector(".doc-edit-btn").onclick = async () => {
      const t = prompt("Edit title:", doc.title);
      if (t === null) return;
      const c = prompt("Edit content:", doc.content);
      if (c === null) return;
      doc.title = t.trim();
      doc.content = c.trim();
      doc.updatedAt = new Date().toISOString();
      await saveVaultIfNeeded(isVault);
      renderDocs(listEl, docs, search, isVault);
      updateDashboard();
    };

    el.querySelector(".doc-delete-btn").onclick = async () => {
      if (!confirm("Delete this document?")) return;
      docs.splice(docs.indexOf(doc), 1);
      await saveVaultIfNeeded(isVault);
      renderDocs(listEl, docs, search, isVault);
      updateDashboard();
    };

    listEl.appendChild(el);
  });
}

function renderNormalDocs() {
  renderDocs(normalDocsList, normalDocs, normalSearchTerm);
}

async function renderVaultDocs() {
  if (!vaultUnlocked)
    return (vaultDocsList.innerHTML =
      "<p>Vault is locked. Unlock to view documents.</p>");

  renderDocs(vaultDocsList, decryptedVaultData, vaultSearchTerm, true);
}

async function saveVaultIfNeeded(isVault) {
  if (!isVault) return save(STORAGE_NORMAL, normalDocs);
  const pw = vaultPasswordInput.dataset.lastPassword;
  save(STORAGE_VAULT, await encryptVault(decryptedVaultData, pw));
}

// Vault flow
function openVaultModal() {
  if (!profile.vaultEnabled) return alert("Vault disabled.");
  vaultModal.classList.remove("hidden");
}

function closeVaultModal() {
  vaultModal.classList.add("hidden");
  vaultPasswordInput.value = "";
}

async function unlockVault() {
  const pw = vaultPasswordInput.value.trim();
  if (!pw) return alert("Enter password.");

  try {
    decryptedVaultData = await decryptVault(load(STORAGE_VAULT, {}), pw);
    vaultUnlocked = true;
    vaultPasswordInput.dataset.lastPassword = pw;
    closeVaultModal();
    renderVaultDocs();
    updateDashboard();
  } catch {
    alert("Incorrect password.");
  }
}

function lockVault() {
  vaultUnlocked = false;
  decryptedVaultData = [];
  delete vaultPasswordInput.dataset.lastPassword;
  renderVaultDocs();
  updateDashboard();
}

async function addVaultDoc() {
  addDoc(decryptedVaultData, vaultTitle, vaultContent, null, renderVaultDocs);
  await saveVaultIfNeeded(true);
}

function exportVault() {
  const blob = new Blob([JSON.stringify(load(STORAGE_VAULT, {}))], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "docvault.vault";
  a.click();
}

// Import
function importVault(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      save(STORAGE_VAULT, parsed);
      lockVault();
      alert("Vault imported. Unlock with password.");
    } catch {
      alert("Invalid vault file.");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
}

// Recent docs
function renderRecentDocs() {
  if (!recentDocsList) return;

  const docs = [];

  normalDocs.forEach((doc) =>
    docs.push({
      title: doc.title || "(Untitled)",
      source: "Normal",
      time: doc.updatedAt || doc.createdAt || null,
    })
  );

  if (vaultUnlocked)
    decryptedVaultData.forEach((doc) =>
      docs.push({
        title: doc.title || "(Untitled)",
        source: "Vault",
        time: doc.updatedAt || doc.createdAt || null,
      })
    );

  docs.sort((a, b) => (b.time || "").localeCompare(a.time || ""));
  const topDocs = docs.slice(0, 5);
  recentDocsList.innerHTML = "";

  if (!topDocs.length)
    return (recentDocsList.innerHTML =
      "<div style='color:var(--muted);font-size:13px'>No recent documents.</div>");

  topDocs.forEach((doc) => {
    const row = document.createElement("div");
    row.className = "recent-doc";

    row.onclick = () => {
      if (doc.source === "Normal") {
        switchPage("normal-docs-page");
        setActiveNav("normal-docs-page");
      } else {
        if (!vaultUnlocked) return openVaultModal();
        switchPage("vault-page");
        setActiveNav("vault-page");
      }
    };

    row.innerHTML = `
      <div class="recent-doc-title">${doc.title}</div>
      <div class="recent-doc-meta">
        <span class="recent-doc-badge ${doc.source.toLowerCase()}">
          ${doc.source === "Vault" ? "🔒 Vault" : "📄 Normal"}
        </span>
        <span>${
          doc.time ? new Date(doc.time).toLocaleString() : "Unknown time"
        }</span>
      </div>
    `;

    recentDocsList.appendChild(row);
  });
}

// Boot
window.onload = () => {
  profile = load(STORAGE_PROFILE, null);
  profile ? finishSetup() : startSetup();
};
