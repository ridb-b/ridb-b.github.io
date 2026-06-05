import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Configuración de Firebase Firestore (Mantengo tu configuración)
const firebaseConfig = {
    apiKey: "AIzaSyCOG5YrODBLx-PYADBqqYWeDuUnhQN_Enk",
    authDomain: "tareas2-74164.firebaseapp.com",
    projectId: "tareas2-74164",
    storageBucket: "tareas2-74164.firebasestorage.app",
    messagingSenderId: "289965526180",
    appId: "1:289965526180:web:d581e077c93228a6f5ea31"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const clerkPublishableKey = "pk_test_cmFwaWQta29pLTM2LmNsZXJrLmFjY291bnRzLmRldiQ=";
document.addEventListener('DOMContentLoaded', async () => {
    const landingPage = document.getElementById('landing-page');
    const dashboardApp = document.getElementById('dashboard-app');
    const clerkSignInContainer = document.getElementById('clerk-sign-in');

    const taskInput = document.getElementById('task-input');
    const taskDatetime = document.getElementById('task-datetime');
    const addBtn = document.getElementById('add-btn');
    const taskList = document.getElementById('task-list');
    const taskCount = document.getElementById('task-count');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const loginBtnContainer = document.getElementById('login-btn'); // Contenedor para UserButton

    const summaryBtn = document.getElementById('monthly-summary-btn');
    const summaryModal = document.getElementById('summary-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const summaryMonthText = document.getElementById('summary-month-text');
    const summaryCompletedCount = document.getElementById('summary-completed-count');

    let tasks = [];
    let currentFilter = 'all';

    // 1. Inicializar Clerk dinámicamente según la documentación oficial
    const startClerk = async () => {
        try {
            const clerk = window.Clerk;
            if (!clerk) throw new Error("Clerk window object not found");

            await clerk.load();

            if (clerk.user) {
                // Usuario logueado
                landingPage.classList.add('hidden');
                dashboardApp.classList.remove('hidden');

                loginBtnContainer.innerHTML = '';
                loginBtnContainer.style.border = 'none';
                loginBtnContainer.style.background = 'transparent';
                clerk.mountUserButton(loginBtnContainer);

                updateHeaderDate();
                document.getElementById('greeting').textContent = `Hola, ${clerk.user.firstName || 'Usuario'}`;
                subscribeToTasks(clerk.user.id);
            } else {
                // Usuario no logueado
                landingPage.classList.remove('hidden');
                dashboardApp.classList.add('hidden');
                clerk.mountSignIn(clerkSignInContainer);
            }
        } catch (err) {
            console.error('Error inicializando Clerk:', err);
            clerkSignInContainer.innerHTML = `<p style="color:var(--danger); background: rgba(0,0,0,0.5); padding: 1rem; border-radius: 8px;">
                ⚠️ Error cargando el inicio de sesión.<br><br>
                Detalle: ${err.message || 'Error desconocido'}
            </p>`;
        }
    };

    const script = document.createElement('script');
    script.setAttribute('data-clerk-publishable-key', clerkPublishableKey);
    script.async = true;
    script.src = `https://cdn.jsdelivr.net/npm/@clerk/clerk-js@5/dist/clerk.browser.js`;
    script.crossOrigin = 'anonymous';
    script.addEventListener('load', startClerk);
    script.addEventListener('error', () => {
        clerkSignInContainer.innerHTML = '<p style="color:var(--danger)">Error al cargar el script de Clerk (¿Bloqueador de anuncios?)</p>';
    });
    document.head.appendChild(script);

    // 2. Funciones de Firestore
    function subscribeToTasks(userId) {
        const tasksRef = collection(db, 'tasks');
        const q = query(tasksRef, where('userId', '==', userId));

        onSnapshot(q, (snapshot) => {
            tasks = [];
            snapshot.forEach((doc) => {
                tasks.push({ id: doc.id, ...doc.data() });
            });
            // Ordenar para que las más recientes salgan primero
            tasks.sort((a, b) => b.createdAt - a.createdAt);
            renderTasks();
        }, (error) => {
            console.error("Error al obtener tareas de Firestore:", error);
            if (error.code === 'permission-denied') {
                alert("Error de permisos en Firebase. Asegúrate de configurar las reglas de Firestore en modo prueba.");
            }
        });
    }

    async function addTask() {
        const text = taskInput.value.trim();
        const datetime = taskDatetime.value;

        if (text === '' || !window.Clerk.user) return;

        try {
            await addDoc(collection(db, 'tasks'), {
                userId: window.Clerk.user.id,
                text: text,
                datetime: datetime,
                completed: false,
                createdAt: Date.now()
            });
            taskInput.value = '';
            taskDatetime.value = '';
            taskInput.focus();
        } catch (e) {
            console.error("Error añadiendo tarea:", e);
        }
    }

    async function toggleTask(id, currentStatus) {
        try {
            const taskRef = doc(db, 'tasks', id);
            const isNowCompleted = !currentStatus;
            await updateDoc(taskRef, {
                completed: isNowCompleted,
                completedAt: isNowCompleted ? Date.now() : null
            });
        } catch (e) {
            console.error("Error actualizando tarea:", e);
        }
    }

    async function deleteTask(id, element) {
        // Animación visual antes de borrar en base de datos
        element.style.animation = 'fadeOut 0.3s ease forwards';

        setTimeout(async () => {
            try {
                await deleteDoc(doc(db, 'tasks', id));
            } catch (e) {
                console.error("Error borrando tarea:", e);
                renderTasks(); // Restaurar si falla
            }
        }, 300);
    }

    async function clearCompleted() {
        const completedTasks = tasks.filter(task => task.completed);
        for (const task of completedTasks) {
            try {
                await deleteDoc(doc(db, 'tasks', task.id));
            } catch (e) {
                console.error("Error al limpiar tarea:", e);
            }
        }
    }

    // 3. Event Listeners y UI
    addBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    clearCompletedBtn.addEventListener('click', clearCompleted);

    summaryBtn.addEventListener('click', openSummaryModal);
    closeModalBtn.addEventListener('click', () => summaryModal.classList.add('hidden'));

    window.addEventListener('click', (e) => {
        if (e.target === summaryModal) {
            summaryModal.classList.add('hidden');
        }
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    function updateHeaderDate() {
        const dateElement = document.getElementById('current-date');
        if (dateElement) {
            const now = new Date();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            let formattedDate = now.toLocaleDateString('es-ES', options);
            formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
            dateElement.textContent = formattedDate;
        }
    }

    function renderTasks() {
        taskList.innerHTML = '';

        let filteredTasks = tasks;
        if (currentFilter === 'active') {
            filteredTasks = tasks.filter(task => !task.completed);
        } else if (currentFilter === 'completed') {
            filteredTasks = tasks.filter(task => task.completed);
        }

        if (filteredTasks.length === 0) {
            taskList.innerHTML = `<div class="empty-state">No hay tareas para mostrar.</div>`;
        } else {
            filteredTasks.forEach(task => {
                const li = document.createElement('li');
                li.className = `task-item ${task.completed ? 'completed' : ''}`;
                li.dataset.id = task.id;

                let dateHtml = '';
                if (task.datetime) {
                    const dateObj = new Date(task.datetime);
                    const formattedDate = dateObj.toLocaleString('es-ES', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    });
                    dateHtml = `<div class="task-date"><i class="far fa-calendar-alt"></i> ${formattedDate}</div>`;
                }

                li.innerHTML = `
                    <div class="checkbox" role="button" tabindex="0" aria-label="Marcar como completada">
                        <i class="fas fa-check"></i>
                    </div>
                    <div class="task-content">
                        <span class="task-text">${escapeHTML(task.text)}</span>
                        ${dateHtml}
                    </div>
                    <button class="delete-btn" aria-label="Eliminar tarea">
                        <i class="fas fa-trash"></i>
                    </button>
                `;

                const checkbox = li.querySelector('.checkbox');
                checkbox.addEventListener('click', () => toggleTask(task.id, task.completed));
                checkbox.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') toggleTask(task.id, task.completed);
                });

                const deleteBtn = li.querySelector('.delete-btn');
                deleteBtn.addEventListener('click', () => deleteTask(task.id, li));

                taskList.appendChild(li);
            });
        }

        updateStats();
    }

    function updateStats() {
        const activeTasks = tasks.filter(task => !task.completed).length;
        taskCount.textContent = `${activeTasks} tarea${activeTasks !== 1 ? 's' : ''} pendiente${activeTasks !== 1 ? 's' : ''}`;

        const hasCompleted = tasks.some(task => task.completed);
        clearCompletedBtn.style.display = hasCompleted ? 'block' : 'none';
    }

    function openSummaryModal() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        summaryMonthText.textContent = `${meses[currentMonth]} ${currentYear}`;

        const completedTasksThisMonth = tasks.filter(task => {
            if (!task.completed || !task.completedAt) return false;
            const completionDate = new Date(task.completedAt);
            return completionDate.getMonth() === currentMonth && completionDate.getFullYear() === currentYear;
        });

        const count = completedTasksThisMonth.length;
        summaryCompletedCount.innerHTML = count;

        if (count > 0) {
            animateValue(summaryCompletedCount, 0, count, 1000);
        }

        const summaryTaskList = document.getElementById('summary-task-list');
        summaryTaskList.innerHTML = '';

        if (count === 0) {
            summaryTaskList.innerHTML = '<li class="empty-state" style="padding: 1rem 0; font-size: 0.9rem;">No hay tareas completadas este mes.</li>';
        } else {
            completedTasksThisMonth.sort((a, b) => b.completedAt - a.completedAt);

            completedTasksThisMonth.forEach(task => {
                const li = document.createElement('li');
                li.className = 'summary-task-item';

                const dateObj = new Date(task.completedAt);
                const formattedDate = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

                li.innerHTML = `
                    <span class="task-text">${escapeHTML(task.text)}</span>
                    <span class="summary-task-date"><i class="fas fa-check"></i> ${formattedDate}</span>
                `;
                summaryTaskList.appendChild(li);
            });
        }

        summaryModal.classList.remove('hidden');
    }

    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
});
