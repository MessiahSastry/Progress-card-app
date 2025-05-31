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

// -- D A S H B O A R D  L O G I C  --
const academicYear = localStorage.getItem('academicYear') || "2024-25"; // Default/fake year
const classNames = [
  "Nursery","LKG","UKG",
  "1st","2nd","3rd","4th","5th","6th","7th","8th","9th","10th"
];
const classColors = [0,1,2,3,4,5,6,7,8,9,0,1,2]; // Repeat cycle for CSS .cX

const classListDiv = document.getElementById('class-list');
const fab = document.getElementById('fab');
const settingsBtn = document.getElementById('settings-btn');
const popupBg = document.getElementById('popup-bg');
const popup = document.getElementById('popup');

// --- Render Classes ---
function renderClasses() {
  classListDiv.innerHTML = "";
  classNames.forEach((c, idx) => {
    let btn = document.createElement('button');
    btn.className = `class-btn c${classColors[idx % 10]}`;
    btn.innerText = c;
    // Optional: Add click action here to navigate to sections/students
    classListDiv.appendChild(btn);
  });
}

// --- Floating + Button: Add Class ---
fab.onclick = function() {
  showPopup(`
    <div>
      <div style="font-weight:bold;font-size:1.13em;margin-bottom:10px;">Add New Class</div>
      <form onsubmit="return false;">
        <input id="newClassName" placeholder="Class Name (e.g., 11th)" maxlength="10">
        <div class="btn-row">
          <button type="button" class="cancel-btn" onclick="hidePopup()">Cancel</button>
          <button onclick="addNewClass()">Add</button>
        </div>
      </form>
    </div>
  `);
};
window.addNewClass = function() {
  const val = document.getElementById('newClassName').value.trim();
  if (!val) return;
  db.collection("years")
    .doc(academicYear)
    .collection("classes")
    .doc(val)
    .set({ created: Date.now() })
    .then(() => {
      classNames.push(val);
      renderClasses();
      hidePopup();
    });
};

// --- Settings Button ---
settingsBtn.onclick = function() {
  showPopup(`
    <div>
      <div style="font-weight:bold;font-size:1.17em;margin-bottom:15px;">Settings</div>
      <button style="margin-bottom:14px;width:96%" onclick="showAddYear()">Add Academic Year</button>
      <button style="margin-bottom:10px;width:96%" onclick="logout()">Logout</button>
      <button class="cancel-btn" style="width:96%" onclick="hidePopup()">Close</button>
    </div>
  `);
};
window.showAddYear = function() {
  popup.innerHTML = `
    <div>
      <div style="font-weight:bold;font-size:1.12em;margin-bottom:13px;">Add Academic Year</div>
      <form onsubmit="return false;">
        <input id="newYearInput" placeholder="e.g., 2025-26" maxlength="9">
        <div class="btn-row">
          <button type="button" class="cancel-btn" onclick="hidePopup()">Cancel</button>
          <button onclick="addAcademicYear()">Add</button>
        </div>
      </form>
    </div>
  `;
};
window.addAcademicYear = function() {
  const val = document.getElementById('newYearInput').value.trim();
  if (!val) return;
  db.collection("years").doc(val).set({ created: Date.now() }).then(()=>{
    localStorage.setItem('academicYear', val);
    hidePopup();
    alert("Year Added! Now using " + val);
    // Optionally, you could re-render or reload the page.
  });
};

window.logout = function() {
  firebase.auth().signOut().then(() => {
    location.href = "index.html";
  });
};

// --- Popups ---
function showPopup(html) {
  popup.innerHTML = html;
  popupBg.classList.remove('hidden');
}
function hidePopup() {
  popupBg.classList.add('hidden');
  popup.innerHTML = '';
}

// --- Initial Render ---
renderClasses();
