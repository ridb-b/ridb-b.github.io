// ===== FIREBASE CONFIG =====
const firebaseConfig = {
    apiKey: "AIzaSyDmOUT1cxKlmN5D3NOFQeT7v0wpuZprWc4",
    authDomain: "clientes-db-66ad3.firebaseapp.com",
    projectId: "clientes-db-66ad3",
    storageBucket: "clientes-db-66ad3.firebasestorage.app",
    messagingSenderId: "454075361926",
    appId: "1:454075361926:web:2e52c1d7c9f2bf058d3f07",
    measurementId: "G-5MWS9HKN3R"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const contactsRef = db.collection("contactos");

// ===== DOM ELEMENTS =====
const contactForm = document.getElementById("contactForm");
const inputNombre = document.getElementById("inputNombre");
const inputApellido = document.getElementById("inputApellido");
const inputTelefono = document.getElementById("inputTelefono");
const inputEmail = document.getElementById("inputEmail");
const contactsList = document.getElementById("contactsList");
const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const totalCount = document.getElementById("totalCount");
const connectionStatus = document.getElementById("connectionStatus");

// Edit modal elements
const editModal = document.getElementById("editModal");
const editForm = document.getElementById("editForm");
const editId = document.getElementById("editId");
const editNombre = document.getElementById("editNombre");
const editApellido = document.getElementById("editApellido");
const editTelefono = document.getElementById("editTelefono");
const editEmail = document.getElementById("editEmail");
const btnCloseModal = document.getElementById("btnCloseModal");
const btnCancelEdit = document.getElementById("btnCancelEdit");

const toastContainer = document.getElementById("toastContainer");

// ===== STATE =====
let allContacts = [];

// ===== BACKGROUND PARTICLES =====
function createParticles() {
    const container = document.getElementById("bgParticles");
    const colors = ["rgba(122,162,247,0.4)", "rgba(187,154,247,0.3)", "rgba(158,206,106,0.2)"];

    for (let i = 0; i < 20; i++) {
        const particle = document.createElement("div");
        particle.classList.add("particle");
        const size = Math.random() * 4 + 2;
        particle.style.width = size + "px";
        particle.style.height = size + "px";
        particle.style.left = Math.random() * 100 + "%";
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        particle.style.animationDuration = (Math.random() * 15 + 10) + "s";
        particle.style.animationDelay = (Math.random() * 10) + "s";
        container.appendChild(particle);
    }
}
createParticles();

// ===== AVATAR COLORS =====
const avatarGradients = [
    "linear-gradient(135deg, #7aa2f7, #5a7de0)",
    "linear-gradient(135deg, #bb9af7, #9a7ad7)",
    "linear-gradient(135deg, #9ece6a, #7eb04a)",
    "linear-gradient(135deg, #e0af68, #c89348)",
    "linear-gradient(135deg, #f7768e, #d7566e)",
    "linear-gradient(135deg, #7dcfff, #5db0e0)",
    "linear-gradient(135deg, #ff9e64, #e07e44)",
    "linear-gradient(135deg, #73daca, #53baaa)",
];

function getAvatarGradient(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return avatarGradients[Math.abs(hash) % avatarGradients.length];
}

function getInitials(nombre, apellido) {
    const n = nombre ? nombre.charAt(0) : "";
    const a = apellido ? apellido.charAt(0) : "";
    return (n + a).toUpperCase() || "?";
}

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = "info") {
    const icons = {
        success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
        error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
        info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>`
    };

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = "toastOut 0.3s ease forwards";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===== RENDER CONTACT CARD =====
function renderContactCard(contact, index) {
    const card = document.createElement("div");
    card.className = "contact-card";
    card.style.animationDelay = `${index * 0.05}s`;
    card.dataset.id = contact.id;

    const fullName = `${contact.nombre || ""} ${contact.apellido || ""}`.trim();
    const gradient = getAvatarGradient(fullName);
    const initials = getInitials(contact.nombre, contact.apellido);

    let detailsHTML = "";
    if (contact.telefono) {
        detailsHTML += `
            <span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                ${contact.telefono}
            </span>`;
    }
    if (contact.email) {
        detailsHTML += `
            <span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                ${contact.email}
            </span>`;
    }

    card.innerHTML = `
        <div class="contact-avatar" style="background: ${gradient}">${initials}</div>
        <div class="contact-info">
            <div class="contact-name">${fullName || "Sin nombre"}</div>
            ${detailsHTML ? `<div class="contact-details">${detailsHTML}</div>` : ""}
        </div>
        <div class="contact-actions">
            <button class="btn-icon" onclick="openEditModal('${contact.id}')" title="Editar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="btn-icon danger" onclick="deleteContact('${contact.id}')" title="Eliminar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
        </div>
    `;

    return card;
}

// ===== RENDER CONTACTS LIST =====
function renderContacts(contacts) {
    // Remove existing cards (keep loading and empty states)
    const cards = contactsList.querySelectorAll(".contact-card");
    cards.forEach(c => c.remove());

    loadingState.style.display = "none";

    if (contacts.length === 0) {
        emptyState.style.display = "flex";
    } else {
        emptyState.style.display = "none";
        contacts.forEach((contact, index) => {
            contactsList.appendChild(renderContactCard(contact, index));
        });
    }

    totalCount.textContent = contacts.length;
}

// ===== SEARCH / FILTER =====
function filterContacts() {
    const query = searchInput.value.toLowerCase().trim();
    if (!query) {
        renderContacts(allContacts);
        return;
    }

    const filtered = allContacts.filter(c => {
        const fullName = `${c.nombre || ""} ${c.apellido || ""}`.toLowerCase();
        const email = (c.email || "").toLowerCase();
        const phone = (c.telefono || "").toLowerCase();
        return fullName.includes(query) || email.includes(query) || phone.includes(query);
    });

    renderContacts(filtered);
}

searchInput.addEventListener("input", filterContacts);

// ===== REALTIME LISTENER (FIRESTORE) =====
function listenToContacts() {
    contactsRef.orderBy("creadoEn", "desc").onSnapshot(
        (snapshot) => {
            // Update connection status
            connectionStatus.classList.remove("error");
            connectionStatus.classList.add("connected");
            connectionStatus.querySelector(".status-text").textContent = "Conectado";

            allContacts = [];
            snapshot.forEach(doc => {
                allContacts.push({ id: doc.id, ...doc.data() });
            });

            filterContacts();
        },
        (error) => {
            console.error("Error escuchando contactos:", error);
            connectionStatus.classList.remove("connected");
            connectionStatus.classList.add("error");
            connectionStatus.querySelector(".status-text").textContent = "Error";
            showToast("Error de conexión con Firestore", "error");
        }
    );
}

// ===== ADD CONTACT =====
contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = inputNombre.value.trim();
    const apellido = inputApellido.value.trim();
    const telefono = inputTelefono.value.trim();
    const email = inputEmail.value.trim();

    if (!nombre) {
        showToast("El nombre es obligatorio", "error");
        return;
    }

    const btnSubmit = document.getElementById("btnSubmit");
    btnSubmit.disabled = true;
    btnSubmit.querySelector("span").textContent = "Añadiendo...";

    try {
        await contactsRef.add({
            nombre,
            apellido,
            telefono,
            email,
            creadoEn: firebase.firestore.FieldValue.serverTimestamp()
        });

        contactForm.reset();
        showToast(`${nombre} ${apellido} añadido correctamente`, "success");
    } catch (error) {
        console.error("Error añadiendo contacto:", error);
        showToast("Error al añadir el contacto", "error");
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.querySelector("span").textContent = "Añadir Contacto";
    }
});

// ===== DELETE CONTACT =====
async function deleteContact(id) {
    if (!confirm("¿Estás seguro de que quieres eliminar este contacto?")) return;

    const card = document.querySelector(`.contact-card[data-id="${id}"]`);
    if (card) card.classList.add("deleting");

    try {
        await contactsRef.doc(id).delete();
        showToast("Contacto eliminado", "info");
    } catch (error) {
        console.error("Error eliminando contacto:", error);
        showToast("Error al eliminar el contacto", "error");
        if (card) card.classList.remove("deleting");
    }
}

// ===== EDIT CONTACT =====
function openEditModal(id) {
    const contact = allContacts.find(c => c.id === id);
    if (!contact) return;

    editId.value = contact.id;
    editNombre.value = contact.nombre || "";
    editApellido.value = contact.apellido || "";
    editTelefono.value = contact.telefono || "";
    editEmail.value = contact.email || "";

    editModal.classList.add("active");
    editNombre.focus();
}

function closeEditModal() {
    editModal.classList.remove("active");
    editForm.reset();
}

btnCloseModal.addEventListener("click", closeEditModal);
btnCancelEdit.addEventListener("click", closeEditModal);

// Close modal on backdrop click
editModal.addEventListener("click", (e) => {
    if (e.target === editModal) closeEditModal();
});

// Close modal on Escape
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && editModal.classList.contains("active")) {
        closeEditModal();
    }
});

editForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = editId.value;
    const nombre = editNombre.value.trim();
    const apellido = editApellido.value.trim();
    const telefono = editTelefono.value.trim();
    const email = editEmail.value.trim();

    if (!nombre) {
        showToast("El nombre es obligatorio", "error");
        return;
    }

    try {
        await contactsRef.doc(id).update({
            nombre,
            apellido,
            telefono,
            email
        });

        closeEditModal();
        showToast("Contacto actualizado", "success");
    } catch (error) {
        console.error("Error actualizando contacto:", error);
        showToast("Error al actualizar el contacto", "error");
    }
});

// ===== INIT =====
listenToContacts();
