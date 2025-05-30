// === St. Patrick's School Progress Card App – app.js ===
// --- Insert your Firebase Config below this line ---
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
const provider = new firebase.auth.GoogleAuthProvider();
const db = firebase.firestore();

// === Splash Screen Logic ===
window.onload = function() {
  setTimeout(() => {
    document.getElementById('splash').classList.add('hidden');
    showLoginScreen();
  }, 1500);
};

// === Login Screen Logic ===
function showLoginScreen() {
  document.getElementById("main-area").innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;margin-top:110px;">
      <h2 style="color:#0f3d6b;font-size:2.3em;font-weight:900;letter-spacing:2px;margin-bottom:10px;">
        <span style="color:#e74c3c">S</span><span style="color:#fdc600">t</span><span style="color:#27ae60">.</span>
        <span style="color:#2980b9">P</span><span style="color:#e67e22">a</span><span style="color:#9b59b6">t</span>
        <span style="color:#f39c12">r</span><span style="color:#e84393">i</span><span style="color:#00b894">c</span>
        <span style="color:#fdc600">k</span><span style="color:#27ae60">'</span><span style="color:#2980b9">s</span>
        <span style="color:#e67e22">S</span><span style="color:#9b59b6">c</span><span style="color:#e74c3c">h</span>
        <span style="color:#fdc600">o</span><span style="color:#00b894">o</span><span style="color:#f39c12">l</span>
      </h2>
      <div style="font-size:1.18em;color:#0f3d6b;margin-bottom:18px;font-weight:600;">IIT & NEET FOUNDATION</div>

      <!-- Google Sign-in Button -->
      <button onclick="googleSignIn()" style="font-size:1.21em;padding:11px 39px;border-radius:10px;border:none;background:#0f3d6b;color:#fff;cursor:pointer;box-shadow:1px 2px 8px #bdd5f54d;margin-bottom:25px;">
        <i class="fa fa-google" style="margin-right:10px;"></i>Sign in with Google
      </button>

      <!-- Email Sign-in/Register Form -->
      <div style="background:#f4f8fb;border-radius:12px;padding:25px 30px 16px 30px;box-shadow:1px 1px 10px #0f3d6b22;">
        <input type="email" id="email" placeholder="Email" style="padding:8px 12px;font-size:1em;margin-bottom:12px;width:220px;border-radius:7px;border:1px solid #bbb;display:block;">
        <input type="password" id="password" placeholder="Password" style="padding:8px 12px;font-size:1em;margin-bottom:14px;width:220px;border-radius:7px;border:1px solid #bbb;display:block;">
        <button onclick="emailSignIn()" style="font-size:1em;padding:7px 24px;border-radius:7px;border:none;background:#1877f2;color:#fff;cursor:pointer;margin-right:10px;">
          Sign in with Email
        </button>
        <button onclick="emailRegister()" style="font-size:1em;padding:7px 24px;border-radius:7px;border:none;background:#39ac37;color:#fff;cursor:pointer;">
          Register (New User)
        </button>
      </div>
    </div>
  `;
}
window.googleSignIn = function() {
  auth.signInWithPopup(provider);
};
window.emailSignIn = function() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  auth.signInWithEmailAndPassword(email, password)
    .then(userCredential => {
      showAcademicYearScreen();
    })
    .catch(error => {
      alert("Email Sign-in error: " + error.message);
    });
};
window.emailRegister = function() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
      alert("Registration successful! You are now signed in.");
      showAcademicYearScreen();
    })
    .catch(error => {
      alert("Registration error: " + error.message);
    });
};

// === Auth State Listener ===
auth.onAuthStateChanged(user => {
  if (user) {
    showAcademicYearScreen(); // (Define this function in your code)
  } else {
    showLoginScreen();
  }
});
// === Academic Year Selection ===
let currentYear = null;
let availableYears = [];
async function showAcademicYearScreen() {
  let yearsSnap = await getDocs(collection(db, "years"));
  availableYears = yearsSnap.docs.map(doc => doc.id).sort().reverse();
  let html = `<div class="screen-title">Select Academic Year</div>
    <div style="display:flex;flex-direction:column;align-items:center;margin-top:30px;">`;
  html += availableYears.map(y => `<button class="class-btn" onclick="selectAcademicYear('${y}')">${y}</button>`).join("");
  html += `<button class="fab" onclick="showAddYearPopup()">+</button></div>`;
  document.getElementById("main-area").innerHTML = html;
}
window.selectAcademicYear = function(year) {
  currentYear = year;
  showClassList();
};
window.showAddYearPopup = function() {
  let html = `<div class="popup-bg" id="popup-bg">
    <form class="popup" onsubmit="addYear(event)">
      <label>Academic Year (e.g., 2025-26)</label>
      <input name="year" maxlength="9" required>
      <div class="btn-row">
        <button type="button" class="cancel-btn" onclick="closePopup()">Cancel</button>
        <button>Add</button>
      </div>
    </form>
  </div>`;
  showPopup(html);
};
window.addYear = async function(e) {
  e.preventDefault();
  let val = e.target.year.value.trim();
  if (!val) return;
  await setDoc(doc(db, "years", val), { created: Date.now() });
  closePopup();
  showAcademicYearScreen();
};

// -- CONTINUES IN PART 2/3 --
// === Logout Function ===
window.logout = function() {
  signOut(auth);
  document.getElementById('header').style.display = "none";
};

// === Popup Helpers ===
let lastPopup = null;
function showPopup(html) {
  closePopup();
  let div = document.createElement('div');
  div.innerHTML = html;
  lastPopup = div.firstElementChild;
  document.body.appendChild(lastPopup);
}
function closePopup() {
  if (lastPopup) lastPopup.remove();
  lastPopup = null;
}

// === Class/Section/Student Data (Firestore, per year) ===
let currentClass = null, currentSection = null, currentStudent = null;
let sectionColors = ["#e74c3c","#fdc600","#27ae60","#2980b9","#e67e22","#9b59b6","#f39c12","#e84393","#00b894","#fdc600"];
let classes = [];
let historyStack = [];
let firstLoad = true;

// --- Class List ---
async function showClassList(push=true) {
  document.getElementById('header').style.display = "block";
  document.getElementById('header-year').textContent = currentYear;
  let clsSnap = await getDocs(collection(db, "years", currentYear, "classes"));
  classes = clsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  let html = `<div class="screen-title">Select a Class</div>
    <div class="class-list">`;
  let colors = sectionColors;
  classes.forEach((cls, idx) => {
    let border = colors[idx % colors.length];
    html += `<button class="class-btn" style="border-color:${border};color:${border};"
      onclick="showSectionList('${cls.id}')">${cls.name}</button>`;
  });
  html += '</div>';
  document.getElementById("main-area").innerHTML = html;
  showFAB("+", () => showAddPopup("class"));
  showSettingsBtn(false);
  if (push) pushHistory("classList");
}
window.showSectionList = async function(classId, push=true) {
  currentClass = classes.find(c => c.id === classId);
  let secSnap = await getDocs(collection(db, "years", currentYear, "classes", classId, "sections"));
  currentClass.sections = secSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  let sections = [...currentClass.sections].sort((a, b) => a.name.localeCompare(b.name));
  let html = `<div class="screen-title">${currentClass.name} – Sections</div><div class="section-list">`;
  sections.forEach((sec, idx) => {
    html += `<div class="section-chip" style="border-color:${sectionColors[idx % sectionColors.length]}"
      onclick="showStudentList('${classId}','${sec.id}')">${sec.name}</div>`;
  });
  html += '</div>';
  document.getElementById("main-area").innerHTML = html;
  showFAB("+", () => showAddPopup("section"));
  showSettingsBtn(false);
  if (push) pushHistory("sectionList", classId);
};

window.showStudentList = async function(classId, secId, push=true) {
  currentClass = classes.find(c => c.id === classId);
  currentSection = currentClass.sections.find(s => s.id === secId);
  let stuSnap = await getDocs(collection(db, "years", currentYear, "classes", classId, "sections", secId, "students"));
  currentSection.students = stuSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  let title = `${currentClass.name} – Section ${currentSection.name}`;
  let html = `<div class="screen-title">${title}</div>
    <div class="student-list">`;
  let list = [...currentSection.students];
  list.sort((a, b) => parseInt(a.roll) - parseInt(b.roll));
  list.forEach((stu, idx) => {
    html += `<div class="student-row">
      <span class="roll-no">${stu.roll}.</span> ${stu.name}
      <button onclick="editStudent('${classId}','${secId}','${stu.id}')">Edit</button>
      <button onclick="deleteStudent('${classId}','${secId}','${stu.id}')">Delete</button>
    </div>`;
  });
  html += '</div>';
  document.getElementById("main-area").innerHTML = html;
  showFAB("+", () => showAddPopup("student"));
  showSettingsBtn(true);
  if (push) pushHistory("studentList", classId, secId);
};

// FAB & Settings
function showFAB(label, onClick) {
  let fab = document.getElementById('fab');
  fab.innerHTML = label;
  fab.style.display = "flex";
  fab.onclick = onClick;
}
function showSettingsBtn(show) {
  let btn = document.getElementById('settings-btn');
  btn.style.display = show ? "flex" : "none";
}

// Add Popups for Class/Section/Student
function showAddPopup(type) {
  if (type === "class") {
    let html = `<div class="popup-bg" id="popup-bg">
      <form class="popup" onsubmit="addClass(event)">
        <label>Class Name</label>
        <input name="className" maxlength="20" required>
        <div class="btn-row">
          <button type="button" class="cancel-btn" onclick="closePopup()">Cancel</button>
          <button>Add</button>
        </div>
      </form>
    </div>`;
    showPopup(html);
  } else if (type === "section") {
    let html = `<div class="popup-bg" id="popup-bg">
      <form class="popup" onsubmit="addSection(event)">
        <label>Section Name</label>
        <input name="sectionName" maxlength="15" required>
        <div class="btn-row">
          <button type="button" class="cancel-btn" onclick="closePopup()">Cancel</button>
          <button>Add</button>
        </div>
      </form>
    </div>`;
    showPopup(html);
  } else if (type === "student") {
    let html = `<div class="popup-bg" id="popup-bg">
      <form class="popup" onsubmit="addStudent(event)">
        <label>Student Name</label>
        <input name="studentName" maxlength="35" required>
        <label>Father's Name</label>
        <input name="fatherName" maxlength="35" required>
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
}
window.addClass = async function(e) {
  e.preventDefault();
  let val = e.target.className.value.trim();
  if (!val) return;
  let ref = await addDoc(collection(db, "years", currentYear, "classes"), { name: val });
  closePopup();
  showClassList(false);
};
window.addSection = async function(e) {
  e.preventDefault();
  let val = e.target.sectionName.value.trim();
  if (!val) return;
  let ref = await addDoc(collection(db, "years", currentYear, "classes", currentClass.id, "sections"), { name: val });
  closePopup();
  showSectionList(currentClass.id, false);
};
window.addStudent = async function(e) {
  e.preventDefault();
  const name = e.target.studentName.value.trim();
  const father = e.target.fatherName.value.trim();
  const roll = e.target.rollNo.value.trim();
  if (!name || !father || !roll) return;
  let ref = await addDoc(collection(db, "years", currentYear, "classes", currentClass.id, "sections", currentSection.id, "students"), {
    name, father, roll, marks: {}
  });
  closePopup();
  showStudentList(currentClass.id, currentSection.id, false);
};

window.editStudent = async function(classId, secId, stuId) {
  let stu = currentSection.students.find(s => s.id === stuId);
  let html = `<div class="popup-bg" id="popup-bg">
    <form class="popup" onsubmit="submitEditStudent(event,'${classId}','${secId}','${stuId}')">
      <label>Student Name</label>
      <input name="studentName" value="${stu.name}" required>
      <label>Father's Name</label>
      <input name="fatherName" value="${stu.father}" required>
      <label>Roll Number</label>
      <input name="rollNo" type="number" min="1" max="999" value="${stu.roll}" required>
      <div class="btn-row">
        <button type="button" class="cancel-btn" onclick="closePopup()">Cancel</button>
        <button>Save</button>
      </div>
    </form>
  </div>`;
  showPopup(html);
};
window.submitEditStudent = async function(e, classId, secId, stuId) {
  e.preventDefault();
  const form = e.target;
  await updateDoc(doc(db, "years", currentYear, "classes", classId, "sections", secId, "students", stuId), {
    name: form.studentName.value.trim(),
    father: form.fatherName.value.trim(),
    roll: form.rollNo.value.trim()
  });
  closePopup();
  showStudentList(classId, secId, false);
};
window.deleteStudent = async function(classId, secId, stuId) {
  if (!confirm("Delete this student?")) return;
  await deleteDoc(doc(db, "years", currentYear, "classes", classId, "sections", secId, "students", stuId));
  showStudentList(classId, secId, false);
};

// -- CONTINUES IN PART 3/3 --
// === Settings Popup (Exam/Marks/PDF/Hall Ticket) ===
function showSettingsPopup() {
  let html = `<div class="popup-bg" id="popup-bg">
    <div class="popup">
      <div style="font-weight:600;color:#0f3d6b;margin-bottom:9px;font-size:1.08em;">Settings & Actions</div>
      <div class="option-row" style="flex-direction:column;gap:11px;">
        <button class="option-btn" onclick="showExamSettingsPopup()">Exam Settings</button>
        <button class="option-btn" onclick="showEnterMarksPopup()">Enter Marks</button>
        <button class="option-btn" onclick="alert('PDF and Hall Ticket generation is coming soon!')">Download Class Marks Memos (PDF)</button>
        <button class="option-btn" onclick="alert('Hall Ticket generator coming soon!')">Download Hall Tickets</button>
        <button class="option-btn" onclick="alert('Performance graph coming soon!')">Performance Graph</button>
        <button class="option-btn" onclick="closePopup()">Close</button>
      </div>
    </div>
  </div>`;
  showPopup(html);
}

// --- Placeholder Exam/Marks Logic (you can fill as per your own logic) ---
function showExamSettingsPopup() {
  alert("Exam settings functionality is coming soon!");
}
function showEnterMarksPopup() {
  alert("Marks entry popup is coming soon!");
}

// --- UI Navigation Helpers (History) ---
function pushHistory(screen, ...params) {
  if (!firstLoad) historyStack.push({ screen, params });
  firstLoad = false;
  window.history.pushState({ screen, params }, "");
}
window.onpopstate = function(event) {
  let state = event.state;
  if (state && state.screen) {
    if (state.screen === "classList") showClassList(false);
    else if (state.screen === "sectionList") showSectionList(...state.params, false);
    else if (state.screen === "studentList") showStudentList(...state.params, false);
  } else {
    showClassList(false);
  }
};

// --- Show/Hide FAB and Settings Button on All Screens ---
window.showFAB = showFAB;
window.showSettingsBtn = showSettingsBtn;

// === END OF APP.JS ===
