// index.js
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
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

const splash = document.getElementById('splash');
const loginRoot = document.getElementById('login-root'); // Get this only when relevant

function showLoginUI() {
    if (!loginRoot) return; // Should always be true on index.html
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
            <button class="btn-google" onclick="googleSignIn()">
                <i class="fab fa-google" style="margin-right:10px;font-size:1.3em;vertical-align:middle;"></i>
                Sign in with Google
            </button>
        </div>
    `;
    loginRoot.style.display = 'flex';
}

window.emailSignIn = function () {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    if (!email || !password) return alert('Enter email and password!');
    auth.signInWithEmailAndPassword(email, password)
        .then(() => window.location.href = "dashboard.html")
        .catch(err => alert(err.message));
};

window.emailRegister = function () {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    if (!email || !password) return alert('Enter email and password!');
    auth.createUserWithEmailAndPassword(email, password)
        .then(() => {
            alert("Registration successful! You are now signed in.");
            window.location.href = "dashboard.html";
        })
        .catch(err => alert(err.message));
};

window.googleSignIn = function () {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then(() => window.location.href = "dashboard.html")
        .catch(err => alert(err.message));
};

window.forgotPassword = function () {
    const email = document.getElementById('email').value.trim();
    if (!email) return alert('Enter your email to reset password.');
    auth.sendPasswordResetEmail(email)
        .then(() => alert("Password reset email sent."))
        .catch(err => alert(err.message));
};

// Auth state listener specific to index.html
auth.onAuthStateChanged(function (user) {
    if (splash) splash.classList.add('hidden'); // Always hide splash on index.html
    if (user) {
        // User logged in, redirect to dashboard
        console.log("User logged in on index.html, redirecting to dashboard.html...");
        window.location.replace("dashboard.html");
    } else {
        // No user, show login UI
        console.log("No user on index.html, showing login UI.");
        showLoginUI();
    }
});