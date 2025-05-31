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

// ======== Dashboard logic (unchanged, as before) ========
if (window.location.pathname.includes("dashboard.html")) {
  firebase.auth().onAuthStateChanged(user => {
    if (!user) window.location.href = "index.html";
    else initDashboard(user);
  });

  let currentYear = "2024-25";
  let currentClass = null;
  let currentSection = null;
  let mainArea = document.getElementById('main-area');

  function initDashboard(user) {
    document.getElementById("header").style.display = "block";
    showClassList();
    document.getElementById("fab").style.display = "flex";
    document.getElementById("fab").onclick = showAddClassPopup;
    document.getElementById("settings-btn").style.display = "flex";
    document.getElementById("settings-btn").onclick = () => alert('Settings coming soon!');
  }

  // 1. Show all classes
  async function showClassList() {
    currentClass = null; currentSection = null;
    let snap = await firebase.firestore().collection("years").doc(currentYear).collection("classes").get();
    let classes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    mainArea.innerHTML = `
      <div class="screen-title">Select a Class</div>
      <div class="class-list">
        ${classes.map(c => `<button class="class-btn" onclick="setClass('${c.id}')">${c.name}</button>`).join("")}
      </div>
    `;
    document.getElementById("fab").onclick = showAddClassPopup;
  }
  window.setClass = function (classId) {
    currentClass = classId;
    showSectionList();
  };

  // 2. Show all sections in class
  async function showSectionList() {
    currentSection = null;
    let snap = await firebase.firestore().collection("years").doc(currentYear).collection("classes").doc(currentClass).collection("sections").get();
    let sections = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    mainArea.innerHTML = `
      <div class="screen-title">Sections</div>
      <div class="section-list">
        ${sections.map(s => `<div class="section-chip" onclick="setSection('${s.id}')">${s.name}</div>`).join("")}
      </div>
    `;
    document.getElementById("fab").onclick = showAddSectionPopup;
  }
  window.setSection = function (sectionId) {
    currentSection = sectionId;
    showStudentList();
  };

  // 3. Show students in section
  async function showStudentList() {
    let snap = await firebase.firestore().collection("years").doc(currentYear).collection("classes").doc(currentClass).collection("sections").doc(currentSection).collection("students").get();
    let students = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    mainArea.innerHTML = `
      <div class="screen-title">Students</div>
      <div class="student-list">
        ${students.map(stu => `
          <div class="student-row">
            <span><b>${stu.roll || ''}</b> ${stu.name || ''}</span>
            <button onclick="editStudent('${stu.id}')">Edit</button>
            <button onclick="deleteStudent('${stu.id}')">Delete</button>
          </div>
        `).join("")}
      </div>
    `;
    document.getElementById("fab").onclick = showAddStudentPopup;
  }

  // ADD/EDIT POPUPS
  function showAddClassPopup() {
    showPopup(`<form class="popup" onsubmit="submitAddClass(event)">
      <label>Class Name</label>
      <input name="className" maxlength="20" required>
      <div class="btn-row">
        <button type="button" class="cancel-btn" onclick="closePopup()">Cancel</button>
        <button>Add</button>
      </div>
    </form>`);
  }
  window.submitAddClass = function (e) {
    e.preventDefault();
    let val = e.target.className.value.trim();
    if (!val) return;
    firebase.firestore().collection("years").doc(currentYear).collection("classes").add({ name: val }).then(() => {
      closePopup();
      showClassList();
    });
  };

  function showAddSectionPopup() {
    showPopup(`<form class="popup" onsubmit="submitAddSection(event)">
      <label>Section Name</label>
      <input name="sectionName" maxlength="20" required>
      <div class="btn-row">
        <button type="button" class="cancel-btn" onclick="closePopup()">Cancel</button>
        <button>Add</button>
      </div>
    </form>`);
  }
  window.submitAddSection = function (e) {
    e.preventDefault();
    let val = e.target.sectionName.value.trim();
    if (!val) return;
    firebase.firestore().collection("years").doc(currentYear).collection("classes").doc(currentClass).collection("sections").add({ name: val }).then(() => {
      closePopup();
      showSectionList();
    });
  };

  function showAddStudentPopup() {
    showPopup(`<form class="popup" onsubmit="submitAddStudent(event)">
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
    </form>`);
  }
  window.submitAddStudent = function (e) {
    e.preventDefault();
    let name = e.target.studentName.value.trim();
    let father = e.target.fatherName.value.trim();
    let roll = e.target.rollNo.value.trim();
    if (!name || !father || !roll) return;
    firebase.firestore().collection("years").doc(currentYear).collection("classes").doc(currentClass).collection("sections").doc(currentSection).collection("students").add({ name, father, roll }).then(() => {
      closePopup();
      showStudentList();
    });
  };

  // Edit/Delete Student
  window.editStudent = function (studentId) {
    firebase.firestore().collection("years").doc(currentYear).collection("classes").doc(currentClass).collection("sections").doc(currentSection).collection("students").doc(studentId).get().then(doc => {
      let s = doc.data();
      showPopup(`<form class="popup" onsubmit="submitEditStudent(event, '${studentId}')">
        <label>Student Name</label>
        <input name="studentName" value="${s.name}" required>
        <label>Father's Name</label>
        <input name="fatherName" value="${s.father}" required>
        <label>Roll Number</label>
        <input name="rollNo" type="number" value="${s.roll}" required>
        <div class="btn-row">
          <button type="button" class="cancel-btn" onclick="closePopup()">Cancel</button>
          <button>Save</button>
        </div>
      </form>`);
    });
  }
  window.submitEditStudent = function (e, studentId) {
    e.preventDefault();
    let name = e.target.studentName.value.trim();
    let father = e.target.fatherName.value.trim();
    let roll = e.target.rollNo.value.trim();
    firebase.firestore().collection("years").doc(currentYear).collection("classes").doc(currentClass).collection("sections").doc(currentSection).collection("students").doc(studentId)
      .update({ name, father, roll }).then(() => { closePopup(); showStudentList(); });
  }
  window.deleteStudent = function (studentId) {
    if (!confirm("Delete this student?")) return;
    firebase.firestore().collection("years").doc(currentYear).collection("classes").doc(currentClass).collection("sections").doc(currentSection).collection("students").doc(studentId).delete()
      .then(showStudentList);
  }

  // POPUP HELPERS
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

  // LOGOUT
  window.logout = function () {
    firebase.auth().signOut();
    window.location.href = "index.html";
  }
}
