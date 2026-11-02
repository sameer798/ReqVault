document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.getElementById("table-body");
    const addRowBtn = document.getElementById("add-row-btn");
    const exportClearBtn = document.getElementById("export-clear-btn");
    const checkOldBtn = document.getElementById("check-old-btn");





    const exportPdfBtn = document.getElementById("export-pdf-btn");
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener("click", exportToPDF);
    }

    // Listen to Date Filter change event
    const dateFilterElement = document.getElementById("date-filter");
    if (dateFilterElement) {
        dateFilterElement.addEventListener("change", () => {
            renderTable();
        });
    }
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




    // Helper: Format only date for filtering (e.g., "02 Oct")
    function formatOnlyDate(timestamp) {
        if (!timestamp) return "";
        const d = new Date(timestamp);
        const day = d.getDate().toString().padStart(2, '0');
        const month = d.toLocaleString('en-US', { month: 'short' });
        return `${day} ${month}`;
    }

    // Update Date Filter Dropdown dynamically based on existing tasks
    function updateDateFilterDropdown() {
        const dateFilterSelect = document.getElementById("date-filter");
        if (!dateFilterSelect) return;

        const currentValue = dateFilterSelect.value;
        const uniqueDatesMap = new Map();

        tasks.forEach(task => {
            if (task.createdAt) {
                const dateStr = formatOnlyDate(task.createdAt);
                uniqueDatesMap.set(dateStr, task.createdAt);
            }
        });

        let optionsHtml = `<option value="all">All (Last 7 Days)</option>`;

        // Sort dates descending (newest first)
        const sortedDates = Array.from(uniqueDatesMap.entries()).sort((a, b) => b[1] - a[1]);

        sortedDates.forEach(([dateStr]) => {
            optionsHtml += `<option value="${dateStr}">${dateStr}</option>`;
        });

        dateFilterSelect.innerHTML = optionsHtml;

        // Retain selection if valid
        if (Array.from(dateFilterSelect.options).some(opt => opt.value === currentValue)) {
            dateFilterSelect.value = currentValue;
        } else {
            dateFilterSelect.value = "all";
        }
    }



    // Render Table Rows or Empty State
    // Render Table Rows or Empty State with Filter Support
    function renderTable() {
        tableBody.innerHTML = "";

        // Ensure IDs are strictly sequential on render
        updateSequentialIds();

        // Update dynamic date filter dropdown options based on current tasks
        updateDateFilterDropdown();

        // Get currently selected filter value
        const selectedDateFilter = document.getElementById("date-filter")?.value || "all";

        // Map tasks with original indices so duplicate/delete target the right task correctly
        let displayedTasks = tasks.map((task, originalIndex) => ({ ...task, originalIndex }));

        // Filter tasks if a specific date is selected
        if (selectedDateFilter !== "all") {
            displayedTasks = displayedTasks.filter(task => formatOnlyDate(task.createdAt) === selectedDateFilter);
        }

        // Empty state check
        if (displayedTasks.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        <i class="fa-regular fa-folder-open empty-icon"></i>
                        <p class="empty-text">No requirements found for this date</p>
                        <span class="empty-subtext">Try selecting another date or click <strong>"+ Add New Row"</strong>.</span>
                    </td>
                </tr>
            `;
            return;
        }

        displayedTasks.forEach((task) => {
            const index = task.originalIndex; // Real index in main tasks array
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
    // Dynamic Light-Mode PDF Export Generator (Does NOT clear data & wraps text fully)
    function exportToPDF() {
        if (tasks.length === 0) {
            alert("No tasks available to export!");
            return;
        }

        const todayDate = new Date().toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
        const todayTime = new Date().toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: true
        });

        const completedCount = tasks.filter(t => t.status === 'Completed').length;
        const inProgressCount = tasks.filter(t => t.status === 'In Progress').length;
        const pendingCount = tasks.filter(t => (t.status || 'Pending') === 'Pending' || t.status === 'Testing').length;

        // Filter status for report header
        const selectedFilter = document.getElementById("date-filter")?.value || "all";
        const filterText = selectedFilter === "all" ? "Last 7 Days" : selectedFilter;

        // Build Rows HTML cleanly without inputs/textareas
        let tableRowsHtml = "";
        tasks.forEach(task => {
            const createdFormatted = formatDateTime(task.createdAt);
            const statusTimeFormatted = formatDateTime(task.statusUpdatedAt || task.createdAt);
            const statusClass = (task.status || 'Pending').toLowerCase().replace(/\s+/g, "");

            tableRowsHtml += `
            <tr>
                <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top;">
                    <span style="display: inline-block; font-weight: 600; font-size: 11px; padding: 2px 7px; border-radius: 4px; background: #f3f4f6; color: #374151; border: 1px solid #d1d5db;">${escapeHtml(task.id)}</span>
                </td>
                <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; color: #111827; font-weight: 500;">
                    ${escapeHtml(task.pageType || 'N/A')}
                    <div style="font-size: 10px; color: #6b7280; font-weight: normal; margin-top: 4px;">Created: ${createdFormatted}</div>
                </td>
                <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; color: #1f2937; line-height: 1.5; word-break: break-word;">
                    ${escapeHtml(task.requirement || 'No notes provided')}
                </td>
                <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top;">
                    <span class="pdf-status pdf-status-${statusClass}">${escapeHtml(task.status || 'Pending')}</span>
                    <div style="font-size: 10px; color: #6b7280; margin-top: 4px;">${statusTimeFormatted}</div>
                </td>
            </tr>
        `;
        });

        // Complete Light-Mode Printable Document Template
        const pdfContainer = document.createElement("div");
        pdfContainer.style.padding = "20px";
        pdfContainer.style.background = "#ffffff";
        pdfContainer.style.color = "#111827";
        pdfContainer.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        pdfContainer.style.fontSize = "12px";

        pdfContainer.innerHTML = `
        <style>
            .pdf-status { display: inline-block; font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 12px; }
            .pdf-status-completed { background: #dcfce7; color: #15803d; }
            .pdf-status-inprogress { background: #dbeafe; color: #1d4ed8; }
            .pdf-status-testing { background: #fef3c7; color: #b45309; }
            .pdf-status-pending { background: #f3f4f6; color: #4b5563; }
        </style>
        
        <!-- Document Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 2px solid #2563eb; padding-bottom: 12px;">
            <div>
                <h1 style="font-size: 20px; font-weight: 700; color: #1e3a8a; margin: 0;">ReqShift</h1>
                <p style="font-size: 12px; color: #4b5563; margin: 2px 0 0 0;">Project Requirements & Dev Tasks Report</p>
            </div>
            <div style="text-align: right; font-size: 10px; color: #6b7280; line-height: 1.4;">
                <strong>Exported:</strong> ${todayDate}, ${todayTime}<br>
                <strong>Filter Range:</strong> ${filterText}
            </div>
        </div>

        <!-- Summary Statistics Grid -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px;">
                <div style="font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase;">Total</div>
                <div style="font-size: 16px; font-weight: 700; color: #0f172a;">${tasks.length}</div>
            </div>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 8px 12px;">
                <div style="font-size: 10px; color: #166534; font-weight: 600; text-transform: uppercase;">Completed</div>
                <div style="font-size: 16px; font-weight: 700; color: #15803d;">${completedCount}</div>
            </div>
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 8px 12px;">
                <div style="font-size: 10px; color: #1e40af; font-weight: 600; text-transform: uppercase;">In Progress</div>
                <div style="font-size: 16px; font-weight: 700; color: #1d4ed8;">${inProgressCount}</div>
            </div>
            <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 8px 12px;">
                <div style="font-size: 10px; color: #92400e; font-weight: 600; text-transform: uppercase;">Pending</div>
                <div style="font-size: 16px; font-weight: 700; color: #b45309;">${pendingCount}</div>
            </div>
        </div>

        <!-- Requirement Table -->
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left;">
            <thead>
                <tr style="background: #1e3a8a; color: #ffffff;">
                    <th style="padding: 10px 8px; border-bottom: 2px solid #1e40af; width: 45px; color: #ffffff;">ID</th>
                    <th style="padding: 10px 8px; border-bottom: 2px solid #1e40af; width: 140px; color: #ffffff;">PAGE / TASK</th>
                    <th style="padding: 10px 8px; border-bottom: 2px solid #1e40af; color: #ffffff;">REQUIREMENT NOTES</th>
                    <th style="padding: 10px 8px; border-bottom: 2px solid #1e40af; width: 120px; color: #ffffff;">STATUS</th>
                </tr>
            </thead>
            <tbody>
                ${tableRowsHtml}
            </tbody>
        </table>

        <!-- Footer -->
        <div style="margin-top: 16px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 8px;">
            <span>ReqShift Requirement Tracker</span>
            <span>Confidential - For Internal Use Only</span>
        </div>
    `;

        // html2pdf options
        const opt = {
            margin: [10, 10, 10, 10],
            filename: `ReqShift_Report_${todayDate.replace(/ /g, "_")}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Download PDF securely without clearing data
        html2pdf().set(opt).from(pdfContainer).save();
    }


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