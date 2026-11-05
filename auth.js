document.addEventListener("DOMContentLoaded", () => {
    const currentUser = localStorage.getItem("reqshift_current_user");
    if (currentUser) {
        showAppDashboard();
    } else {
        renderAuthScreen("signup");
    }
});

// Data-driven Navigation Config (Scalable for future tabs)
const navigationConfig = [
    { name: "Tasks", icon: "fa-solid fa-list-check", active: true, badge: null },
    { name: "Reports", icon: "fa-regular fa-file-lines", active: false, badge: "Soon" },
    { name: "Archive", icon: "fa-solid fa-box-archive", active: false, badge: "Soon" }
];

function renderAuthScreen(mode) {
    const authContainer = document.getElementById("auth-container");
    if (!authContainer) return;

    const isLogin = mode === "signin";

    authContainer.innerHTML = `
        <div class="auth-wrapper">
            <div class="auth">
                <div class="auth-brand">
                    <div class="orb o1"></div><div class="orb o2"></div>
                    <div class="logo">
                        <div class="logo-i"><i class="fa-solid fa-rocket"></i></div>
                        <span style="font-size:20px;font-weight:500">ReqShift</span>
                    </div>
                    <div style="position:relative">
                        <p style="font-size:18px;font-weight:500;margin:0 0 4px;line-height:1.35">Requirement and task management</p>
                        <p style="font-size:13px;margin:0;opacity:.85;line-height:1.5">Track every requirement from pending to done.</p>
                    </div>
                    <div class="tasks">
                        <div class="t-item"><span class="ck"><b></b><i class="fa-solid fa-check"></i></span><span class="name">Design the login page</span><span class="st"><span>Pending</span><span>In progress</span><span>Completed</span></span></div>
                        <div class="t-item"><span class="ck"><b></b><i class="fa-solid fa-check"></i></span><span class="name">Fix the checkout bug</span><span class="st"><span>Pending</span><span>In progress</span><span>Completed</span></span></div>
                        <div class="t-item"><span class="ck"><b></b><i class="fa-solid fa-check"></i></span><span class="name">Write the release notes</span><span class="st"><span>Pending</span><span>In progress</span><span>Completed</span></span></div>
                    </div>
                    <div style="position:relative;margin-top:2px">
                        <p class="feat"><span class="dot"></span>Real-time tracking</p>
                        <p class="feat"><i class="fa-solid fa-desktop"></i>Your data is stored on your device only</p>
                        <p class="feat"><i class="fa-regular fa-file-pdf"></i>Light PDF reports</p>
                    </div>
                </div>

                <div class="form-panel">
                    <h3 style="font-size:20px;font-weight:500;margin:0 0 4px">${isLogin ? "Welcome back" : "Create your account"}</h3>
                    <p style="font-size:13px;color:var(--text-secondary);margin:0 0 20px">${isLogin ? "Sign in to access your dashboard." : "Get started with your requirement tracker profile."}</p>
                    
                    <form id="auth-form">
                        ${!isLogin ? `
                            <div class="f"><label for="n">Full name</label><input id="n" type="text" placeholder="Rahul Sharma" required></div>
                            <div class="row f">
                                <div><label for="a">Age</label><input id="a" type="number" placeholder="25" required></div>
                                <div><label for="r">Company role</label><input id="r" type="text" placeholder="Frontend developer" required></div>
                            </div>
                        ` : ''}
                        
                        <div class="f"><label for="e">Email address</label><input id="e" type="email" placeholder="name@company.com" required></div>
                        <div class="f" style="margin-bottom:20px"><label for="p">Password</label><input id="p" type="password" placeholder="At least 8 characters" required></div>
                        
                        <button class="auth-btn" type="submit">${isLogin ? "Sign in to dashboard" : "Register and continue"} <i class="fa-solid fa-arrow-right"></i></button>
                    </form>

                    <p style="font-size:13px;color:var(--text-secondary);text-align:center;margin:14px 0 0">
                        ${isLogin ? "Don't have an account? <span id='toggle-auth' style='color:#2563eb;cursor:pointer;font-weight:500;'>Sign up</span>" : "Already have an account? <span id='toggle-auth' style='color:#2563eb;cursor:pointer;font-weight:500;'>Sign in</span>"}
                    </p>
                </div>
            </div>
        </div>
    `;

    document.getElementById("toggle-auth").addEventListener("click", () => {
        renderAuthScreen(isLogin ? "signup" : "signin");
    });

    document.getElementById("auth-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("e").value;
        const password = document.getElementById("p").value;

        if (isLogin) {
            const savedUser = JSON.parse(localStorage.getItem("reqshift_registered_user"));
            if (savedUser && savedUser.email === email && savedUser.password === password) {
                localStorage.setItem("reqshift_current_user", JSON.stringify(savedUser));
                showAppDashboard();
            } else {
                alert("Invalid email or password! Please check or sign up.");
            }
        } else {
            const name = document.getElementById("n").value;
            const age = document.getElementById("a").value;
            const role = document.getElementById("r").value;

            const userData = { name, age, role, email, password };
            localStorage.setItem("reqshift_registered_user", JSON.stringify(userData));
            localStorage.setItem("reqshift_current_user", JSON.stringify(userData));
            showAppDashboard();
        }
    });
}

function showAppDashboard() {
    const authContainer = document.getElementById("auth-container");
    const appContainer = document.getElementById("app-container");

    if (authContainer) authContainer.style.display = "none";
    if (appContainer) {
        appContainer.style.display = "block";
        
        // Data-driven header render karna
        renderDynamicHeader();

        // script.js ke app ko initialize karna taaki buttons aur table turant active ho jayein
        if (typeof window.initReqShiftApp === "function") {
            window.initReqShiftApp();
        }
    }
}

function renderDynamicHeader() {
    const appContainer = document.getElementById("app-container");
    if (!appContainer) return;

    const currentUser = JSON.parse(localStorage.getItem("reqshift_current_user")) || {
        name: "User", role: "Developer", email: "user@company.com", age: "--"
    };

    const userName = currentUser.name || "User";
    const userRole = currentUser.role || "Team Member";
    const userEmail = currentUser.email || "No email";
    const userAge = currentUser.age ? `${currentUser.age} years` : "N/A";
    const initials = userName.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);

    const navHtml = navigationConfig.map(item => `
        <button class="nav-pill ${item.active ? 'active' : ''}">
            <i class="${item.icon}"></i> ${item.name}
            ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
        </button>
    `).join('');

    const headerWrapper = document.createElement("div");
    headerWrapper.className = "header-wrapper-container";
    headerWrapper.innerHTML = `
        <header class="app-header-modern">
            <div class="header-brand-area" style="flex-direction: column; align-items: flex-start;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div class="header-logo-icon">
                        <i class="fa-solid fa-code-branch"></i>
                    </div>
                    <span style="font-size: 18px; font-weight: 600; color: #fff;">ReqShift</span>
                </div>
                <!-- ReqShift ke niche Welcome Back aur user name -->
               
            </div>

            <!-- Desktop Navigation Items -->
            <div class="header-nav-items desktop-nav">
                ${navHtml}
            </div>

            <!-- Mobile Hamburger Menu Button -->
            <button class="mobile-menu-toggle-btn" id="mobile-menu-toggle">
                <i class="fa-solid fa-bars"></i>
            </button>

            <!-- User Profile Chip -->
            <div class="header-user-profile" id="user-profile-chip">
                <div class="user-avatar-circle">${initials}</div>
                <span class="user-name-text">${userName}</span>
                <i class="fa-solid fa-chevron-down" style="font-size: 11px; color: #fff; opacity: 0.8;"></i>

                <div class="profile-modal" id="profile-dropdown-modal">
                    <div class="profile-modal-header">
                        <div class="profile-avatar-large">${initials}</div>
                        <div class="profile-user-info">
                            <div class="profile-user-name">${userName}</div>
                            <div class="profile-user-role">${userRole}</div>
                        </div>
                    </div>
                    <div class="profile-details-list">
                        <div class="profile-detail-item">
                            <i class="fa-regular fa-envelope"></i>
                            <span>${userEmail}</span>
                        </div>
                        <div class="profile-detail-item">
                            <i class="fa-regular fa-user"></i>
                            <span>${userAge}</span>
                        </div>
                        <div class="profile-detail-item">
                            <i class="fa-solid fa-hard-drive"></i>
                            <span>Data stored on this device</span>
                        </div>
                    </div>
                    <button class="logout-btn" id="logout-trigger-btn">
                        <i class="fa-solid fa-right-from-bracket"></i> Log out
                    </button>
                </div>
            </div>

            <!-- Mobile Dropdown Navigation Menu List -->
            <div class="mobile-nav-dropdown hidden" id="mobile-nav-dropdown">
                ${navHtml}
            </div>
        </header>

        <div class="welcome-section">
            <div>
                <h2 class="welcome-title">WELCOME BACK!, ${userName}</h2>
                <p class="welcome-subtitle">Manage project requirements & clean old tasks</p>
            </div>
            
            <div class="header-actions">
                <button id="add-row-btn" class="btn btn-primary">
                    <i class="fa-solid fa-plus"></i> Add New Row
                </button>
                <button id="export-pdf-btn" class="btn btn-secondary">
                    <i class="fa-solid fa-file-pdf"></i> Export PDF
                </button>
                <button id="check-old-btn" class="btn btn-danger">
                    <i class="fa-solid fa-broom"></i> Clear Old Data (1 Wk+)
                </button>
                <select id="date-filter" class="date-filter-select" title="Filter by Date">
                    <option value="all">All (Last 7 Days)</option>
                </select>
            </div>
        </div>
    `;

    const existingHeader = appContainer.querySelector(".header-wrapper-container");
    if (existingHeader) existingHeader.remove();

    appContainer.prepend(headerWrapper);
    setupProfileModalEvents();
}

function setupProfileModalEvents() {
    const profileChip = document.getElementById("user-profile-chip");
    const profileModal = document.getElementById("profile-dropdown-modal");
    const logoutBtn = document.getElementById("logout-trigger-btn");

    const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
    const mobileNavDropdown = document.getElementById("mobile-nav-dropdown");

    if (profileChip && profileModal) {
        profileChip.addEventListener("click", (e) => {
            e.stopPropagation();
            profileModal.classList.toggle("show");
            if (mobileNavDropdown) mobileNavDropdown.classList.add("hidden");
        });

        profileModal.addEventListener("click", (e) => {
            e.stopPropagation();
        });
    }

    if (mobileMenuToggle && mobileNavDropdown) {
        mobileMenuToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            mobileNavDropdown.classList.toggle("hidden");
            if (profileModal) profileModal.classList.remove("show");
        });

        mobileNavDropdown.addEventListener("click", (e) => {
            e.stopPropagation();
        });
    }

    document.addEventListener("click", () => {
        if (profileModal && profileModal.classList.contains("show")) {
            profileModal.classList.remove("show");
        }
        if (mobileNavDropdown && !mobileNavDropdown.classList.contains("hidden")) {
            mobileNavDropdown.classList.add("hidden");
        }
    });

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("reqshift_current_user");
            location.reload();
        });
    }
}