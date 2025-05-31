// ====== Firebase Setup ======
const firebaseConfig = {
  apiKey: "AIzaSyBXCXAB2n2qqF6lIxpX5XYnqBWHClYik14",
  authDomain: "stpatricksprogresscard.firebaseapp.com",
  projectId: "stpatricksprogresscard",
  storageBucket: "stpatricksprogresscard.appspot.com",
  messagingSenderId: "671416933178",
  appId: "1:671416933178:web:4921d57abc6eb11bd2ce03"
};

// Load Firebase
try {
  firebase.initializeApp(firebaseConfig);
} catch(e) {}

// ---- Force Splash to Hide and Login to Show ----
function showLoginScreen() {
  document.getElementById('login-root').style.display = 'block';
  document.getElementById("login-root").innerHTML = `
    <div class="login-box">
      <h2>St. Patrick’s School</h2>
      <div class="subtitle">IIT & NEET FOUNDATION</div>
      <input type="email" id="email" placeholder="Email">
      <input type="password" id="password" placeholder="Password">
      <button class="btn-email" onclick="emailSignIn()">Sign in with Email</button>
      <button class="btn-register" onclick="emailRegister()">Register (New User)</button>
      <button class="btn-google" onclick="googleSignIn()"><i class="fab fa-google"></i>Sign in with Google</button>
      <button class="btn-email" style="background:#fff;color:#0f3d6b;border:1px solid #0f3d6b;" onclick="forgotPassword()">Forgot Password?</button>
    </div>`;
}

function alwaysRemoveSplash() {
  const splash = document.getElementById('splash');
  if (splash) splash.style.display = "none";
  showLoginScreen();
}

if (window.location.pathname.includes("index.html") || window.location.pathname === "/") {
  window.showLoginScreen = showLoginScreen;
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

  // -- THIS IS THE GUARANTEED PART --
  setTimeout(alwaysRemoveSplash, 1200);
}

// ======== Dashboard logic (unchanged, as before) ========
if (window.location.pathname.includes("dashboard.html")) {
  const auth = firebase.auth();
  const db = firebase.firestore();
  auth.onAuthStateChanged(user => {
    if (!user) window.location.href = "index.html";
    else initDashboard(user);
  });

  let currentYear = null, currentClass = null, currentSection = null;
  let mainArea = document.getElementById('main-area');

  // ... Rest of your dashboard logic ...
  // (Copy your previous dashboard code below as needed)
}
  // Helper: Fetchers
  async function fetchYears() {
    let snap = await db.collection("years").get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => b.id.localeCompare(a.id));
  }
  async function fetchClasses(yearId) {
    let snap = await db.collection("years").doc(yearId).collection("classes").get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
  async function fetchSections(yearId, classId) {
    let snap = await db.collection("years").doc(yearId).collection("classes").doc(classId).collection("sections").get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
  async function fetchStudents(yearId, classId, sectionId) {
    let snap = await db.collection("years").doc(yearId).collection("classes").doc(classId).collection("sections").doc(sectionId).collection("students").get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Helper: Adders
  async function addClass(yearId, name) {
    await db.collection("years").doc(yearId).collection("classes").add({ name });
    showClassList();
  }
  async function addSection(yearId, classId, name) {
    await db.collection("years").doc(yearId).collection("classes").doc(classId).collection("sections").add({ name });
    showSectionList();
  }
  async function addStudent(yearId, classId, sectionId, data) {
    await db.collection("years").doc(yearId).collection("classes").doc(classId).collection("sections").doc(sectionId).collection("students").add(data);
    showStudentList();
  }

  // UI SCREENS
  function initDashboard(user) {
    showYearSelector();
    setupFAB();
    setupSettingsBtn();
    document.getElementById("header").style.display = "block";
  }

  // Academic Year selection
  async function showYearSelector() {
    const years = await fetchYears();
    mainArea.innerHTML = `<div class="screen-title">Select Academic Year</div>
      <div style="display:flex;flex-direction:column;align-items:center;margin-top:20px;">
        ${years.map(y => `<button class="class-btn" onclick="setYear('${y.id}')">${y.id}</button>`).join("")}
      </div>`;
    currentYear = null;
    document.getElementById("fab").style.display = "none";
    document.getElementById("settings-btn").style.display = "none";
  }
  window.setYear = function (yearId) {
    currentYear = yearId;
    showClassList();
  };

  // Class list
  async function showClassList() {
    if (!currentYear) return showYearSelector();
    const classes = await fetchClasses(currentYear);
    mainArea.innerHTML = `<div class="screen-title">Select a Class</div>
      <div class="class-list">
        ${classes.map(c => `<button class="class-btn" onclick="setClass('${c.id}')">${c.name}</button>`).join("")}
      </div>`;
    document.getElementById("fab").style.display = "flex";
    document.getElementById("fab").onclick = showAddClassPopup;
    document.getElementById("settings-btn").style.display = "flex";
    currentClass = null;
  }
  window.setClass = function (classId) {
    currentClass = classId;
    showSectionList();
  };

  // Section list
  async function showSectionList() {
    if (!currentYear || !currentClass) return showClassList();
    const sections = await fetchSections(currentYear, currentClass);
    mainArea.innerHTML = `<div class="screen-title">Sections</div>
      <div class="section-list">
        ${sections.map(s => `<div class="section-chip" onclick="setSection('${s.id}')">${s.name}</div>`).join("")}
      </div>`;
    document.getElementById("fab").onclick = showAddSectionPopup;
    currentSection = null;
  }
  window.setSection = function (sectionId) {
    currentSection = sectionId;
    showStudentList();
  };

  // Student list
  async function showStudentList() {
    if (!currentYear || !currentClass || !currentSection) return showSectionList();
    const students = await fetchStudents(currentYear, currentClass, currentSection);
    mainArea.innerHTML = `<div class="screen-title">Students</div>
      <div class="student-list">
        ${students.map(stu => `<div class="student-row"><span class="roll-no">${stu.roll || ''}</span> ${stu.name || ''}
        <button onclick="editStudent('${stu.id}')">Edit</button>
        <button onclick="deleteStudent('${stu.id}')">Delete</button></div>`).join("")}
      </div>`;
    document.getElementById("fab").onclick = showAddStudentPopup;
  }

  // POPUPS
  function showAddClassPopup() {
    showPopup(`<form class="popup" onsubmit="submitAddClass(event)">
      <label>Class Name</label>
      <input name="className" maxlength="20" required>
      <div class="btn-row"><button type="button" class="cancel-btn" onclick="closePopup()">Cancel</button>
      <button>Add</button></div>
    </form>`);
  }
  window.submitAddClass = function (e) {
    e.preventDefault();
    let val = e.target.className.value.trim();
    if (!val) return;
    addClass(currentYear, val);
    closePopup();
  };

  function showAddSectionPopup() {
    showPopup(`<form class="popup" onsubmit="submitAddSection(event)">
      <label>Section Name</label>
      <input name="sectionName" maxlength="20" required>
      <div class="btn-row"><button type="button" class="cancel-btn" onclick="closePopup()">Cancel</button>
      <button>Add</button></div>
    </form>`);
  }
  window.submitAddSection = function (e) {
    e.preventDefault();
    let val = e.target.sectionName.value.trim();
    if (!val) return;
    addSection(currentYear, currentClass, val);
    closePopup();
  };

  function showAddStudentPopup() {
    showPopup(`<form class="popup" onsubmit="submitAddStudent(event)">
      <label>Student Name</label>
      <input name="studentName" maxlength="35" required>
      <label>Father's Name</label>
      <input name="fatherName" maxlength="35" required>
      <label>Roll Number</label>
      <input name="rollNo" type="number" min="1" max="999" required>
      <div class="btn-row"><button type="button" class="cancel-btn" onclick="closePopup()">Cancel</button>
      <button>Add</button></div>
    </form>`);
  }
  window.submitAddStudent = function (e) {
    e.preventDefault();
    let name = e.target.studentName.value.trim();
    let father = e.target.fatherName.value.trim();
    let roll = e.target.rollNo.value.trim();
    if (!name || !father || !roll) return;
    addStudent(currentYear, currentClass, currentSection, { name, father, roll, marks: {} });
    closePopup();
  };

  // Popup helpers
  let lastPopup = null;
  function showPopup(html) {
    closePopup();
    let div = document.createElement('div');
    div.className = "popup-bg";
    div.innerHTML = html;
    lastPopup = div;
    document.body.appendChild(div);
  }
  function closePopup() {
    if (lastPopup) lastPopup.remove();
    lastPopup = null;
  }
  window.closePopup = closePopup;

  // EDIT/DELETE STUDENT
  window.editStudent = function (studentId) {
    db.collection("years").doc(currentYear).collection("classes").doc(currentClass).collection("sections").doc(currentSection).collection("students").doc(studentId).get()
      .then(doc => {
        let s = doc.data();
        showPopup(`<form class="popup" onsubmit="submitEditStudent(event, '${studentId}')">
          <label>Student Name</label>
          <input name="studentName" value="${s.name}" required>
          <label>Father's Name</label>
          <input name="fatherName" value="${s.father}" required>
          <label>Roll Number</label>
          <input name="rollNo" type="number" value="${s.roll}" required>
          <div class="btn-row"><button type="button" class="cancel-btn" onclick="closePopup()">Cancel</button>
          <button>Save</button></div>
        </form>`);
      });
  }
  window.submitEditStudent = function (e, studentId) {
    e.preventDefault();
    let name = e.target.studentName.value.trim();
    let father = e.target.fatherName.value.trim();
    let roll = e.target.rollNo.value.trim();
    db.collection("years").doc(currentYear).collection("classes").doc(currentClass).collection("sections").doc(currentSection).collection("students").doc(studentId)
      .update({ name, father, roll }).then(() => { closePopup(); showStudentList(); });
  }
  window.deleteStudent = function (studentId) {
    if (!confirm("Delete this student?")) return;
    db.collection("years").doc(currentYear).collection("classes").doc(currentClass).collection("sections").doc(currentSection).collection("students").doc(studentId).delete()
      .then(showStudentList);
  }

  // FAB & SETTINGS BUTTON
  function setupFAB() {
    document.getElementById("fab").onclick = () => {};
    document.getElementById("fab").style.display = "none";
  }
  function setupSettingsBtn() {
    document.getElementById("settings-btn").onclick = showSettingsPopup;
  }

  // SETTINGS & ACTIONS POPUP
  function showSettingsPopup() {
    showPopup(`<div class="popup">
      <div style="font-weight:600;color:#0f3d6b;margin-bottom:9px;font-size:1.08em;">Settings & Actions</div>
      <div class="option-row" style="flex-direction:column;gap:11px;">
        <button class="option-btn" onclick="showExamSettingsPopup()">Exam Settings</button>
        <button class="option-btn" onclick="showEnterMarksPopup()">Enter Marks</button>
        <button class="option-btn" onclick="showTimetablePopup()">Enter Timetable</button>
        <button class="option-btn" onclick="downloadProgressCards()">Download Progress Cards (PDF)</button>
        <button class="option-btn" onclick="downloadHallTickets()">Download Hall Tickets (PDF)</button>
        <button class="option-btn" onclick="showPerformanceGraph()">Performance Graph</button>
        <button class="option-btn" onclick="downloadExcel()">Export Class Marks (Excel)</button>
        <button class="option-btn" onclick="showCSVImport()">Import Students (CSV)</button>
        <button class="option-btn" onclick="logout()">Logout</button>
        <button class="option-btn" onclick="closePopup()">Close</button>
      </div>
    </div>`);
  }
  window.logout = function () {
    auth.signOut();
    window.location.href = "index.html";
  }

  // EXAM/MARKS/TIMETABLE POPUPS
  window.showExamSettingsPopup = function () {
    alert('Exam settings popup coming soon (per class).');
  };
  window.showEnterMarksPopup = function () {
    alert('Marks entry popup coming soon (per section, per subject).');
  };
  window.showTimetablePopup = function () {
    alert('Timetable entry popup coming soon (per exam).');
  };

  // PDF/EXCEL/GRAPH/CSV
  window.downloadProgressCards = function () {
    alert('Progress card PDF export coming soon!');
  };
  window.downloadHallTickets = function () {
    alert('Hall ticket PDF export coming soon!');
  };
  window.showPerformanceGraph = function () {
    alert('Performance graph/chart coming soon!');
  };
  window.downloadExcel = function () {
    alert('Excel download coming soon!');
  };
  window.showCSVImport = function () {
    document.getElementById('csvImportInput').click();
  };
  document.getElementById('csvImportInput').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function(ev) {
      let lines = ev.target.result.split(/\r?\n/);
      for (let line of lines) {
        let [roll, name, father] = line.split(',');
        if (roll && name) {
          await addStudent(currentYear, currentClass, currentSection, { name, father, roll });
        }
      }
      alert('Students imported!');
      showStudentList();
    };
    reader.readAsText(file);
  });

