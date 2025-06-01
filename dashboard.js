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

const mainArea = document.getElementById("main-area");
const headerExam = document.getElementById("header-exam");
const popupBg = document.getElementById("popup-bg");
const popupDiv = document.getElementById("popup");
const fab = document.getElementById("fab");
const settingsBtn = document.getElementById("settings-btn");
const splash = document.getElementById('splash');

let academicYear = null;
let yearsList = [];
let classes = [];
let colorPalette = [
    "#e74c3c", "#fdc600", "#27ae60", "#2980b9", "#e67e22",
    "#9b59b6", "#f39c12", "#e84393", "#00b894", "#fdc600"
];
let sectionColors = colorPalette;
let subjectsByExam = {};
let showDeletedStudents = false;

auth.onAuthStateChanged(function (user) {
    if (splash) splash.classList.add('hidden');
    if (!user) {
        window.location.replace("index.html");
    } else {
        dashboardAppInit();
    }
});

function dashboardAppInit() {
    loadAcademicYears();

    function loadAcademicYears() {
        db.collection('years').orderBy('name', 'desc').get().then(snap => {
            yearsList = [];
            snap.forEach(doc => yearsList.push(doc.id));
            if (yearsList.length > 0) {
                academicYear = localStorage.getItem('sp_selectedYear') || yearsList[0];
                showDashboard();
            } else {
                showAddYearPopup();
            }
        }).catch(error => {
            alert("Error loading academic years: " + error.message);
        });
    }

    function showDashboard() {
        if (headerExam) headerExam.textContent = academicYear || '';
        db.collection('years').doc(academicYear).collection('classes').orderBy('order', 'asc').get()
            .then(snap => {
                classes = [];
                snap.forEach(doc => {
                    let data = doc.data();
                    if (!data.isDeleted) {
                        classes.push({ id: doc.id, ...data });
                    }
                });
                renderClassList();
            }).catch(error => {
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
        if (mainArea) mainArea.innerHTML = html;

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
                        alert("Error loading sections: " + error.message);
                    });
            }).catch(error => {
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
        if (mainArea) mainArea.innerHTML = html;

        document.querySelectorAll('.section-chip').forEach(chip => {
            chip.addEventListener('click', function () {
                const classId = this.dataset.classId;
                const sectionId = this.dataset.sectionId;
                const className = this.dataset.className;
                const sectionName = this.dataset.sectionName;
                showStudents(classId, sectionId, className, sectionName);
            });
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
                }, 700);
            }
            function clearPress(e) {
                clearTimeout(pressTimer);
            }
        });

        showFAB("Add Section", () => showAddSectionPopup(classId, className));
        if (settingsBtn) settingsBtn.style.display = "none";
        setScreenTitle(`${className} - Sections`);
        setHistory(() => renderSectionList(classId, className, sections));
    }

    function showStudents(classId, sectionId, className, sectionName) {
        db.collection('years').doc(academicYear).collection('classes').doc(classId)
            .collection('sections').doc(sectionId).collection('students').orderBy('roll').get()
            .then(snap => {
                let students = [];
                snap.forEach(doc => students.push({ id: doc.id, ...doc.data() }));
                renderStudentList(classId, sectionId, className, sectionName, students, showDeletedStudents);
            }).catch(error => {
                alert("Error loading students: " + error.message);
            });
    };

    function renderStudentList(classId, sectionId, className, sectionName, students, showDeleted = false) {
        let html = `
            <div class="screen-title">${className} – Section ${sectionName}</div>
            <div style="margin: 10px 0 16px 0;">
                <label style="font-size: 0.98em;">
                    <input type="checkbox" id="showDeletedToggle" ${showDeleted ? 'checked' : ''}>
                    Show Deleted Students
                </label>
            </div>
            <div class="student-list">
        `;
        students
            .filter(stu => showDeleted ? (stu.isDeleted === true) : (!stu.isDeleted || stu.isDeleted === false))
            .forEach(stu => {
                html += `
                <div class="student-row ${stu.isDeleted ? 'deleted-student' : ''}"
                    data-class-id="${classId}"
                    data-section-id="${sectionId}"
                    data-student-id="${stu.id}"
                    data-student-name="${stu.name}"
                    data-is-deleted="${!!stu.isDeleted}">
                    <span class="roll-no">${stu.roll}.</span> ${stu.name}
                    ${stu.isDeleted ? '<span style="color:#e74c3c;font-size:0.95em;margin-left:7px;">(Deleted)</span>' : ''}
                </div>`;
            });
        html += "</div>";
        if (mainArea) mainArea.innerHTML = html;

        const showDeletedToggle = document.getElementById('showDeletedToggle');
        if (showDeletedToggle) {
            showDeletedToggle.onchange = function () {
                showDeletedStudents = showDeletedToggle.checked;
                renderStudentList(classId, sectionId, className, sectionName, students, showDeletedStudents);
            };
        }

        document.querySelectorAll('.student-row').forEach(row => {
            let pressTimer = null;
            row.addEventListener('mousedown', startPress);
            row.addEventListener('touchstart', startPress);
            row.addEventListener('mouseup', clearPress);
            row.addEventListener('mouseleave', clearPress);
            row.addEventListener('touchend', clearPress);

            function startPress(e) {
                pressTimer = setTimeout(() => {
                    showStudentActionPopup(
                        row.dataset.classId,
                        row.dataset.sectionId,
                        row.dataset.studentId,
                        row.dataset.studentName,
                        row.dataset.isDeleted === "true"
                    );
                }, 700);
            }
            function clearPress(e) {
                clearTimeout(pressTimer);
            }
        });

        showFAB("Add Student", () => showAddStudentPopup(classId, sectionId, className, sectionName));
        showSettingsBtn("section", classId, sectionId, className, sectionName);
        setScreenTitle(`${className} – ${sectionName} - Students`);
        setHistory(() => renderStudentList(classId, sectionId, className, sectionName, students, showDeletedStudents));
    }

    function showStudentActionPopup(classId, sectionId, studentId, studentName, isDeleted) {
        let html = `
          <div class="popup" id="studentActionPopup">
            <div style="font-weight:600;color:#0f3d6b;margin-bottom:13px;font-size:1.1em;">
              Student Actions (${studentName})
            </div>
            <div class="option-row" style="flex-direction:column;gap:14px;">
              ${!isDeleted
                ? `<button class="option-btn" id="editStudentBtn">Edit Student</button>
                   <button class="option-btn" id="deleteStudentBtn">Delete Student</button>`
                : `<button class="option-btn" id="restoreStudentBtn">Restore Student</button>`
              }
              <button class="option-btn" id="closeStudentActionBtn">Close</button>
            </div>
          </div>
        `;
        showPopup(html);

        if (!isDeleted && document.getElementById('editStudentBtn')) {
            document.getElementById('editStudentBtn').onclick = function () {
                db.collection('years').doc(academicYear)
                  .collection('classes').doc(classId)
                  .collection('sections').doc(sectionId)
                  .collection('students').doc(studentId)
                  .get()
                  .then(doc => {
                    if (doc.exists) {
                      const data = doc.data();
                      showEditStudentPopup(
                        classId, sectionId, studentId,
                        data.name || '', data.father || '', data.roll || '',
                        () => showStudents(classId, sectionId)
                      );
                    } else {
                      alert("Student not found!");
                    }
                  });
            };
        }
        if (!isDeleted && document.getElementById('deleteStudentBtn')) {
            document.getElementById('deleteStudentBtn').onclick = function () {
                if (confirm("Are you sure you want to delete?")) {
                    if (confirm("This cannot be undone. Really delete?")) {
                        deleteStudentFromDB(classId, sectionId, studentId);
                    }
                }
            };
        }
        if (isDeleted && document.getElementById('restoreStudentBtn')) {
            document.getElementById('restoreStudentBtn').onclick = function () {
                restoreStudentInDB(classId, sectionId, studentId);
            }
        }
        if (document.getElementById('closeStudentActionBtn')) {
            document.getElementById('closeStudentActionBtn').onclick = closePopup;
        }
    }

    function showEditStudentPopup(classId, sectionId, studentId, currentName, currentFather, currentRoll, afterEdit) {
        let html = `
            <form class="popup" id="editStudentForm">
                <label>Student Name</label>
                <input name="studentName" maxlength="40" required value="${currentName}">
                <label>Father's Name</label>
                <input name="fatherName" maxlength="40" required value="${currentFather}">
                <label>Roll Number</label>
                <input name="rollNo" type="number" min="1" max="999" required value="${currentRoll}">
                <div class="btn-row">
                    <button type="button" class="cancel-btn">Cancel</button>
                    <button type="submit">Update</button>
                </div>
            </form>
        `;
        showPopup(html, 'editStudentForm', function (e) {
            e.preventDefault();
            const name = e.target.studentName.value.trim();
            const father = e.target.fatherName.value.trim();
            const roll = parseInt(e.target.rollNo.value.trim(), 10);
            db.collection('years').doc(academicYear)
                .collection('classes').doc(classId)
                .collection('sections').doc(sectionId)
                .collection('students').doc(studentId)
                .update({ name, father, roll })
                .then(() => {
                    closePopup();
                    if (afterEdit) afterEdit();
                })
                .catch(error => alert("Error editing student: " + error.message));
        });
    }

    function deleteStudentFromDB(classId, sectionId, studentId) {
        db.collection('years').doc(academicYear)
            .collection('classes').doc(classId)
            .collection('sections').doc(sectionId)
            .collection('students').doc(studentId)
            .update({ isDeleted: true })
            .then(() => {
                closePopup();
                showStudents(classId, sectionId);
            })
            .catch(error => alert("Error soft-deleting student: " + error.message));
    }

    function restoreStudentInDB(classId, sectionId, studentId) {
        db.collection('years').doc(academicYear)
            .collection('classes').doc(classId)
            .collection('sections').doc(sectionId)
            .collection('students').doc(studentId)
            .update({ isDeleted: firebase.firestore.FieldValue.delete() })
            .then(() => {
                closePopup();
                showStudents(classId, sectionId);
            })
            .catch(error => alert("Error restoring student: " + error.message));
    }

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
                alert("Error adding class: " + error.message);
            });
    }
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
                showSections(classId, className);
            }).catch(error => {
                alert("Error adding section: " + error.message);
            });
    }
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
                showStudents(classId, sectionId, className, sectionName);
            }).catch(error => {
                alert("Error adding student: " + error.message);
            });
    }

    function showSettingsBtn(mode, ...args) {
        if (settingsBtn) {
            settingsBtn.onclick = null;
            if (settingsBtn._currentClickHandler) settingsBtn.removeEventListener('click', settingsBtn._currentClickHandler);
            let handler;
            if (mode === "main") handler = showMainSettingsPopup;
            else if (mode === "class" || mode === "section") handler = () => showClassActionsPopup(...args);
            settingsBtn._currentClickHandler = handler;
            settingsBtn.addEventListener('click', handler);
            settingsBtn.style.display = "flex";
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
        if (document.getElementById('addYearBtn')) document.getElementById('addYearBtn').addEventListener('click', showAddYearPopup);
        if (document.getElementById('logoutBtn')) document.getElementById('logoutBtn').addEventListener('click', logout);
        if (document.getElementById('closeSettingsBtn')) document.getElementById('closeSettingsBtn').addEventListener('click', closePopup);
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
    }
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
                alert("Error adding academic year: " + error.message);
            });
    }
    function logout() {
        auth.signOut().then(() => {
            window.location.href = "index.html";
        }).catch(error => {
            alert("Error logging out: " + error.message);
        });
    }

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
        if (document.getElementById('examSettingsBtn')) document.getElementById('examSettingsBtn').addEventListener('click', showExamSettingsPopup);
        if (document.getElementById('enterMarksBtn')) document.getElementById('enterMarksBtn').addEventListener('click', showEnterMarksPopup);
        if (document.getElementById('downloadMemosBtn')) document.getElementById('downloadMemosBtn').addEventListener('click', downloadClassMemos);
        if (document.getElementById('downloadHallTicketsBtn')) document.getElementById('downloadHallTicketsBtn').addEventListener('click', downloadHallTickets);
        if (document.getElementById('downloadExcelBtn')) document.getElementById('downloadExcelBtn').addEventListener('click', downloadClassExcel);
        if (document.getElementById('performanceGraphBtn')) document.getElementById('performanceGraphBtn').addEventListener('click', showPerformanceGraph);
        if (document.getElementById('closeClassActionsBtn')) document.getElementById('closeClassActionsBtn').addEventListener('click', closePopup);
    }

    // ========== New Added Functions for Exam Settings and Marks Entry ==========

    function showExamSettingsPopup() {
        // Load saved exams from Firestore for the current academic year
        db.collection('years').doc(academicYear).collection('exams').get()
            .then(snapshot => {
                let exams = [];
                snapshot.forEach(doc => {
                    exams.push({ id: doc.id, ...doc.data() });
                });
                renderExamSettings(exams);
            })
            .catch(error => alert("Error loading exams: " + error.message));
    }

    function renderExamSettings(exams) {
        let html = `<div style="font-weight:600;color:#0f3d6b;margin-bottom:8px;font-size:1.1em;">Saved Exams</div>
            <div id="examListArea" style="max-height: 200px; overflow-y: auto; margin-bottom: 15px;">`;
        if (exams.length === 0) {
            html += `<div style="color:#999; font-style: italic;">No exams saved yet.</div>`;
        } else {
            exams.forEach(exam => {
                html += `<div class="option-btn" style="padding: 8px 10px; font-weight: 600; margin-bottom: 6px; cursor:pointer;" data-id="${exam.id}">${exam.name}</div>`;
            });
        }
        html += `</div>
            <form id="addExamForm" style="margin-top: 15px;">
                <label>Exam Name</label>
                <input name="examName" maxlength="30" placeholder="e.g., Formative Assessment 1" required />
                <div class="btn-row">
                    <button type="button" class="cancel-btn">Cancel</button>
                    <button type="submit">Add Exam</button>
                </div>
            </form>`;
        showPopup(html, 'addExamForm', addExamToDB);

        // Add click listeners to existing exams for editing/deleting
        document.querySelectorAll('#examListArea .option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const examId = btn.dataset.id;
                openEditExamPopup(examId);
            });
        });
    }

    function addExamToDB(e) {
        e.preventDefault();
        const examName = e.target.examName.value.trim();
        if (!examName) return;
        db.collection('years').doc(academicYear).collection('exams').add({
            name: examName,
            subjects: []
        })
        .then(() => {
            closePopup();
            showExamSettingsPopup();
        })
        .catch(error => alert("Error adding exam: " + error.message));
    }

    function openEditExamPopup(examId) {
        // Load exam document
        db.collection('years').doc(academicYear).collection('exams').doc(examId).get()
            .then(doc => {
                if (!doc.exists) {
                    alert("Exam not found!");
                    return;
                }
                const exam = doc.data();
                renderEditExamForm(examId, exam.name, exam.subjects || []);
            })
            .catch(error => alert("Error loading exam: " + error.message));
    }

    function renderEditExamForm(examId, examName, subjects) {
        let html = `
            <form id="editExamForm" class="popup">
                <label>Exam Name</label>
                <input name="examName" maxlength="30" required value="${examName}" />
                <div style="margin: 15px 0 10px 0; font-weight:600; color:#0f3d6b;">Subjects</div>
                <div id="subjectListContainer" style="max-height: 180px; overflow-y: auto; margin-bottom: 12px;">`;
        subjects.forEach((subj, idx) => {
            html += `
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
                    <input type="text" name="subjectName_${idx}" value="${subj.name}" placeholder="Subject Name" required style="flex:1; padding: 8px; border-radius: 6px; border: 1px solid #c7d7ea; background: #f7fafd;" />
                    <input type="number" name="maxMarks_${idx}" value="${subj.max}" placeholder="Max Marks" min="1" max="200" required style="width:80px; padding: 8px; border-radius: 6px; border: 1px solid #c7d7ea; background: #f7fafd;" />
                    <button type="button" class="option-btn" style="width: 70px; padding: 5px;" onclick="removeSubjectField(this)">Remove</button>
                </div>`;
        });
        html += `
                </div>
                <button type="button" class="option-btn" style="width: 100%; margin-bottom: 10px;" onclick="addSubjectField()">Add Subject</button>
                <div class="btn-row">
                    <button type="button" class="cancel-btn">Cancel</button>
                    <button type="submit">Save Exam</button>
                </div>
            </form>
        `;
        showPopup(html, 'editExamForm', function(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            const newExamName = formData.get('examName').trim();
            if (!newExamName) return alert("Exam name required.");
            let newSubjects = [];
            let i = 0;
            while (formData.has(`subjectName_${i}`)) {
                let name = formData.get(`subjectName_${i}`).trim();
                let max = parseInt(formData.get(`maxMarks_${i}`), 10);
                if (name && max > 0) {
                    newSubjects.push({ name, max });
                }
                i++;
            }
            if (newSubjects.length === 0) return alert("Add at least one subject.");
            db.collection('years').doc(academicYear).collection('exams').doc(examId)
                .update({ name: newExamName, subjects: newSubjects })
                .then(() => {
                    alert("Exam updated successfully.");
                    closePopup();
                    showExamSettingsPopup();
                })
                .catch(error => alert("Error updating exam: " + error.message));
        });

        // Cancel button handler
        const cancelBtn = document.querySelector('.cancel-btn');
        if (cancelBtn) cancelBtn.onclick = closePopup;
    }

    // Add subject field dynamically in Edit Exam form
    window.addSubjectField = function() {
        const container = document.getElementById('subjectListContainer');
        if (!container) return;
        const idx = container.children.length;
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.gap = '6px';
        div.style.marginBottom = '8px';
        div.innerHTML = `
            <input type="text" name="subjectName_${idx}" placeholder="Subject Name" required style="flex:1; padding: 8px; border-radius: 6px; border: 1px solid #c7d7ea; background: #f7fafd;" />
            <input type="number" name="maxMarks_${idx}" placeholder="Max Marks" min="1" max="200" required style="width:80px; padding: 8px; border-radius: 6px; border: 1px solid #c7d7ea; background: #f7fafd;" />
            <button type="button" class="option-btn" style="width: 70px; padding: 5px;" onclick="removeSubjectField(this)">Remove</button>`;
        container.appendChild(div);
    }

    // Remove subject field button handler
    window.removeSubjectField = function(btn) {
        if (btn && btn.parentNode) {
            btn.parentNode.remove();
        }
    }

    // Marks Entry Popup
    function showEnterMarksPopup() {
        // Select Section, Exam and Subject

        // Load classes and sections for dropdown
        db.collection('years').doc(academicYear).collection('classes').get()
            .then(snap => {
                let classOptions = [];
                snap.forEach(doc => {
                    classOptions.push({ id: doc.id, name: doc.data().name });
                });
                renderEnterMarksSelection(classOptions);
            })
            .catch(error => alert("Error loading classes: " + error.message));
    }

    function renderEnterMarksSelection(classesList) {
        // Load exams for dropdown
        db.collection('years').doc(academicYear).collection('exams').get()
            .then(snap => {
                let examOptions = [];
                snap.forEach(doc => {
                    examOptions.push({ id: doc.id, name: doc.data().name, subjects: doc.data().subjects || [] });
                });

                let html = `
                    <form id="enterMarksSelectForm" class="popup">
                        <label>Select Class</label>
                        <select name="classSelect" id="classSelect" required>
                            <option value="">Select Class</option>
                            ${classesList.map(cls => `<option value="${cls.id}">${cls.name}</option>`).join('')}
                        </select>
                        <label>Select Section</label>
                        <select name="sectionSelect" id="sectionSelect" required disabled>
                            <option value="">Select Section</option>
                        </select>
                        <label>Select Exam</label>
                        <select name="examSelect" id="examSelect" required>
                            <option value="">Select Exam</option>
                            ${examOptions.map(exam => `<option value="${exam.id}">${exam.name}</option>`).join('')}
                        </select>
                        <label>Select Subject</label>
                        <select name="subjectSelect" id="subjectSelect" required disabled>
                            <option value="">Select Subject</option>
                        </select>
                        <div class="btn-row">
                            <button type="button" class="cancel-btn">Cancel</button>
                            <button type="submit">Proceed</button>
                        </div>
                    </form>
                `;

                showPopup(html, 'enterMarksSelectForm', onEnterMarksSelectionSubmit);

                // Cancel button handler
                const cancelBtn = document.querySelector('.cancel-btn');
                if (cancelBtn) cancelBtn.onclick = closePopup;

                // Populate sections on class change
                const classSelect = document.getElementById('classSelect');
                const sectionSelect = document.getElementById('sectionSelect');
                const examSelect = document.getElementById('examSelect');
                const subjectSelect = document.getElementById('subjectSelect');

                classSelect.addEventListener('change', () => {
                    const classId = classSelect.value;
                    if (!classId) {
                        sectionSelect.innerHTML = '<option value="">Select Section</option>';
                        sectionSelect.disabled = true;
                        return;
                    }
                    sectionSelect.disabled = false;
                    db.collection('years').doc(academicYear).collection('classes').doc(classId).collection('sections').get()
                        .then(secSnap => {
                            let options = '<option value="">Select Section</option>';
                            secSnap.forEach(secDoc => {
                                options += `<option value="${secDoc.id}">${secDoc.data().name}</option>`;
                            });
                            sectionSelect.innerHTML = options;
                        })
                        .catch(() => {
                            sectionSelect.innerHTML = '<option value="">Select Section</option>';
                            sectionSelect.disabled = true;
                        });
                });

                examSelect.addEventListener('change', () => {
                    const examId = examSelect.value;
                    subjectSelect.disabled = true;
                    subjectSelect.innerHTML = '<option value="">Select Subject</option>';
                    if (!examId) return;
                    const exam = examOptions.find(e => e.id === examId);
                    if (!exam) return;
                    if (exam.subjects.length > 0) {
                        subjectSelect.innerHTML = exam.subjects.map(subj => `<option value="${subj.name}">${subj.name} (Max: ${subj.max})</option>`).join('');
                        subjectSelect.disabled = false;
                    }
                });
            })
            .catch(error => alert("Error loading exams: " + error.message));
    }

    function onEnterMarksSelectionSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const classId = form.classSelect.value;
        const sectionId = form.sectionSelect.value;
        const examId = form.examSelect.value;
        const subjectName = form.subjectSelect.value;

        if (!classId || !sectionId || !examId || !subjectName) {
            alert("Please select all options.");
            return;
        }

        // Load students of the selected class and section
        db.collection('years').doc(academicYear).collection('classes').doc(classId)
            .collection('sections').doc(sectionId).collection('students').orderBy('roll').get()
            .then(snap => {
                let students = [];
                snap.forEach(doc => students.push({ id: doc.id, ...doc.data() }));

                // Get max marks for selected subject from exam
                db.collection('years').doc(academicYear).collection('exams').doc(examId).get()
                    .then(doc => {
                        if (!doc.exists) {
                            alert("Exam not found!");
                            return;
                        }
                        const exam = doc.data();
                        const subjectObj = (exam.subjects || []).find(s => s.name === subjectName);
                        const max = subjectObj ? subjectObj.max : 100;

                        renderMarksEntryForm(classId, sectionId, examId, subjectName, max, students);
                    })
                    .catch(error => alert("Error loading exam data: " + error.message));
            })
            .catch(error => alert("Error loading students for marks entry: " + error.message));
    }

    function renderMarksEntryForm(classId, sectionId, examId, subjectName, max, students) {
        let html = `
            <form id="marksEntryForm" class="popup" style="max-height: 80vh; overflow-y: auto;">
                <div style="font-weight: 600; color: #0f3d6b; margin-bottom: 12px; font-size: 1.1em;">
                    Enter Marks - ${subjectName} (Max: ${max})
                </div>
                <div style="display: flex; flex-direction: column; gap: 10px; max-height: 50vh; overflow-y: auto;"> 
                    ${students.map(stu => `
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="width: 65%; font-weight: 600;">${stu.roll}. ${stu.name}</div>
                            <input type="number" style="width: 70px; padding: 5px; border-radius: 6px; border: 1.3px solid #c7d7ea; background: #f7fafd;"
                                name="marks_${stu.id}" min="0" max="${max}" placeholder="Marks" required />
                        </div>`).join('')}
                </div>
                <div class="btn-row" style="margin-top:10px;">
                    <button type="button" class="cancel-btn">Cancel</button>
                    <button type="submit">Save Marks</button>
                </div>
            </form>
        `;
        showPopup(html, 'marksEntryForm', function(e) {
            e.preventDefault();
            let formData = new FormData(e.target);
            let batch = db.batch();
            students.forEach(stu => {
                let key = `marks_${stu.id}`;
                let val = formData.get(key);
                if (val !== null) {
                    let marks = parseFloat(val);
                    if (isNaN(marks) || marks < 0 || marks > max) {
                        alert(`Invalid marks for ${stu.name}`);
                        throw new Error("Invalid marks");
                    }
                    // Save marks in student subcollection marks/{examId} with subject marks
                    let marksDoc = db.collection('years').doc(academicYear)
                        .collection('classes').doc(classId)
                        .collection('sections').doc(sectionId)
                        .collection('students').doc(stu.id)
                        .collection('marks').doc(examId);
                    batch.set(marksDoc, { [subjectName]: marks }, { merge: true });
                }
            });
            batch.commit().then(() => {
                alert("Marks saved successfully!");
                closePopup();
            }).catch(error => {
                alert("Error saving marks: " + error.message);
            });
        });
        document.querySelector('.cancel-btn').onclick = closePopup;
    }

    // ==== Existing helper functions ====

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
        }
    }

    function setScreenTitle(title) {
        if (document.querySelector(".screen-title")) {
            document.querySelector(".screen-title").textContent = title;
        }
    }

    let lastViewFn = null;
    function setHistory(fn) {
        lastViewFn = fn;
        if (window.location.hash !== "#step") {
            history.pushState({ step: true }, "", "#step");
        }
    }
    window.onpopstate = function (event) {
        if (lastViewFn && event.state && event.state.step) {
            lastViewFn();
        } else {
            showDashboard();
        }
    };
}
