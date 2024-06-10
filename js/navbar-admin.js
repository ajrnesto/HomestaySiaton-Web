import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js';
import { auth, db } from '../js/firebase.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js';
import { generateAvatar } from '../js/utils.js';

const tvEmail = document.querySelector('.dropdown-text-email');
const btnLogout = document.querySelector('#btnLogout');
const navDashboard = document.querySelector('#navDashboard');
const navUnits = document.querySelector('#navUnits');

const navManageHosts = document.querySelector("#navManageHosts");

let authCheckedThisSession = false;

window.addEventListener("load", () => {
	authCheckedThisSession = false;
});

onAuthStateChanged(auth, user => {
	if (!authCheckedThisSession) {
		authCheckedThisSession = true;
	
		if (user) {
			generateAvatar(user.email.toUpperCase());
			tvEmail.textContent = user.email;
		}
	
		restrictNavbarForHosts(user);
	}
});

btnLogout.addEventListener("click", () => {
	signOut(auth);
	window.location = "/login.html";
});

function restrictNavbarForHosts(user) {
	const docRef = doc(db, "users", user.uid);
	getDoc(docRef).then(userSnap => {
		const userType = userSnap.data().userType;

		if (userType == 1) {
			navManageHosts.classList.toggle("d-none", false);
		}
	});
}