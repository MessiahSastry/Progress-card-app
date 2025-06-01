// dashboard.js
if (typeof firebase === "undefined") alert("Firebase not loaded!");

const firebaseConfig = {
    apiKey: "AIzaSyBXCXAB2n2qqF6lIxpX5XYnqBWHClYik14", // YOUR API KEY
    authDomain: "stpatricksprogresscard.firebaseapp.com",
    projectId: "stpatricksprogresscard",
    storageBucket: "stpatricksprogresscard.appspot.com",
    messagingSenderId: "671416933178",
    appId: "1:671416933178:web:4921d57abc6eb11bd2ce03"
};
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// Global DOM references relevant ONLY to the dashboard
const mainArea = document.getElementById("main-area");
const headerExam = document.getElementById("header-exam");
const popupBg = document.getElementById("popup-bg");
const popupDiv = document.getElementById("popup");
const fab = document.getElementById("fab"); // Get FAB and settings button here
const settingsBtn = document.getElementById("settings-btn");
const splash = document.getElementById('splash');


// Global state (inside dashboard.js, but outside the function for persistent state)
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

// Auth state listener specific to dashboard.html
auth.onAuthStateChanged(function (user) {
    if (splash) {
        splash.classList.add('hidden'); // Hide splash on dashboard
    }
    if (!user) {
        // User not logged in, redirect to login page
        console.log("No user on dashboard.html, redirecting to index.html...");
        window.location.replace("index.html");
    } else {
        // User is logged in, initialize dashboard
        console.log("User IS logged in! Initializing dashboard.");
        dashboardAppInit();
    }
});

// ==== DASHBOARD LOGIC STARTS HERE ====
function dashboardAppInit() {
    console.log('dashboardAppInit started');

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
                // If no years, prompt to add one
                showAddYearPopup();
            }
        }).catch(error => {
            console.error("Error loading academic years:", error);
            alert("Error loading academic years: " + error.message);
        });
    }

    // == Main Dashboard: Classes ==
    function showDashboard() {
        if (headerExam) {
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
            html += `<button class="class-btn" style="border-color:${color};color:${color};"
                data-class-id="${cls.id}" data-class-name="${cls.name}">${cls.name}</button>`;
        });
        html += "</div>";
        if (mainArea) {
            mainArea.innerHTML = html;
        }

        document.querySelectorAll('.class-btn').forEach(button => {
            button.addEventListener('click', function () {
                const classId = this.dataset.classId;
                const className = this.dataset.className;
                showSections(classId, className);
            });
        });

        showFAB("Add Class", showAddClassPopup);
        showSettingsBtn("main");
        setScreenTitle("Select a Class");
        setHistory(() => showDashboard());
    }

    function showSections(classId, className) {
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
        if (mainArea) {
            mainArea.innerHTML = html;
        }

        document.querySelectorAll('.section-chip').forEach(chip => {
    // Normal click
    chip.addEventListener('click', function () {
        const classId = this.dataset.classId;
        const sectionId = this.dataset.sectionId;
        const className = this.dataset.className;
        const sectionName = this.dataset.sectionName;
        showStudents(classId, sectionId, className, sectionName);
    });
    // Long press for actions
    let pressTimer = null;
    chip.addEventListener('mousedown', startPress);
    chip.addEventListener('touchstart', startPress);
    chip.addEventListener('mouseup', clearPress);
    chip.addEventListener('mouseleave', clearPress);
    chip.addEventListener('touchend', clearPress);

    function startPress(e) {
        pressTimer = setTimeout(() => {
            showSectionActionPopup(
                chip.dataset.classId,
                chip.dataset.sectionId,
                chip.dataset.className,
                chip.dataset.sectionName
            );
        }, 700); // 700ms long press
    }
    function clearPress(e) {
        clearTimeout(pressTimer);
    }
});

        showFAB("Add Section", () => showAddSectionPopup(classId, className));
        if (settingsBtn) {
            settingsBtn.style.display = "none";
        }
        setScreenTitle(`${className} - Sections`);
        setHistory(() => renderSectionList(classId, className, sections));
    }

    function showStudents(classId, sectionId, className, sectionName) {
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
        if (mainArea) {
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

    function addClassToDB(e) {
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

    function addSectionToDB(e, classId, className) {
        e.preventDefault();
        const name = e.target.sectionName.value.trim();
        if (!name) return;
        db.collection('years').doc(academicYear).collection('classes').doc(classId)
            .collection('sections').add({ name })
            .then(() => {
                closePopup();
                showSections(classId, className); // reload sections
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

    function addStudentToDB(e, classId, sectionId, className, sectionName) {
        e.preventDefault();
        const name = e.target.studentName.value.trim();
        const father = e.target.fatherName.value.trim();
        const roll = e.target.rollNo.value.trim();
        if (!name || !father || !roll) return;
        db.collection('years').doc(academicYear).collection('classes').doc(classId)
            .collection('sections').doc(sectionId).collection('students')
            .add({ name, father, roll: parseInt(roll) })
            .then(() => {
                closePopup();
                showStudents(classId, sectionId, className, sectionName); // reload
            }).catch(error => {
                console.error("Error adding student:", error);
                alert("Error adding student: " + error.message);
            });
    };

    // == Settings Button Logic ==
    function showSettingsBtn(mode, ...args) {
        if (settingsBtn) {
            settingsBtn.onclick = null;
            if (settingsBtn._currentClickHandler) {
                settingsBtn.removeEventListener('click', settingsBtn._currentClickHandler);
            }
            let handler;
            if (mode === "main") {
                handler = showMainSettingsPopup;
            } else if (mode === "class" || mode === "section") {
                handler = () => showClassActionsPopup(...args);
            }
            settingsBtn._currentClickHandler = handler;
            settingsBtn.addEventListener('click', handler);
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
        showPopup(html);

        if (document.getElementById('addYearBtn')) {
            document.getElementById('addYearBtn').addEventListener('click', showAddYearPopup);
        }
        if (document.getElementById('logoutBtn')) {
            document.getElementById('logoutBtn').addEventListener('click', logout);
        }
        if (document.getElementById('closeSettingsBtn')) {
            document.getElementById('closeSettingsBtn').addEventListener('click', closePopup);
        }
    }

    function showAddYearPopup() {
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

    function addAcademicYear(e) {
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

    function logout() {
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

        if (document.getElementById('examSettingsBtn')) {
            document.getElementById('examSettingsBtn').addEventListener('click', showExamSettingsPopup);
        }
        if (document.getElementById('enterMarksBtn')) {
            document.getElementById('enterMarksBtn').addEventListener('click', showEnterMarksPopup);
        }
        if (document.getElementById('downloadMemosBtn')) {
            document.getElementById('downloadMemosBtn').addEventListener('click', downloadClassMemos);
        }
        if (document.getElementById('downloadHallTicketsBtn')) {
            document.getElementById('downloadHallTicketsBtn').addEventListener('click', downloadHallTickets);
        }
        if (document.getElementById('downloadExcelBtn')) {
            document.getElementById('downloadExcelBtn').addEventListener('click', downloadClassExcel);
        }
        if (document.getElementById('performanceGraphBtn')) {
            document.getElementById('performanceGraphBtn').addEventListener('click', showPerformanceGraph);
        }
        if (document.getElementById('closeClassActionsBtn')) {
            document.getElementById('closeClassActionsBtn').addEventListener('click', closePopup);
        }
    }

    // ======= ALL FEATURE LOGIC (PLACEHOLDER for now; you must fill with actual logic as per your templates) =======
    function showExamSettingsPopup() {
        alert("Exam Settings coming soon!");
    }
    function showEnterMarksPopup() {
        alert("Enter Marks coming soon!");
    }
    function downloadClassMemos() {
        alert("Download Class Marks Memos coming soon! (Will use memo.png)");
    }
    function downloadHallTickets() {
        alert("Download Hall Tickets coming soon! (No PNG background)");
    }
    function downloadClassExcel() {
        alert("Download Class Marks Excel coming soon!");
    }
    function showPerformanceGraph() {
        alert("Performance Graph coming soon!");
    }

    // == Popups ==
    function closePopup() {
        if (popupBg) popupBg.classList.add("hidden");
        if (popupDiv) popupDiv.classList.add("hidden");
        if (popupDiv) popupDiv.innerHTML = '';
        if (popupBg) popupBg.onclick = null;
    }

    function showPopup(htmlContent, formId = null, formSubmitHandler = null) {
        if (popupBg) {
            popupBg.innerHTML = "";
            popupBg.classList.remove("hidden");
        }
        if (popupDiv) {
            popupDiv.innerHTML = htmlContent;
            popupDiv.classList.remove("hidden");
        }

        if (popupBg) {
            popupBg.onclick = function (e) {
                if (e.target === popupBg) closePopup();
            };
        }

        if (formId && formSubmitHandler) {
            const form = document.getElementById(formId);
            if (form) {
                form.addEventListener('submit', formSubmitHandler);
            }
        }

        if (popupDiv) {
            popupDiv.querySelectorAll('.cancel-btn').forEach(button => {
                button.addEventListener('click', function (e) {
                    e.preventDefault();
                    closePopup();
                });
            });
        }
    }

    // == FAB (Floating Action Button) ==
    function showFAB(label, onClickHandler) {
        if (fab) {
            fab.innerHTML = "";
            fab.onclick = null;
            if (fab._currentClickHandler) {
                fab.removeEventListener('click', fab._currentClickHandler);
            }
            fab._currentClickHandler = onClickHandler;
            fab.addEventListener('click', onClickHandler);
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
    // == History Logic (Mobile Back Button): Only one step back
let lastViewFn = null;
function setHistory(fn) {
    lastViewFn = fn;
    // Add a new history entry
    if (window.location.hash !== "#step") {
        history.pushState({ step: true }, "", "#step");
    }
}
window.onpopstate = function (event) {
    // Prevent app from closing; call lastViewFn if set
    if (lastViewFn && event.state && event.state.step) {
        lastViewFn();
    } else {
        // On first load or no state, do nothing or reload main dashboard
        showDashboard();
        // Optionally: history.replaceState(null, "", window.location.pathname); // Reset state
    }
};
}
