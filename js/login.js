import { getAuth, signOut, onAuthStateChanged, signInWithEmailAndPassword, signInWithPhoneNumber, RecaptchaVerifier } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js';
import { app, auth, db } from '../js/firebase.js';
import { doc, getDoc, collection, query, where, getCountFromServer } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js';
import { checkUserTypeThenRedirect, validate, invalidate } from '../js/utils.js';

const divRecaptchaContainer = document.querySelector('#recaptcha-container');
const divForm = document.querySelector('#divForm');
const divVerification = document.querySelector('#divVerification');
const divErrorTooManyRequests = document.querySelector('#divErrorTooManyRequests');

const errLogin = document.querySelector('#errLogin');
const btnLogin = document.querySelector('#btnLogin');
const btnBack = document.querySelector('#btnBack');
const btnVerify = document.querySelector('#btnVerify');
const btnGotoSignup = document.querySelector('#btnGotoSignup');
const btnSkipLogin = document.querySelector('#btnSkipLogin');

const etLoginEmail = document.querySelector('#etLoginEmail');
const etLoginPassword = document.querySelector('#etLoginPassword');
const etOtp = document.querySelector('#etOtp');

const emailValidator = document.querySelectorAll('.email-validator');
const passwordValidator = document.querySelectorAll('.password-validator');
const otpValidator = document.querySelectorAll('.otp-validator');

onAuthStateChanged(auth, user => {
	if (!user) {
		return;
	}

	const docRef = doc(db, "users", user.uid);
	getDoc(docRef).then(userSnap => {
		const userType = userSnap.data().userType;

		if (userType == 1 || userType == 2) {
			window.location = "./units.html";
		}
		else {
			signOut(getAuth());
			window.location = "./login.html";
		}
	});
});

btnBack.addEventListener("click", function() {
	divForm.classList.toggle("d-none", false);
	divRecaptchaContainer.classList.toggle("d-none", true);
	divVerification.classList.toggle("d-none", true);
	etOtp.value = "";
	etLoginEmail.value = "";
})

btnGotoSignup.addEventListener("click", function() {
	window.location = "./signup.html";
});

btnSkipLogin.addEventListener("click", function() {
	window.location = "./login.html";
});

$(document).ready(() => {
	window.recaptchaVerifier = new RecaptchaVerifier(
		'recaptcha-container', {
		'size': 'invisble',
		'callback': () => {
			submitPhoneNumberAuth();
		},
		'expired-callback': () => {
			console.log("CAPTCHA EXPIRED");
		}
		}, auth);
});

function submitPhoneNumberAuth() {
    // We are using the test phone numbers we created before
	// const phoneNumber = '+639763170290';
	const phoneNumber = "+63" + etLoginEmail.value;
    const appVerifier = window.recaptchaVerifier;

	signInWithPhoneNumber(auth, phoneNumber, appVerifier)
    .then(function(confirmationResult) {
    	// SMS sent. Prompt user to type the code from the message, then sign the
    	// user in with confirmationResult.confirm(code).

		divForm.classList.toggle("d-none", true);
		divRecaptchaContainer.classList.toggle("d-none", true);
		divVerification.classList.toggle("d-none", false);

		btnVerify.addEventListener("click", () => {
			confirmationResult.confirm(etOtp.value).then((result) => {
				// User signed in successfully.
				const user = result.user;
				console.log("LOGGED IN AS: "+user);
				validate(otpValidator);
				// ...
			}).catch((error) => {
				// User couldn't sign in (bad verification code?)
				invalidate(otpValidator);
			});
		});
    })
    .catch(function(error) {
    	// Error; SMS not sent
    	// ...
		divForm.classList.toggle("d-none", true);
		divRecaptchaContainer.classList.toggle("d-none", true);
		divVerification.classList.toggle("d-none", true);
		divErrorTooManyRequests.classList.toggle("d-none", false);

        console.log("ERROR: " + error);
    });
}

btnLogin.addEventListener("click", async() => {
	const phone = "+63" + etLoginEmail.value;
	
	const qryUser = query(collection(db, "users"), where("mobile", "==", phone));
	
	const snapshot = await getCountFromServer(qryUser);
	const numberOfItems = snapshot.data().count;

	if (numberOfItems == 0) {
		invalidate(emailValidator);
		return;
	}

	divForm.classList.toggle("d-none", true);
	divRecaptchaContainer.classList.toggle("d-none", false);
	divVerification.classList.toggle("d-none", true);
	validate(emailValidator);

	window.recaptchaVerifier.render().then(function(widgetId) {
		grecaptcha.reset(widgetId);
	});
});

// btnLogin.addEventListener("click", () => {
//     // const email = etLoginEmail.value;
//     // const password = etLoginPassword.value;

//     // signInWithEmailAndPassword(auth, email, password)
//     // .then((userCredential) => {
// 	// 	validate(emailValidator);
// 	// 	validate(passwordValidator);
//     //     errLogin.style.display = "none";
//     //     // let onAuthStateChanged handle the authentication validation
//     // })
//     // .catch((error) => {
//     //     // display error text
// 	// 	invalidate(emailValidator);
// 	// 	invalidate(passwordValidator);
//     //     errLogin.style.display = "block";
//     // });
// });