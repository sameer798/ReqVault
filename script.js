document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.getElementById("table-body");
    const addRowBtn = document.getElementById("add-row-btn");
    const exportClearBtn = document.getElementById("export-clear-btn");
    const checkOldBtn = document.getElementById("check-old-btn");

    // Modal elements
    const modalOverlay = document.getElementById("modal-overlay");
    const modalExportClearBtn = document.getElementById("modal-export-clear-btn");
    const modalJustClearBtn = document.getElementById("modal-just-clear-btn");
    const modalCancelBtn = document.getElementById("modal-cancel-btn");

    // Load Tasks from LocalStorage
    let tasks = JSON.parse(localStorage.getItem("devTasks")) || [];

    // Date Formatter Helper (e.g. 05 Oct, 10:26 AM)
    function formatDateTime(timestamp) {
        if (!timestamp) return "";
        const d = new Date(timestamp);
        const day = d.getDate().toString().padStart(2, '0');
        const month = d.toLocaleString('en-US', { month: 'short' });
        let hours = d.getHours();
        const minutes = d.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${day} ${month}, ${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    }

    // Helper: Re-assign sequential IDs (R1, R2, R3...) across all tasks
    function updateSequentialIds() {
        tasks.forEach((task, index) => {
            task.id = `R${index + 1}`;
        });
    }

    // Render Table Rows or Empty State
    function renderTable() {
        tableBody.innerHTML = "";

        // Ensure IDs are strictly sequential on render
        updateSequentialIds();

        // Empty state check
        if (tasks.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        <i class="fa-regular fa-folder-open empty-icon"></i>
                        <p class="empty-text">No requirements found</p>
                        <span class="empty-subtext">Click <strong>"+ Add New Row"</strong> or press <strong>Spacebar</strong> to add your first requirement.</span>
                    </td>
                </tr>
            `;
            return;
        }

        tasks.forEach((task, index) => {
            const tr = document.createElement("tr");

            const createdFormatted = formatDateTime(task.createdAt);
            const statusFormatted = formatDateTime(task.statusUpdatedAt || task.createdAt);

            tr.innerHTML = `
                <td>
                    <input type="text" class="id-input" value="${escapeHtml(task.id)}" readonly title="Auto-generated sequential ID" style="cursor: not-allowed;">
                    <div class="mobile-actions mobile-only-del">
                        <button class="btn-icon copy-btn" data-index="${index}" title="Duplicate Row"><i class="fa-solid fa-copy"></i></button>
                        <button class="btn-icon delete-btn" data-index="${index}" title="Delete Row"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
                <td>
                    <input type="text" value="${escapeHtml(task.pageType)}" data-index="${index}" data-field="pageType" placeholder="e.g. Auth / UI / Backend">
                    <div class="time-stamp created-time">
                        <i class="fa-regular fa-clock"></i> Created at: <span>${createdFormatted}</span>
                    </div>
                </td>
                <td>
                    <textarea data-index="${index}" data-field="requirement" placeholder="Write requirement notes or code snippets...">${escapeHtml(task.requirement)}</textarea>
                </td>
                <td>
                    <select class="status-badge status-${(task.status || 'Pending').toLowerCase().replace(/\s+/g, "")}" data-index="${index}" data-field="status">
                        <option value="Pending" ${task.status === "Pending" ? "selected" : ""}>Pending</option>
                        <option value="In Progress" ${task.status === "In Progress" ? "selected" : ""}>In Progress</option>
                        <option value="Testing" ${task.status === "Testing" ? "selected" : ""}>Testing</option>
                        <option value="Completed" ${task.status === "Completed" ? "selected" : ""}>Completed</option>
                    </select>
                    <div class="time-stamp status-time">
                        <i class="fa-solid fa-rotate-left"></i> ${escapeHtml(task.status || 'Pending')} at: <span>${statusFormatted}</span>
                    </div>
                </td>
                <td class="no-print desktop-only-del">
                    <div class="action-buttons-group">
                        <button class="btn-icon copy-btn" data-index="${index}" title="Duplicate Row"><i class="fa-solid fa-copy"></i></button>
                        <button class="btn-icon delete-btn" data-index="${index}" title="Delete Row"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            `;

            tableBody.appendChild(tr);
        });

        attachEventListeners();
    }

    // Attach Live Input, Duplicate & Delete Events
    function attachEventListeners() {
        document.querySelectorAll("#table-body input[data-field], #table-body textarea, #table-body select").forEach(element => {
            const updateHandler = (e) => {
                const index = e.target.dataset.index;
                const field = e.target.dataset.field;
                if (tasks[index]) {
                    tasks[index][field] = e.target.value;

                    // Update dynamic status timestamp when status changes
                    if (field === "status") {
                        const now = Date.now();
                        tasks[index].statusUpdatedAt = now;
                        e.target.className = `status-badge status-${e.target.value.toLowerCase().replace(/\s+/g, "")}`;
                        
                        const statusTimeElem = e.target.parentElement.querySelector('.status-time');
                        if (statusTimeElem) {
                            statusTimeElem.innerHTML = `<i class="fa-solid fa-rotate-left"></i> ${escapeHtml(e.target.value)} at: <span>${formatDateTime(now)}</span>`;
                        }
                    }

                    saveToLocalStorage();
                }
            };

            element.addEventListener("input", updateHandler);
            element.addEventListener("change", updateHandler);
        });

        // Duplicate Row Action
        document.querySelectorAll(".copy-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const index = parseInt(e.currentTarget.dataset.index, 10);
                const sourceTask = tasks[index];
                const now = Date.now();

                // Create a duplicate object retaining notes, pageType, and status
                const duplicatedTask = {
                    id: "",
                    pageType: sourceTask.pageType,
                    requirement: sourceTask.requirement,
                    status: sourceTask.status,
                    createdAt: now,
                    statusUpdatedAt: now
                };

                // Insert right below the current row
                tasks.splice(index + 1, 0, duplicatedTask);
                saveToLocalStorage();
                renderTable();
            });
        });

        // Delete Row Action
        document.querySelectorAll(".delete-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const index = parseInt(e.currentTarget.dataset.index, 10);
                tasks.splice(index, 1);
                saveToLocalStorage();
                renderTable();
            });
        });
    }

    // Add New Row Action
    function addNewRow() {
        const now = Date.now();
        const newTask = {
            id: "",
            pageType: "",
            requirement: "",
            status: "Pending",
            createdAt: now,
            statusUpdatedAt: now
        };
        tasks.push(newTask);
        saveToLocalStorage();
        renderTable();
    }

    addRowBtn.addEventListener("click", addNewRow);

    // Keyboard Shortcut: Spacebar key to Add New Row
    document.addEventListener("keydown", (e) => {
        const activeElement = document.activeElement;
        const isEditingInput = activeElement && (
            activeElement.tagName === "INPUT" || 
            activeElement.tagName === "TEXTAREA" || 
            activeElement.tagName === "SELECT"
        );

        if (e.code === "Space" && !isEditingInput) {
            e.preventDefault();
            addNewRow();
        }
    });

    // PDF Export Functionality
    function exportToPDF() {
        const element = document.getElementById("pdf-content");
        element.classList.add("pdf-export-mode");

        const options = {
            margin: [8, 8, 8, 8],
            filename: `Project_Requirements_${new Date().toISOString().slice(0,10)}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };

        return html2pdf().set(options).from(element).save().then(() => {
            element.classList.remove("pdf-export-mode");
        }).catch((err) => {
            element.classList.remove("pdf-export-mode");
            console.error("PDF Export Error: ", err);
        });
    }

    // Export PDF & Clear Button
    exportClearBtn.addEventListener("click", () => {
        if (tasks.length === 0) {
            alert("No tasks to export!");
            return;
        }
        if (confirm("This will export all current tasks as a PDF and then clear all data. Proceed?")) {
            exportToPDF().then(() => {
                tasks = [];
                saveToLocalStorage();
                renderTable();
            });
        }
    });

    // Check Data Older Than 7 Days
    function checkAndWarnOldData(showModalPrompt = true) {
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        const hasOldData = tasks.some(task => (now - task.createdAt) > SEVEN_DAYS_MS);

        if (hasOldData) {
            modalOverlay.classList.remove("hidden");
        } else if (showModalPrompt) {
            alert("No tasks older than 7 days were found!");
        }
    }

    checkOldBtn.addEventListener("click", () => checkAndWarnOldData(true));

    // Modal Actions
    modalExportClearBtn.addEventListener("click", () => {
        exportToPDF().then(() => {
            clearOldData();
            modalOverlay.classList.add("hidden");
        });
    });

    modalJustClearBtn.addEventListener("click", () => {
        clearOldData();
        modalOverlay.classList.add("hidden");
    });

    modalCancelBtn.addEventListener("click", () => {
        modalOverlay.classList.add("hidden");
    });

    function clearOldData() {
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        tasks = tasks.filter(task => (now - task.createdAt) <= SEVEN_DAYS_MS);
        saveToLocalStorage();
        renderTable();
    }

    // Helper: Save to LocalStorage
    function saveToLocalStorage() {
        localStorage.setItem("devTasks", JSON.stringify(tasks));
    }

    // Helper: Escape HTML
   // Helper: Escape HTML
// Helper: Escape HTML
function escapeHtml(text) {
    return text ? text.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/"/g, '"') : "";
}

    // Initial render
    renderTable();
    // checkAndWarnOldData(false);
});