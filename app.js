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
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();

const isLoginPage = window.location.pathname.includes("index.html") || window.location.pathname.endsWith("/"); // For login page

// =====================
// === PART 1: LOGIN (index.html) ===
// =====================
if (isLoginPage) {
  // Hide splash, show login after splash timer
  window.onload = function() {
    setTimeout(() => {
      let splash = document.getElementById('splash');
      if (splash) splash.style.display = 'none';
      let title = document.getElementById('main-title');
      let loginBox = document.getElementById('main-login');
      if (title) title.style.display = '';
      if (loginBox) loginBox.style.display = '';
    }, 1800);
  };

  // Google Sign-In
  document.getElementById("googleSignIn").onclick = function() {
    auth.signInWithPopup(provider)
      .then(() => {
        window.location.href = "dashboard.html";
      })
      .catch(error => {
        document.getElementById("loginError").innerText = error.message;
      });
  };

  // Email/Password Sign-In
  document.getElementById("emailSignIn").onclick = function() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        window.location.href = "dashboard.html";
      })
      .catch(error => {
        document.getElementById("loginError").innerText = error.message;
      });
  };

  // Register New User
  document.getElementById("registerBtn").onclick = function() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    auth.createUserWithEmailAndPassword(email, password)
      .then(() => {
        window.location.href = "dashboard.html";
      })
      .catch(error => {
        document.getElementById("loginError").innerText = error.message;
      });
  };
}

// ============================
// === PART 2: DASHBOARD (dashboard.html) ===
// ============================
if (window.location.pathname.includes("dashboard.html")) {
  let currentUser = null;
  // On page load, check auth state
  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = "index.html";
    } else {
      currentUser = user;
      setupDashboard();
    }
  });

  function setupDashboard() {
    // Show header and logout
    document.getElementById('header').style.display = "";
    document.getElementById('logoutBtn').onclick = function() {
      auth.signOut().then(() => {
        window.location.href = "index.html";
      });
    };
    // Show class selection by default
    showClassButtons();
    // Hide fab/settings (show when needed)
    document.getElementById('fab').style.display = "none";
    document.getElementById('settings-btn').style.display = "none";
  }

  // === Show Class Buttons (Dashboard) ===
  function showClassButtons() {
    const classNames = [
      "Nursery","LKG","UKG","1","2","3","4","5","6","7","8","9","10"
    ];
    const classBtnColors = [
      "#e53935","#fbc02d","#43a047","#1e88e5","#8e24aa","#fb8c00","#e91e63",
      "#43a047","#fbc02d","#1e88e5","#e53935","#0f3d6b","#fb8c00"
    ];
    let html = '';
    classNames.forEach((cls, i) => {
      html += `<button class="class-btn" style="border-color:${classBtnColors[i]};color:${classBtnColors[i]};" data-class="${cls}">${cls}</button>`;
    });
    document.querySelector(".class-buttons").innerHTML = html;
    // Add click handlers for each button
    document.querySelectorAll(".class-btn").forEach(btn => {
      btn.onclick = function() {
        alert("You clicked class: " + btn.dataset.class + ". (Continue with section popup/logic here.)");
        // In next steps, open section popup for that class
      }
    });
  }

  // === FAB & Settings Buttons (Demo) ===
  document.getElementById('fab').onclick = function() {
    alert("Add button clicked! (Add section/student logic goes here.)");
  };
  document.getElementById('settings-btn').onclick = function() {
    alert("Settings clicked! (Settings popup goes here.)");
  };
}

