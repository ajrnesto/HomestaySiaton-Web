import { db, auth, storage } from '../js/firebase.js';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut  } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js';
import { doc, collection, collectionGroup, addDoc, setDoc, getDoc, getDocs, deleteDoc, updateDoc, increment, query, where, orderBy, startAt, endAt, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js';
import { ref as sRef, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-storage.js";
import { showModal, hideModal, resetValidation, invalidate } from '../js/utils.js';

const tbodyUsers = document.querySelector("#tbodyUsers");
const tvEmptyMessage = document.querySelector("#tvEmptyMessage");
const btnSearchUser = document.querySelector("#btnSearchUser");
const etFilterFirstName = document.querySelector("#etFilterFirstName");
const etFilterLastName = document.querySelector("#etFilterLastName");
const btnClearFilter = document.querySelector("#btnClearFilter");
const btnOpenAddHostModal = document.querySelector("#btnOpenAddHostModal");

const imgId = document.querySelector("#imgId");
// new host modal
const etFirstName = document.querySelector("#etFirstName");
const etLastName = document.querySelector("#etLastName");
const etMobile = document.querySelector("#etMobile");
const etEmail = document.querySelector("#etEmail");
const etPassword = document.querySelector("#etPassword");
const btnPasswordToggle = document.querySelector("#btnPasswordToggle");
const btnAddHost = document.querySelector("#btnAddHost");
// new host modal validators
const firstNameValidator = document.querySelectorAll('.first-name-validator');
const lastNameValidator = document.querySelectorAll('.last-name-validator');
const mobileValidator = document.querySelectorAll('.mobile-validator');
const emailValidator = document.querySelectorAll('.email-validator');
const passwordValidator = document.querySelectorAll('.password-validator');

window.addEventListener("load", function() {
	getUsersData("", "");
});

btnSearchUser.addEventListener("click", function() {
	getUsersData();
});

btnClearFilter.addEventListener("click", function() {
	etFilterFirstName.value = "";
	etFilterLastName.value = "";
	getUsersData();
});

btnOpenAddHostModal.addEventListener("click", function() {
	etPassword.value = generatePassword();
});

btnPasswordToggle.addEventListener("click", function() {
	if (etPassword.type == "password") {
		etPassword.type = "text";
	}
	else  {
		etPassword.type = "password";
	}
});

btnAddHost.addEventListener("click", function() {
	validateRegistrationForm();
});

function validateRegistrationForm() {
	const firstName = etFirstName.value;
	const lastName = etLastName.value;
	const mobile = etMobile.value;
	const email = etEmail.value;
	const password = etPassword.value;

	if (!firstName) {
		invalidate(firstNameValidator);
		return;
	}
	resetValidation(firstNameValidator);
	if (!lastName) {
		invalidate(lastNameValidator);
		return;
	}
	resetValidation(lastNameValidator);
	if (!mobile) {
		invalidate(mobileValidator);
		return;
	}
	resetValidation(mobileValidator);
	if (!email || !validateEmail(email)) {
		invalidate(emailValidator);
		return;
	}
	resetValidation(emailValidator);
	if (!password || password.length < 6) {
		invalidate(passwordValidator);
		return;
	}
	resetValidation(passwordValidator);

	createUserWithEmailAndPassword(getAuth(), email, password).then((userCredential) => {
		// Signed up 
		const user = userCredential.user;

		const userRef = doc(db, "users", user.uid);
		setDoc((userRef), {
			id: user.uid,
			firstName: firstName,
			lastName: lastName,
			firstNameCaps: firstName.toUpperCase(),
			lastNameCaps: lastName.toUpperCase(),
			mobile: mobile,
			email: email,
			password: password,
			userType: 2
		}).then(() => {
			signOut(auth);
			signInWithEmailAndPassword(auth, "homestay-siaton@gmail.com", "homestay")
			.then((userCredential) => {
				const user = userCredential.user;
				console.log("Logged in as: " + user.email);
				hideModal("#modalManageHost");
			})
			.catch((error) => {
				console.log("Error " + error.code + ". " + error.message);
			});
		});
	})
  .catch((error) => {
		console.log("Error " + error.code + ". " + error.message);
  });
}

function getUsersData() {
	let qryUsers = null;

	const filterFirstName = etFilterFirstName.value;
	const filterLastName = etFilterLastName.value;
	
	if (!filterFirstName && !filterLastName) {
		qryUsers = query(collection(db, "users"), where("userType", "==", 2));	
	}
	else if (filterFirstName && !filterLastName) {
		qryUsers = query(collection(db, "users"), where("firstName", "==", filterFirstName), where("userType", "==", 2));	
	}
	else if (!filterFirstName && filterLastName) {
		qryUsers = query(collection(db, "users"), where("lastName", "==", filterLastName), where("userType", "==", 2));	
	}
	else if (filterFirstName && filterLastName) {
		qryUsers = query(collection(db, "users"), where("firstName", "==", filterFirstName), where("lastName", "==", filterLastName), where("userType", "==", 2));	
	}
	
	onSnapshot(qryUsers, (users) => {
		// clear table
		tbodyUsers.innerHTML = '';

		if (users.size == 0) {
			tvEmptyMessage.classList.toggle("d-none", false);
		}
		else {
			tvEmptyMessage.classList.toggle("d-none", true);
		}
			
		users.forEach(user => {
			if (user.data().userType != 1) {
				renderUsers(
					user.id,
					user.data().uidReadable,
					user.data().idFileName,
					user.data().firstName,
					user.data().lastName,
					user.data().mobile,
					user.data().email,
					user.data().password,
					user.data().blocked,
					user.data().isVerified
				);
			}
		});
	});
}

function renderUsers(id, uidReadable, idFileName, firstName, lastName, mobile, email, password, isBlocked, isVerified) {
	const newRow = document.createElement('tr');
	const cellUid = document.createElement('td');
	const cellId = document.createElement('td');
	const imgId = document.createElement('img');
	const cellFirstName = document.createElement('td');
	const cellLastName = document.createElement('td');
	const cellMobile = document.createElement('td');
	const cellEmail = document.createElement('td');
	// const cellPassword = document.createElement('td');
	// const cellPasswordToggle = document.createElement('td');
	// const btnPasswordToggle = document.createElement('button');
	const cellUnits = document.createElement('td');
	const btnUnitsAction = document.createElement('button');
	const cellAction = document.createElement('td');
	const btnHostAction = document.createElement('button');

	if (idFileName == null){
		imgId.src = "https://via.placeholder.com/150?text=No+Image";
	}
	else {
		imgId.style.cursor = "pointer";
		getDownloadURL(sRef(storage, 'images/'+idFileName))
			.then((url) => {
				imgId.src = url;
				imgId.onclick = function() {
					viewId(url);
				}
			});
	}
	imgId.className = "col-12 rounded";
	imgId.style.width = "50px";
	imgId.style.height = "50px";
	imgId.style.objectFit = "cover";
	cellUid.innerHTML = uidReadable;
	cellFirstName.innerHTML = firstName;
	cellLastName.innerHTML = lastName;
	cellMobile.innerHTML = mobile;
	cellEmail.innerHTML = email;

	// cellPassword.className = "invisible";
	// cellPassword.innerHTML = password;

	btnUnitsAction.className = "btn btn-no-border btn-primary";
	btnUnitsAction.innerHTML = "View";
	btnUnitsAction.onclick = function() {
		viewUserHistory(uidReadable);
	}

	if (isVerified) {
		if (isBlocked) {
			btnHostAction.className = "btn btn-no-border btn-primary";
			btnHostAction.innerHTML = "Unblock";
		}
		else {
			btnHostAction.className = "btn btn-no-border btn-danger";
			btnHostAction.innerHTML = "Block";
		}
		btnHostAction.onclick = function() {
			blockUser(id, isBlocked);
		}
	}
	else {
		btnHostAction.className = "btn btn-no-border btn-success text-white";
		btnHostAction.innerHTML = "Verify";
		btnHostAction.onclick = function() {
			verifyUser(id);
		}
	}

	// btnPasswordToggle.className = "btn btn-no-border btn-primary";
	// btnPasswordToggle.innerHTML = "<i class=\"fi fi-br-eye text-white mx-2\" style=\"font-size: 1rem;\"></i>";
	// btnPasswordToggle.onclick = function() {
	// 	cellPassword.classList.toggle("invisible");
	// }
	
	newRow.appendChild(cellUid);
	newRow.appendChild(cellId);
	cellId.appendChild(imgId);
	newRow.appendChild(cellFirstName);
	newRow.appendChild(cellLastName);
	newRow.appendChild(cellMobile);
	// newRow.appendChild(cellEmail);
	// newRow.appendChild(cellPassword);
	// newRow.appendChild(cellPasswordToggle);
	// cellPasswordToggle.appendChild(btnPasswordToggle);
	newRow.appendChild(cellUnits);
	cellUnits.appendChild(btnUnitsAction);
	newRow.appendChild(cellAction);
	cellAction.appendChild(btnHostAction);
	
	tbodyUsers.append(newRow);
}

function viewId(url) {
	imgId.src = url;

	showModal('#modalViewId');
}

function viewUserHistory(userUid) {
	window.location = "../units.html?id="+userUid;
}

function blockUser(userUid, isBlocked) {
	updateDoc(doc(db, "users", userUid), {
		blocked: !isBlocked
	});
}

function verifyUser(userUid) {
	updateDoc(doc(db, "users", userUid), {
		isVerified: true
	});
}

function generatePassword() {
	var length = 6,
			charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
			retVal = "";
	for (var i = 0, n = charset.length; i < length; ++i) {
			retVal += charset.charAt(Math.floor(Math.random() * n));
	}
	return retVal;
}

function validateEmail(email) {
  var re = /\S+@\S+\.\S+/;
  return re.test(email);
}