import { db, auth, storage } from '../js/firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js';
import { doc, collection, getDoc, onSnapshot, getDocs, setDoc, updateDoc, deleteDoc, increment, query, and, or, where, orderBy } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js';
import { ref as sRef, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-storage.js";
import * as utils from '../js/utils.js';

// chips
const btnCurrentlyBooked = document.querySelector("#btnCurrentlyBookedLabel");
const btnPreviousBookings = document.querySelector("#btnPreviousBookingsLabel");
// const btnReadyForPickupLabel = document.querySelector("#btnReadyForPickupLabel");
// const btnInTransitLabel = document.querySelector("#btnInTransitLabel");
// const btnCompletedLabel = document.querySelector("#btnCompletedLabel");
// const btnFailedLabel = document.querySelector("#btnFailedLabel");

const tbodyBookings = document.querySelector("#tbodyBookings");
const tvEmptyMessage = document.querySelector("#tvEmptyMessage");
const imgId = document.querySelector("#imgId");

onAuthStateChanged(auth, user => {
	const docRef = doc(db, "users", user.uid);
	getDoc(docRef).then(userSnap => {
		const userType = userSnap.data().userType;

		if (userType == 3) {
			getBookingsData("In Transit");
		}
	});
});

window.addEventListener("load", function() {
	getBookingsData("pending");
	btnCurrentlyBooked.style.color = "white";
});

btnCurrentlyBooked.addEventListener("click", function() {
	getBookingsData("pending");
	btnCurrentlyBooked.style.color = "white";
	btnPreviousBookings.style.color = "#b98357";
	// btnReadyForPickupLabel.style.color = "black";
	// btnInTransitLabel.style.color = "black";
	// btnCompletedLabel.style.color = "black";
	// btnFailedLabel.style.color = "black";
});

btnPreviousBookings.addEventListener("click", function() {
	getBookingsData("completed");
	btnCurrentlyBooked.style.color = "#b98357";
	btnPreviousBookings.style.color = "white";
	// btnReadyForPickupLabel.style.color = "black";
	// btnInTransitLabel.style.color = "black";
	// btnCompletedLabel.style.color = "black";
	// btnFailedLabel.style.color = "black";
});

function getBookingsData(filterStatus) {
	let qryBookings = null;

	if (localStorage.getItem("user_type") == 1) {
		if (filterStatus == "completed") {
			qryBookings = query(collection(db, "bookings"), where("status", "==", "completed"), orderBy("timestamp", "asc"));
		}
		else {
			qryBookings = query(collection(db, "bookings"), or(where("status", "==", "pending"), where("status", "==", "accepted")), orderBy("timestamp", "desc"));
		}
	}
	else if (localStorage.getItem("user_type") == 2) {
		if (filterStatus == "completed") {
			qryBookings = query(collection(db, "bookings"), where("hostUid", "==", localStorage.getItem("user_uid")), where("status", "==", "completed"), orderBy("timestamp", "asc"));
		}
		else {
			qryBookings = query(collection(db, "bookings"), and(where("hostUid", "==", localStorage.getItem("user_uid")), or(where("status", "==", "pending"), where("status", "==", "accepted"))), orderBy("timestamp", "desc"));
		}
	}
	
	onSnapshot(qryBookings, (bookings) => {
		// clear table
		tbodyBookings.innerHTML = '';
		
		console.log("Bookings size: "+bookings.size);
		if (bookings.size == 0) {
			tvEmptyMessage.classList.toggle("d-none", false);
		}
		else {
			tvEmptyMessage.classList.toggle("d-none", true);
			// clear table
			tbodyBookings.innerHTML = '';
		}

		let count = 0;
			
		bookings.forEach(order => {
			getDoc(doc(db, "units", order.data().unitId)).then((unit) => {
				getDoc(doc(db, "users", order.data().userUid)).then((user) => {
					count++;
					console.log(count);
					renderTable(
						order.id,
						order.data().unitId,
						unit.data().thumbnail,
						unit.data().unitName,
						order.data().userUid,
						user.data().idFileName,
						user.data().firstName,
						user.data().lastName,
						user.data().mobile,
						order.data().bookingEndDate,
						order.data().bookingStartDate,
						order.data().status,
						order.data().timestamp
					);
				});
			});
		});
	});
}

function renderTable(id, unitId, thumbnail, unitName, userUid, idFileName, firstName, lastName, mobile, bookingEndDate, bookingStartDate, status, timestamp) {
  const rowBookings = document.createElement('tr');
  const cellThumbnail = document.createElement('td');
  const imgThumbnail = document.createElement('img');
  const cellUnit = document.createElement('td');
  const cellUser = document.createElement('td');
  const cellId = document.createElement('td');
  const imgId = document.createElement('img');
  const cellBookingStartDate = document.createElement('td');
  const cellBookingEndDate = document.createElement('td');
  const cellAction = document.createElement('td');
  const buttonAction = document.createElement('button');
  const buttonCancel = document.createElement('button');

	if (thumbnail == null) {
		imgThumbnail.src = "https://via.placeholder.com/150?text=Image";
	}
	else {
		getDownloadURL(sRef(storage, 'units/'+thumbnail)).then((url) => {
			imgThumbnail.src = url;
			imgThumbnail.style.cursor = "pointer";
			imgThumbnail.onclick = function() {
				viewImage(url);
			}
		});
	}

	if (idFileName == null) {
		imgId.src = "https://via.placeholder.com/150?text=Image";
	}
	else {
		getDownloadURL(sRef(storage, 'images/'+idFileName)).then((url) => {
			imgId.src = url;
			imgId.style.cursor = "pointer";
			imgId.onclick = function() {
				viewImage(url);
			}
		});
	}

	imgThumbnail.className = "col-12 rounded-3";
	imgThumbnail.style.width = "50px";
	imgThumbnail.style.height = "50px";
	imgThumbnail.style.objectFit = "cover";

	imgId.className = "col-12 rounded-3";
	imgId.style.width = "50px";
	imgId.style.height = "50px";
	imgId.style.objectFit = "cover";

	cellUnit.innerHTML = unitName;
  cellUser.innerHTML = firstName + " " + lastName + " (" + mobile + ")";
  cellBookingStartDate.innerHTML = utils.parseDate(bookingStartDate);
  cellBookingEndDate.innerHTML = utils.parseDate(bookingEndDate);

  buttonAction.type = 'button';
  buttonAction.textContent = utils.parseActionText(status);
	buttonAction.className = "btn btn-no-border btn-success text-white col-auto px-2 me-2";
    if (status == "completed") {
        //buttonAction.classList.toggle('col-12', true);
        buttonAction.classList.toggle('d-none', true);
    }
  buttonAction.onclick = function() { btnUpdateStatus(id, status) };

  buttonCancel.type = 'button';
  buttonCancel.textContent = "Cancel";
	buttonCancel.className = "btn btn-no-border btn-danger text-white col-auto px-2 me-2";
    if (status == "completed") {
        //buttonAction.classList.toggle('col-12', true);
        buttonCancel.classList.toggle('d-none', true);
    }
		buttonCancel.onclick = function() { btnCancelBooking(id, unitId) };

  rowBookings.appendChild(cellThumbnail);
  	cellThumbnail.appendChild(imgThumbnail);
  rowBookings.appendChild(cellUnit);
  rowBookings.appendChild(cellUser);
  rowBookings.appendChild(cellId);
		cellId.appendChild(imgId);
  rowBookings.appendChild(cellBookingStartDate);
  rowBookings.appendChild(cellBookingEndDate);
//   rowBookings.appendChild(cellAction);
  	cellAction.appendChild(buttonAction);
  	cellAction.appendChild(buttonCancel);

	tbodyBookings.appendChild(rowBookings);
}

function btnUpdateStatus(id, status) {
	const refRequest = doc(db, "bookings", id);

	let updateData = {};

	if (status == "pending") {
		updateData = { status: "accepted" }
	}
	else if (status == "accepted") {
		updateData = { status: "completed" }
	}

	updateDoc(refRequest, updateData).then(() => {});
}

function btnCancelBooking(id, unitId) {
	const refRequest = doc(db, "bookings", id);
	
	deleteDoc(refRequest).then(() => {
		updateDoc(doc(db, "units", unitId), {
			isBooked: false,
			bookingEndDate: 0
		});
	}).catch((error) => {
		console.log("COULD NOT DELETE DATA: "+ error);
	});
}

function viewImage(url) {
	imgId.src = url;

	utils.showModal('#modalViewImage');
}