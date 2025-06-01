if (typeof firebase === "undefined") alert("Firebase not loaded!");

const firebaseConfig = {
    apiKey: "AIzaSyBXCXAB2n2qqF6lIxpX5XYnqBWHClYik14",
    authDomain: "stpatricksprogresscard.firebaseapp.com",
    projectId: "stpatricksprogresscard",
    storageBucket: "stpatricksprogresscard.appspot.com",
    messagingSenderId: "671416933178",
    appId: "1:671416933178:web:4921d57abc6eb11bd2ce03"
};
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// Add this block for persistent login
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

// Global DOM references that are reliably present on both login and dashboard pages, or are just global containers
const mainArea = document.getElementById("main-area");
const headerExam = document.getElementById("header-exam");
const popupBg = document.getElementById("popup-bg");
const popupDiv = document.getElementById("popup");


function showLoginUI() {
    const loginRoot = document.getElementById('login-root');
    if (!loginRoot) return;
    loginRoot.innerHTML = `
        <div class="login-box">
            <div class="school-title">St. Patrick’s School</div>
            <div class="subtitle">IIT & NEET FOUNDATION</div>
            <input type="email" id="email" placeholder="Email">
            <input type="password" id="password" placeholder="Password">
            <div class="forgot-row">
                <button type="button" onclick="forgotPassword()">Forgot Password?</button>
            </div>
            <button class="btn-email" onclick="emailSignIn()">Sign in with Email</button>
            <button class="btn-register" onclick="emailRegister()">Register (New User)</button>
            <button class="btn-google" onclick="googleSignIn()">
                <i class="fab fa-google" style="margin-right:10px;font-size:1.3em;vertical-align:middle;"></i>
                Sign in with Google
            </button>
        </div>
    `;
    loginRoot.style.display = 'flex'; // Ensure login root is visible after rendering content
}

window.emailSignIn = function () {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    if (!email || !password) return alert('Enter email and password!');
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then(() => window.location.href = "dashboard.html")
        .catch(err => alert(err.message));
};

window.emailRegister = function () {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    if (!email || !password) return alert('Enter email and password!');
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(() => {
            alert("Registration successful! You are now signed in.");
            window.location.href = "dashboard.html";
        })
        .catch(err => alert(err.message));
};

window.googleSignIn = function () {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
        .then(() => window.location.href = "dashboard.html")
        .catch(err => alert(err.message));
};

window.forgotPassword = function () {
    const email = document.getElementById('email').value.trim();
    if (!email) return alert('Enter your email to reset password.');
    firebase.auth().sendPasswordResetEmail(email)
        .then(() => alert("Password reset email sent."))
        .catch(err => alert(err.message));
};

// ===== Dashboard Auth Check =====
let dashboardInitialized = false;
firebase.auth().onAuthStateChanged(function (user) {
    const path = window.location.pathname;
    const isIndex = path.endsWith('index.html') || path === '/' || path === '' || path.includes('Progress-card-app');
    const isDashboard = path.endsWith('dashboard.html');

    // Hide splash screen as soon as auth state is known, regardless of page
    const splash = document.getElementById('splash');
    if (splash) splash.classList.add('hidden');

    // On index.html (login page)
    if (isIndex) {
        if (user) {
            // User already logged in, go to dashboard
            if (!window.location.pathname.endsWith('dashboard.html')) {
                window.location.replace("dashboard.html");
            }
        } else {
            // User not logged in, show login UI!
            showLoginUI();
        }
    }
    // On dashboard.html (main app)
    else if (isDashboard) {
        if (!user) {
            // Not logged in, go back to login
            if (!window.location.pathname.endsWith('index.html')) {
                window.location.replace("index.html");
            }
        } else {
            // User is logged in, initialize dashboard
            if (!dashboardInitialized) {
                dashboardInitialized = true;
                dashboardAppInit();
            }
        }
    }
    // On any other page: do nothing or handle as needed
});

// ==== DASHBOARD LOGIC STARTS HERE ====
console.log('dashboardAppInit started'); // This log should now consistently appear if you're on dashboard.html and logged in.

function dashboardAppInit() {
    // DOM references for the dashboard elements - GET THEM HERE!
    // These are now obtained *inside* dashboardAppInit,
    // ensuring the DOM is ready for them.
   
    // Global state (inside dashboardAppInit as per your design)
    let academicYear = null;
    let yearsList = [];
    let classes = [];
    let colorPalette = [
        "#e74c3c", "#fdc600", "#27ae60", "#2980b9", "#e67e22",
        "#9b59b6", "#f39c12", "#e84393", "#00b894", "#fdc600"
    ];
    let currentClass = null, currentSection = null, currentStudent = null;
    let sectionColors = colorPalette;
    let subjectsByExam = {}; // For Exam Settings

    // Initial load for dashboard
    loadAcademicYears();


    // == Academic Years ==
    function loadAcademicYears() {
        db.collection('years').orderBy('name', 'desc').get().then(snap => {
            yearsList = [];
            snap.forEach(doc => yearsList.push(doc.id));
            console.log("Years loaded from Firestore:", yearsList);
            if (yearsList.length > 0) {
                academicYear = localStorage.getItem('sp_selectedYear') || yearsList[0];
                showDashboard();
            } else {
                showAddYearPopup();
            }
        }).catch(error => {
            console.error("Error loading academic years:", error);
            alert("Error loading academic years: " + error.message);
        });
    }

    // == Main Dashboard: Classes ==
    function showDashboard() {
        if (headerExam) { // Check if headerExam exists before using
            headerExam.textContent = academicYear || '';
        }
        db.collection('years').doc(academicYear).collection('classes').orderBy('order', 'asc').get()
            .then(snap => {
                classes = [];
                snap.forEach(doc => classes.push({ id: doc.id, ...doc.data() }));
                renderClassList();
            }).catch(error => {
                console.error("Error loading classes:", error);
                alert("Error loading classes: " + error.message);
            });
    }

    function renderClassList() {
        let html = `<div class="screen-title">Select a Class</div>
            <div class="class-list">`;
        const defaultClasses = [
            "Nursery", "LKG", "UKG", "1st", "2nd", "3rd", "4th", "5th",
            "6th", "7th", "8th", "9th", "10th"
        ];
        let classesToShow = defaultClasses.map((name, i) => {
            let found = classes.find(c => c.name === name);
            return found || { name, id: null, order: i };
        });
        classesToShow.forEach((cls, idx) => {
            let color = colorPalette[idx % colorPalette.length];
            // Assign handler using event listener in JS, not onclick in HTML string
            html += `<button class="class-btn" style="border-color:${color};color:${color};"
                data-class-id="${cls.id}" data-class-name="${cls.name}">${cls.name}</button>`;
        });
        html += "</div>";
        if (mainArea) { // Check if mainArea exists before using
            mainArea.innerHTML = html;
        }


        // Attach event listeners to dynamically created class buttons
        document.querySelectorAll('.class-btn').forEach(button => {
            button.addEventListener('click', function () {
                const classId = this.dataset.classId;
                const className = this.dataset.className;
                window.showSections(classId, className); // Use window.showSections since it's global
            });
        });

        showFAB("Add Class", showAddClassPopup);
        showSettingsBtn("main");
        setScreenTitle("Select a Class");
        setHistory(() => showDashboard());
    }

    window.showSections = function (classId, className) {
        db.collection('years').doc(academicYear).collection('classes').where('name', '==', className).limit(1).get()
            .then(snap => {
                if (snap.empty) {
                    alert("Class not found. Please add it first.");
                    return;
                }
                let classDoc = snap.docs[0];
                db.collection('years').doc(academicYear).collection('classes').doc(classDoc.id)
                    .collection('sections').orderBy('name').get().then(secSnap => {
                        let sections = [];
                        secSnap.forEach(sec => sections.push({ id: sec.id, ...sec.data() }));
                        renderSectionList(classDoc.id, className, sections);
                    }).catch(error => {
                        console.error("Error loading sections:", error);
                        alert("Error loading sections: " + error.message);
                    });
            }).catch(error => {
                console.error("Error finding class:", error);
                alert("Error finding class: " + error.message);
            });
    };

    function renderSectionList(classId, className, sections) {
        let html = `<div class="screen-title">${className} (Class Name)</div>
            <div class="section-list">`;
        sections.forEach((sec, idx) => {
            let color = colorPalette[idx % colorPalette.length];
            html += `<div class="section-chip" style="border-color:${color}"
                data-class-id="${classId}" data-section-id="${sec.id}"
                data-class-name="${className}" data-section-name="${sec.name}">${sec.name}</div>`;
        });
        html += "</div>";
        if (mainArea) { // Check if mainArea exists before using
            mainArea.innerHTML = html;
        }

        // Attach event listeners to dynamically created section chips
        document.querySelectorAll('.section-chip').forEach(chip => {
            chip.addEventListener('click', function () {
                const classId = this.dataset.classId;
                const sectionId = this.dataset.sectionId;
                const className = this.dataset.className;
                const sectionName = this.dataset.sectionName;
                window.showStudents(classId, sectionId, className, sectionName); // Use window.showStudents
            });
        });

        showFAB("Add Section", () => showAddSectionPopup(classId, className));
        if (settingsBtn) { // Check if settingsBtn exists before using
            settingsBtn.style.display = "none";
        }
        setScreenTitle(`${className} - Sections`);
        setHistory(() => renderSectionList(classId, className, sections));
    }

    window.showStudents = function (classId, sectionId, className, sectionName) {
        db.collection('years').doc(academicYear).collection('classes').doc(classId)
            .collection('sections').doc(sectionId).collection('students').orderBy('roll').get()
            .then(snap => {
                let students = [];
                snap.forEach(doc => students.push({ id: doc.id, ...doc.data() }));
                renderStudentList(classId, sectionId, className, sectionName, students);
            }).catch(error => {
                console.error("Error loading students:", error);
                alert("Error loading students: " + error.message);
            });
    };

    function renderStudentList(classId, sectionId, className, sectionName, students) {
        let html = `<div class="screen-title">${className} – Section ${sectionName}</div>
            <div class="student-list">`;
        students.forEach(stu => {
            html += `<div class="student-row"><span class="roll-no">${stu.roll}.</span> ${stu.name}</div>`;
        });
        html += "</div>";
        if (mainArea) { // Check if mainArea exists before using
            mainArea.innerHTML = html;
        }
        showFAB("Add Student", () => showAddStudentPopup(classId, sectionId, className, sectionName));
        showSettingsBtn("section", classId, sectionId, className, sectionName);
        setScreenTitle(`${className} – ${sectionName} - Students`);
        setHistory(() => renderStudentList(classId, sectionId, className, sectionName, students));
    }

    // == Add Popups ==
    function showAddClassPopup() {
        let html = `
            <form class="popup" id="addClassForm">
                <label>Class Name</label>
                <input name="className" maxlength="12" required placeholder="e.g., 9th">
                <div class="btn-row">
                    <button type="button" class="cancel-btn">Cancel</button>
                    <button type="submit">Add</button>
                </div>
            </form>`;
        showPopup(html, 'addClassForm', addClassToDB);
    }

    window.addClassToDB = function (e) {
        e.preventDefault();
        const name = e.target.className.value.trim();
        if (!name) return;
        const order = [
            "Nursery", "LKG", "UKG", "1st", "2nd", "3rd", "4th", "5th",
            "6th", "7th", "8th", "9th", "10th"
        ].indexOf(name);
        db.collection('years').doc(academicYear).collection('classes').add({ name, order })
            .then(() => {
                closePopup();
                showDashboard();
            }).catch(error => {
                console.error("Error adding class:", error);
                alert("Error adding class: " + error.message);
            });
    };

    function showAddSectionPopup(classId, className) {
        let html = `
            <form class="popup" id="addSectionForm">
                <label>Section Name</label>
                <input name="sectionName" maxlength="6" required placeholder="e.g., A">
                <div class="btn-row">
                    <button type="button" class="cancel-btn">Cancel</button>
                    <button type="submit">Add</button>
                </div>
            </form>`;
        showPopup(html, 'addSectionForm', (e) => addSectionToDB(e, classId, className));
    }

    window.addSectionToDB = function (e, classId, className) {
        e.preventDefault();
        const name = e.target.sectionName.value.trim();
        if (!name) return;
        db.collection('years').doc(academicYear).collection('classes').doc(classId)
            .collection('sections').add({ name })
            .then(() => {
                closePopup();
                window.showSections(classId, className); // reload sections
            }).catch(error => {
                console.error("Error adding section:", error);
                alert("Error adding section: " + error.message);
            });
    };

    function showAddStudentPopup(classId, sectionId, className, sectionName) {
        let html = `
            <form class="popup" id="addStudentForm">
                <label>Student Name</label>
                <input name="studentName" maxlength="40" required>
                <label>Father's Name</label>
                <input name="fatherName" maxlength="40" required>
                <label>Roll Number</label>
                <input name="rollNo" type="number" min="1" max="999" required>
                <div class="btn-row">
                    <button type="button" class="cancel-btn">Cancel</button>
                    <button type="submit">Add</button>
                </div>
            </form>`;
        showPopup(html, 'addStudentForm', (e) => addStudentToDB(e, classId, sectionId, className, sectionName));
    }

    window.addStudentToDB = function (e, classId, sectionId, className, sectionName) {
        e.preventDefault();
        const name = e.target.studentName.value.trim();
        const father = e.target.fatherName.value.trim();
        const roll = e.target.rollNo.value.trim();
        if (!name || !father || !roll) return;
        db.collection('years').doc(academicYear).collection('classes').doc(classId)
            .collection('sections').doc(sectionId).collection('students')
            .add({ name, father, roll: parseInt(roll) }) // Ensure roll is a number
            .then(() => {
                closePopup();
                window.showStudents(classId, sectionId, className, sectionName); // reload
            }).catch(error => {
                console.error("Error adding student:", error);
                alert("Error adding student: " + error.message);
            });
    };

    // == Settings Button Logic ==
    function showSettingsBtn(mode, ...args) {
        if (settingsBtn) {
            settingsBtn.onclick = null; // Clear previous handler
            // Use a custom property to store/remove the specific handler function
            if (settingsBtn._currentClickHandler) {
                settingsBtn.removeEventListener('click', settingsBtn._currentClickHandler);
            }

            let handler;
            if (mode === "main") {
                handler = showMainSettingsPopup;
            } else if (mode === "class" || mode === "section") {
                handler = () => showClassActionsPopup(...args);
            }
            settingsBtn._currentClickHandler = handler; // Store reference
            settingsBtn.addEventListener('click', handler); // Attach new handler
            settingsBtn.style.display = "flex";
        } else {
            console.warn("Settings button element not found!");
        }
    }

    function showMainSettingsPopup() {
        let html = `
            <div class="popup" id="mainSettingsPopup">
                <div style="font-weight:600;color:#0f3d6b;margin-bottom:12px;font-size:1.08em;">Main Settings</div>
                <div class="option-row" style="flex-direction:column;gap:14px;">
                    <button class="option-btn" id="addYearBtn">Add Academic Year</button>
                    <button class="option-btn" id="logoutBtn">Logout</button>
                    <button class="option-btn" id="closeSettingsBtn">Close</button>
                </div>
            </div>`;
        showPopup(html); // Render content into popupDiv

        // Attach event listeners to new buttons inside the popup
        // This is crucial for dynamically added content
        if (document.getElementById('addYearBtn')) {
            document.getElementById('addYearBtn').addEventListener('click', window.showAddYearPopup);
        }
        if (document.getElementById('logoutBtn')) {
            document.getElementById('logoutBtn').addEventListener('click', window.logout);
        }
        if (document.getElementById('closeSettingsBtn')) {
            document.getElementById('closeSettingsBtn').addEventListener('click', closePopup);
        }
    }

    window.showAddYearPopup = function () {
        let html = `
            <form class="popup" id="addYearForm">
                <label>Academic Year</label>
                <input name="yearName" required placeholder="e.g., 2024-25" maxlength="10">
                <div class="btn-row">
                    <button type="button" class="cancel-btn">Cancel</button>
                    <button type="submit">Add</button>
                </div>
            </form>`;
        showPopup(html, 'addYearForm', addAcademicYear);
    };

    window.addAcademicYear = function (e) {
        e.preventDefault();
        const year = e.target.yearName.value.trim();
        if (!year) return;
        db.collection('years').doc(year).set({ name: year })
            .then(() => {
                closePopup();
                academicYear = year;
                localStorage.setItem('sp_selectedYear', year);
                showDashboard();
            }).catch(error => {
                console.error("Error adding academic year:", error);
                alert("Error adding academic year: " + error.message);
            });
    };

    window.logout = function () {
        auth.signOut().then(() => {
            window.location.href = "index.html";
        }).catch(error => {
            console.error("Error logging out:", error);
            alert("Error logging out: " + error.message);
        });
    };

    // == Class/Section Actions ==
    function showClassActionsPopup(classId, sectionId, className, sectionName) {
        let html = `
            <div class="popup" id="classActionsPopup">
                <div style="font-weight:600;color:#0f3d6b;margin-bottom:13px;font-size:1.1em;">
                    Class Actions (${className}${sectionName ? " - " + sectionName : ""})
                </div>
                <div class="option-row" style="flex-direction:column;gap:14px;">
                    <button class="option-btn" id="examSettingsBtn">Exam Settings</button>
                    <button class="option-btn" id="enterMarksBtn">Enter Marks</button>
                    <button class="option-btn" id="downloadMemosBtn">Download Class Marks Memos (PDF)</button>
                    <button class="option-btn" id="downloadHallTicketsBtn">Download Hall Tickets</button>
                    <button class="option-btn" id="downloadExcelBtn">Download Class Marks (Excel)</button>
                    <button class="option-btn" id="performanceGraphBtn">Performance Graph</button>
                    <button class="option-btn" id="closeClassActionsBtn">Close</button>
                </div>
            </div>`;
        showPopup(html);

        // Attach event listeners to dynamically created buttons
        if (document.getElementById('examSettingsBtn')) {
            document.getElementById('examSettingsBtn').addEventListener('click', window.showExamSettingsPopup);
        }
        if (document.getElementById('enterMarksBtn')) {
            document.getElementById('enterMarksBtn').addEventListener('click', window.showEnterMarksPopup);
        }
        if (document.getElementById('downloadMemosBtn')) {
            document.getElementById('downloadMemosBtn').addEventListener('click', window.downloadClassMemos);
        }
        if (document.getElementById('downloadHallTicketsBtn')) {
            document.getElementById('downloadHallTicketsBtn').addEventListener('click', window.downloadHallTickets);
        }
        if (document.getElementById('downloadExcelBtn')) {
            document.getElementById('downloadExcelBtn').addEventListener('click', window.downloadClassExcel);
        }
        if (document.getElementById('performanceGraphBtn')) {
            document.getElementById('performanceGraphBtn').addEventListener('click', window.showPerformanceGraph);
        }
        if (document.getElementById('closeClassActionsBtn')) {
            document.getElementById('closeClassActionsBtn').addEventListener('click', closePopup);
        }
    }

    // ======= ALL FEATURE LOGIC (PLACEHOLDER for now; you must fill with actual logic as per your templates) =======
    window.showExamSettingsPopup = function () {
        alert("Exam Settings coming soon!");
    }
    window.showEnterMarksPopup = function () {
        alert("Enter Marks coming soon!");
    }
    window.downloadClassMemos = function () {
        alert("Download Class Marks Memos coming soon! (Will use memo.png)");
    }
    window.downloadHallTickets = function () {
        // Uses jsPDF, generates without PNG background
        alert("Download Hall Tickets coming soon! (No PNG background)");
    }
    window.downloadClassExcel = function () {
        alert("Download Class Marks Excel coming soon!");
    }
    window.showPerformanceGraph = function () {
        alert("Performance Graph coming soon!");
    }

    // == Popups ==
    function closePopup() {
        if (popupBg) popupBg.classList.add("hidden");
        if (popupDiv) popupDiv.classList.add("hidden");
        // Clear innerHTML to remove old event listeners from dynamically added content
        if (popupDiv) popupDiv.innerHTML = '';
        // Also remove the overlay click listener if it was set
        if (popupBg) popupBg.onclick = null;
    }

    // Modified showPopup to handle dynamic form submission and button clicks more robustly
    function showPopup(htmlContent, formId = null, formSubmitHandler = null) {
        if (popupBg) {
            popupBg.innerHTML = ""; // Clear existing content
            popupBg.classList.remove("hidden");
        }
        if (popupDiv) {
            popupDiv.innerHTML = htmlContent; // Set new content
            popupDiv.classList.remove("hidden");
        }

        // Attach event listener for clicking the overlay to close the popup
        if (popupBg) {
            popupBg.onclick = function (e) {
                if (e.target === popupBg) closePopup();
            };
        }

        // Handle dynamically created forms
        if (formId && formSubmitHandler) {
            const form = document.getElementById(formId);
            if (form) {
                form.addEventListener('submit', formSubmitHandler);
            }
        }

        // Attach event listener for dynamically created cancel buttons within the popup
        if (popupDiv) {
            popupDiv.querySelectorAll('.cancel-btn').forEach(button => {
                button.addEventListener('click', function (e) {
                    e.preventDefault(); // Prevent default form submission if it's a button inside a form
                    closePopup();
                });
            });
        }
    }

    // == FAB (Floating Action Button) ==
    function showFAB(label, onClickHandler) {
        const fab = document.getElementById("fab");
        if (fab) { // Check if fab element was found
            fab.innerHTML = ""; // FAB already has "+" content via :before pseudo-element in CSS
            fab.onclick = null; // Clear previous handler

            // Remove old listener if exists using the stored reference
            if (fab._currentClickHandler) {
                fab.removeEventListener('click', fab._currentClickHandler);
            }
            fab._currentClickHandler = onClickHandler; // Store reference to current handler
            fab.addEventListener('click', onClickHandler); // Attach the new handler
            fab.style.display = "flex";
        } else {
            console.warn("FAB element not found!");
        }
    }

    // == Heading for Each Screen ==
    function setScreenTitle(title) {
        if (document.querySelector(".screen-title")) {
            document.querySelector(".screen-title").textContent = title;
        }
    }

    // == History Logic (Mobile Back Button): Only one step back
    let lastViewFn = null;
    function setHistory(fn) {
        lastViewFn = fn;
        // Do NOT push state at all to avoid loop
    }
    window.onpopstate = function () {
        if (lastViewFn) lastViewFn();
    };
}
