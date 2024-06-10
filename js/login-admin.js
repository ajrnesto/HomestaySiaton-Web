import { onAuthStateChanged, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js';
import { app, auth, db } from '../js/firebase.js';
import { doc, getDoc, collection, query, where, getCountFromServer } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js';
import { checkUserTypeThenRedirect, validate, invalidate } from '../js/utils.js';

const errLogin = document.querySelector('#errLogin');
const btnLogin = document.querySelector('#btnLogin');
const btnGotoSignup = document.querySelector('#btnGotoSignup');

const etLoginEmail = document.querySelector('#etLoginEmail');
const etLoginPassword = document.querySelector('#etLoginPassword');
const etOtp = document.querySelector('#etOtp');

const emailValidator = document.querySelectorAll('.email-validator');
const passwordValidator = document.querySelectorAll('.password-validator');

onAuthStateChanged(auth, user => {
	if (!user) {
		return;
	}

	const docRef = doc(db, "users", user.uid);
	getDoc(docRef).then(userSnap => {
		const userType = userSnap.data().userType;

		localStorage.setItem("user_type", userType);
		if (userType == 1 || userType == 2) {
			window.location = "./units.html";
			localStorage.setItem("user_uid", user.uid);
		}
		else {
			signOut(getAuth());
			window.location = "./login.html";
		}
	});
});

btnLogin.addEventListener("click", () => {
    const email = etLoginEmail.value;
    const password = etLoginPassword.value;

    signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
		validate(emailValidator);
		validate(passwordValidator);
        errLogin.style.display = "none";
        // let onAuthStateChanged handle the authentication validation
    })
    .catch((error) => {
        // display error text
		invalidate(emailValidator);
		invalidate(passwordValidator);
        errLogin.style.display = "block";
    });
});

btnGotoSignup.addEventListener("click", () => {
	window.location = "./signup.html";
})