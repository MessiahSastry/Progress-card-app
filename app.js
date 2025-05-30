// --- Firebase Config ---
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

const isLoginPage = window.location.pathname.includes("index.html") || window.location.pathname.endsWith("/");

if (isLoginPage) {
  function setupLoginListeners() {
    document.getElementById("googleSignIn").onclick = function() {
      auth.signInWithPopup(provider)
        .then(() => {
          window.location.href = "dashboard.html";
        })
        .catch(error => {
          document.getElementById("loginError").innerText = error.message;
        });
    };
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

  window.onload = function() {
    setTimeout(() => {
      document.getElementById('splash').classList.add('splash-hide');
      setTimeout(() => {
        document.getElementById('loginOuter').style.transition = "opacity 1s";
        document.getElementById('loginOuter').style.opacity = 1;
        // Most important: attach listeners AFTER login box is shown!
        setupLoginListeners();
      }, 600);
    }, 1600);
  };
}
