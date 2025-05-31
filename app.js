// ====== Splash/Login (index.html) ======
window.onload = function () {
  setTimeout(() => {
    var splash = document.getElementById('splash');
    if (splash) splash.style.display = "none";
    var loginRoot = document.getElementById('login-root');
    if (loginRoot) {
      loginRoot.style.display = "flex";
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
          <button class="btn-google" onclick="googleSignIn()"><i class="fab fa-google"></i>Sign in with Google</button>
        </div>
      `;
    }
  }, 1200);
};

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

// ==== Auth Functions ====
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

// ===== Dashboard Auth Check (for dashboard.html) =====
if (window.location.pathname.includes('dashboard.html')) {
  firebase.auth().onAuthStateChanged(function(user) {
    if (!user) {
      window.location.href = "index.html";
    } else {
      // Proceed to dashboard after login
      dashboardInit();
    }
  });
}

// ========== GLOBAL STATE ==========
let academicYear = null;
let yearsList = [];
let classes = [];
let colorPalette = [
  "#e74c3c", "#fdc600", "#27ae60", "#2980b9", "#e67e22",
  "#9b59b6", "#f39c12", "#e84393", "#00b894", "#fdc600"
];

// ----------- DASHBOARD NAVIGATION STATE (for proper back) -----------
let currentScreen = "classList";
let currentParams = [];
function pushDashboardState(screen, params = []) {
  currentScreen = screen;
  currentParams = params;
  window.history.pushState({ dashboard: true, screen, params }, "");
}

// =================== DASHBOARD ===================
function dashboardInit() {
  // Splash, then load years
  showSplashThen(loadAcademicYears);

  // FAB and settings events
  document.getElementById('fab').onclick = showAddClassPopup;
  document.getElementById('settings-btn').onclick = showSettingsPopup;

  // Back navigation
  window.onpopstate = function(event) {
    const state = event.state;
    if (state && state.dashboard) {
      if (state.screen === "classList") {
        showDashboard(false);
      } else if (state.screen === "sectionList") {
        renderSectionList(...state.params, false);
      } else if (state.screen === "studentList") {
        renderStudentList(...state.params, false);
      }
    } else {
      // If state lost, stay at dashboard root
      pushDashboardState("classList");
      showDashboard(false);
    }
  };
}

// ====== SPLASH SCREEN ======
function showSplashThen(cb) {
  const splash = document.getElementById('splash');
  if (splash) splash.classList.remove('hidden');
  setTimeout(() => {
    if (splash) splash.classList.add('hidden');
    cb && cb();
  }, 900);
}

// ====== YEAR LOADING / CHOOSING ======
function loadAcademicYears() {
  db.collection('years').orderBy('name', 'desc').get().then(snap => {
    yearsList = [];
    snap.forEach(doc => yearsList.push(doc.id));
    if (yearsList.length > 0) {
      academicYear = localStorage.getItem('sp_selectedYear') || yearsList[0];
      showDashboard();
    } else {
      // First run: no years in DB, ask to create
      showAddYearPopup();
    }
  });
}

// ==== UI: MAIN DASHBOARD =====
function showDashboard(push=true) {
  document.getElementById('header-exam').textContent = academicYear || '';
  db.collection('years').doc(academicYear).collection('classes').orderBy('order','asc').get()
    .then(snap => {
      classes = [];
      snap.forEach(doc => classes.push({id: doc.id, ...doc.data()}));
      renderClassList(push);
    });
}

function renderClassList(push=true) {
  let html = `<div class="screen-title">Select a Class</div>
  <div class="class-list">`;
  const defaultClasses = [
    "Nursery","LKG","UKG","1st","2nd","3rd","4th","5th",
    "6th","7th","8th","9th","10th"
  ];
  let classesToShow = defaultClasses.map((name, i) => {
    let found = classes.find(c => c.name === name);
    return found || {name, id: null, order: i};
  });
  classesToShow.forEach((cls, idx) => {
    let color = colorPalette[idx % colorPalette.length];
    html += `<button class="class-btn" style="border-color:${color};color:${color};"
      onclick="showSections('${cls.id}', '${cls.name}', true)">${cls.name}</button>`;
  });
  html += "</div>";
  document.getElementById("main-area").innerHTML = html;
  document.getElementById('fab').onclick = showAddClassPopup;
  document.getElementById('fab').innerHTML = "+";
  document.getElementById('fab').style.display = "flex";
  document.getElementById('settings-btn').style.display = "flex";
  if (push) pushDashboardState("classList");
}

// ==== ADD CLASS POPUP ====
function showAddClassPopup() {
  let html = `
  <div class="popup-bg" id="popup-bg">
    <form class="popup" onsubmit="addClassToDB(event)">
      <label>Class Name</label>
      <input name="className" maxlength="12" required placeholder="e.g., 9th">
      <div class="btn-row">
        <button type="button" class="cancel-btn" onclick="closePopup()">Cancel</button>
        <button>Add</button>
      </div>
    </form>
  </div>`;
  showPopup(html);
}
window.addClassToDB = function(e) {
  e.preventDefault();
  const name = e.target.className.value.trim();
  if (!name) return;
  const order = [
    "Nursery","LKG","UKG","1st","2nd","3rd","4th","5th",
    "6th","7th","8th","9th","10th"
  ].indexOf(name);
  db.collection('years').doc(academicYear).collection('classes').add({name, order})
    .then(() => {
      closePopup();
      showDashboard();
    });
};

// ======== SECTION SCREEN ========
window.showSections = function(classId, className, push=true) {
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
        secSnap.forEach(sec => sections.push({id: sec.id, ...sec.data()}));
        renderSectionList(classDoc.id, className, sections, push);
      });
    });
};
function renderSectionList(classId, className, sections, push=true) {
  let html = `<div class="screen-title">${className} – Sections</div>
    <div class="section-list">`;
  sections.forEach((sec, idx) => {
    let color = colorPalette[idx % colorPalette.length];
    html += `<div class="section-chip" style="border-color:${color}"
      onclick="showStudents('${classId}','${sec.id}','${className}','${sec.name}', true)">${sec.name}</div>`;
  });
  html += "</div>";
  document.getElementById("main-area").innerHTML = html;
  document.getElementById('fab').onclick = function() { showAddSectionPopup(classId); };
  document.getElementById('fab').innerHTML = "+";
  if (push) pushDashboardState("sectionList", [classId, className, sections]);
}
function showAddSectionPopup(classId) {
  let html = `
  <div class="popup-bg" id="popup-bg">
    <form class="popup" onsubmit="addSectionToDB(event, '${classId}')">
      <label>Section Name</label>
      <input name="sectionName" maxlength="6" required placeholder="e.g., A">
      <div class="btn-row">
        <button type="button" class="cancel-btn" onclick="closePopup()">Cancel</button>
        <button>Add</button>
      </div>
    </form>
  </div>`;
  showPopup(html);
}
window.addSectionToDB = function(e, classId) {
  e.preventDefault();
  const name = e.target.sectionName.value.trim();
  if (!name) return;
  db.collection('years').doc(academicYear).collection('classes').doc(classId)
    .collection('sections').add({name})
    .then(() => {
      closePopup();
      window.showSections(classId, "", true);
    });
};

// ======== STUDENTS SCREEN ========
window.showStudents = function(classId, sectionId, className, sectionName, push=true) {
  db.collection('years').doc(academicYear).collection('classes').doc(classId)
    .collection('sections').doc(sectionId).collection('students').orderBy('roll').get()
    .then(snap => {
      let students = [];
      snap.forEach(doc => students.push({id: doc.id, ...doc.data()}));
      renderStudentList(classId, sectionId, className, sectionName, students, push);
    });
};
function renderStudentList(classId, sectionId, className, sectionName, students, push=true) {
  let html = `<div class="screen-title">${className} – Section ${sectionName}</div>
    <div class="student-list">`;
  students.forEach(stu => {
    html += `<div class="student-row"><span class="roll-no">${stu.roll}.</span> ${stu.name}</div>`;
  });
  html += "</div>";
  document.getElementById("main-area").innerHTML = html;
  document.getElementById('fab').onclick = function() { showAddStudentPopup(classId, sectionId); };
  document.getElementById('fab').innerHTML = "+";
  if (push) pushDashboardState("studentList", [classId, sectionId, className, sectionName, students]);
}
function showAddStudentPopup(classId, sectionId) {
  let html = `
  <div class="popup-bg" id="popup-bg">
    <form class="popup" onsubmit="addStudentToDB(event, '${classId}', '${sectionId}')">
      <label>Student Name</label>
      <input name="studentName" maxlength="40" required>
      <label>Father's Name</label>
      <input name="fatherName" maxlength="40" required>
      <label>Roll Number</label>
      <input name="rollNo" type="number" min="1" max="999" required>
      <div class="btn-row">
        <button type="button" class="cancel-btn" onclick="closePopup()">Cancel</button>
        <button>Add</button>
      </div>
    </form>
  </div>`;
  showPopup(html);
}
window.addStudentToDB = function(e, classId, sectionId) {
  e.preventDefault();
  const name = e.target.studentName.value.trim();
  const father = e.target.fatherName.value.trim();
  const roll = e.target.rollNo.value.trim();
  if (!name || !father || !roll) return;
  db.collection('years').doc(academicYear).collection('classes').doc(classId)
    .collection('sections').doc(sectionId).collection('students')
    .add({name, father, roll})
    .then(() => {
      closePopup();
      window.showStudents(classId, sectionId, "", "", true);
    });
};

// ====== SETTINGS POPUP ======
function showSettingsPopup() {
  let html = `
    <div class="popup-bg" id="popup-bg">
      <div class="popup">
        <div style="font-weight:600;color:#0f3d6b;margin-bottom:12px;font-size:1.08em;">Settings & Actions</div>
        <div class="option-row" style="flex-direction:column;gap:14px;">
          <button class="option-btn" onclick="showAddYearPopup()">Add Academic Year</button>
          <button class="option-btn" onclick="logout()">Logout</button>
          <button class="option-btn" onclick="closePopup()">Close</button>
        </div>
      </div>
    </div>
  `;
  showPopup(html);
}

// ====== ADD YEAR POPUP ======
function showAddYearPopup() {
  let html = `
    <div class="popup-bg" id="popup-bg">
      <form class="popup" onsubmit="addAcademicYear(event)">
        <label>Academic Year</label>
        <input name="yearName" required placeholder="e.g., 2024-25" maxlength="10">
        <div class="btn-row">
          <button type="button" class="cancel-btn" onclick="closePopup()">Cancel</button>
          <button>Add</button>
        </div>
      </form>
    </div>
  `;
  showPopup(html);
}
window.addAcademicYear = function(e) {
  e.preventDefault();
  const year = e.target.yearName.value.trim();
  if (!year) return;
  db.collection('years').doc(year).set({name: year})
    .then(() => {
      closePopup();
      academicYear = year;
      localStorage.setItem('sp_selectedYear', year);
      showDashboard();
    });
};

// ====== LOGOUT ======
window.logout = function() {
  auth.signOut().then(() => {
    window.location.href = "index.html";
  });
};

// ====== POPUP UTIL ======
function closePopup() {
  const popup = document.getElementById('popup-bg');
  if (popup) popup.remove();
}
function showPopup(html) {
  closePopup();
  let div = document.createElement('div');
  div.innerHTML = html;
  document.body.appendChild(div.firstElementChild);
}
