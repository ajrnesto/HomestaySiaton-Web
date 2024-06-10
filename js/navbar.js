import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js';
import { db, auth } from '../js/firebase.js';
import { generateAvatar, showElement, hideElement } from '../js/utils.js';

const btnShop = document.querySelector('#btnShop');
const btnTrackBookings = document.querySelector('#btnTrackBookings');
const btnCart = document.querySelector('#btnCart');
const btnAvatar = document.querySelector('#btnAvatar');
const btnLoginOrSignup = document.querySelector('#btnLoginOrSignup');
const btnTrackBookingsListItem = document.querySelector('.nav-btn-track-bookings');
const btnCartListItem = document.querySelector('.nav-btn-cart');
const btnAvatarListItem = document.querySelector('.nav-btn-avatar');
const btnLoginOrSignupListItem = document.querySelector('.nav-btn-login-or-signup');
const tvEmail = document.querySelector('#tvEmail');
const btnLogout = document.querySelector('#btnLogout');

window.addEventListener("load", () => {
});

onAuthStateChanged(auth, user => {
	const USER_EXISTS = user;

	if (USER_EXISTS) {
		// check user type
		getDoc(doc(db, "users", user.uid)).then(userSnap => {
			const CUSTOMER = 0;
			const ADMIN = 1;
			const userType = userSnap.data().userType;

			if (userType == ADMIN) {
				window.location = "./admin/dashboard.html";
			}
			else if (userType == CUSTOMER) {
				showElement(btnTrackBookingsListItem);
				showElement(btnCartListItem);
				showElement(btnAvatarListItem);
				hideElement(btnLoginOrSignupListItem);
				if (user.displayName != null) {
					generateAvatar(user.displayName.toUpperCase());
					tvEmail.textContent = user.displayName;
				}
				else {
					generateAvatar("?");
					tvEmail.textContent = user.phoneNumber;
				}
			}
		});
	}
	else {
		hideElement(btnTrackBookingsListItem);
		hideElement(btnCartListItem);
		hideElement(btnAvatarListItem);
		showElement(btnLoginOrSignupListItem);
	}
});

btnLogout.addEventListener("click", () => {
	signOut(auth);
	window.location = "./login.html";
});

btnLoginOrSignup.addEventListener("click", () => {
	window.location = "./login.html";
});