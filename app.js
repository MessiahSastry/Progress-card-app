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

document.addEventListener("DOMContentLoaded", function() {
  // Splash logic
  setTimeout(() => {
    document.getElementById('splash').classList.add('splash-hide');
    setTimeout(() => {
      const loginOuter = document.getElementById('loginOuter');
      loginOuter.style.transition = "opacity 1s";
      loginOuter.style.opacity = 1;
      attachLoginEvents(); // Attach listeners only after login is shown!
    }, 600);
  }, 1600);

  function attachLoginEvents() {
    // Make sure elements exist before adding listeners!
    const googleBtn = document.getElementById("googleSignIn");
    const emailBtn = document.getElementById("emailSignIn");
    const registerBtn = document.getElementById("registerBtn");
    const errorBox = document.getElementById("loginError");

    if (!googleBtn || !emailBtn || !registerBtn) return;

    googleBtn.onclick = function() {
      auth.signInWithPopup(provider)
        .then(() => {
          window.location.href = "dashboard.html";
        })
        .catch(error => {
          errorBox.innerText = error.message;
        });
    };
    emailBtn.onclick = function() {
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      auth.signInWithEmailAndPassword(email, password)
        .then(() => {
          window.location.href = "dashboard.html";
        })
        .catch(error => {
          errorBox.innerText = error.message;
        });
    };
    registerBtn.onclick = function() {
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      auth.createUserWithEmailAndPassword(email, password)
        .then(() => {
          window.location.href = "dashboard.html";
        })
        .catch(error => {
          errorBox.innerText = error.message;
        });
    };
  }
});
