import { onAuthStateChanged, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js';
import { app, auth, db } from '../js/firebase.js';
import { doc, getDoc, collection, query, where, getCountFromServer } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js';
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";
import { checkUserTypeThenRedirect, validate, invalidate } from '../js/utils.js';

const errSignup = document.querySelector('#errSignup');
const btnSignup = document.querySelector('#btnSignup');
const btnGotoSignup = document.querySelector('#btnGotoSignup');

const etSignupEmail = document.querySelector('#etSignupEmail');
const etSignupPassword = document.querySelector('#etSignupPassword');

etFirstName
etLastName
etAddressPurok
etAddressBarangay
etAddressMunicipality
etSignupEmail
etSignupPassword

const etOtp = document.querySelector('#etOtp');

const emailValidator = document.querySelectorAll('.email-validator');
const passwordValidator = document.querySelectorAll('.password-validator');

// onAuthStateChanged(auth, user => {
// 	if (!user) {
// 		return;
// 	}

// 	const docRef = doc(db, "users", user.uid);
// 	getDoc(docRef).then(userSnap => {
// 		const userType = userSnap.data().userType;
// 		if (userType == 0) {
// 			window.location = "./signup.html";
// 		}
// 		else if (userType == 1) {
// 			window.location = "./units.html";
// 		}
// 		else if (userType == 2 || userType == 3) {
// 			window.location = "./bookings.html";
// 		}
// 	});
// });

btnSignup.addEventListener("click", () => {
    const email = etSignupEmail.value;
    const password = etSignupPassword.value;

		createUserWithEmailAndPassword(auth, email, password)
		.then((userCredential) => {
			const user = userCredential.user;

			setDoc(doc(db, "users", user.uid), {
				uid: user.uid,
				firstName: etFirstName,
				lastName: etLastName
			});
		})
		.catch((error) => {
			const errorCode = error.code;
			const errorMessage = error.message;
			
			console.log(errorMessage);
		});

    signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
		validate(emailValidator);
		validate(passwordValidator);
        errSignup.style.display = "none";
        // let onAuthStateChanged handle the authentication validation
    })
    .catch((error) => {
        // display error text
		invalidate(emailValidator);
		invalidate(passwordValidator);
        errSignup.style.display = "block";
    });
});

btnGotoSignup.addEventListener("click", () => {
	window.location = "./signup.html";
})