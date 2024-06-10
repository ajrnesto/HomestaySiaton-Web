import { db, auth, storage } from '../js/firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js';
import { doc, collection, getDoc, or, and, getDocs, addDoc, updateDoc, increment, deleteDoc, Timestamp, arrayUnion, deleteField, limit, query, where, orderBy, startAt, endAt, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js';
import { ref as sRef, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-storage.js";
import * as utils from '../js/utils.js';

const tbodyBookings = document.querySelector("#tbodyBookings");
const tvEmptyMessage = document.querySelector("#tvEmptyMessage");
const cardBookings = document.querySelector("#cardBookings");
const cardVacancies = document.querySelector("#cardVacancies");
const cardRecentBookings = document.querySelector("#cardRecentBookings");
const cardBookingChart = document.querySelector("#cardBookingChart");
const tvBookings = document.querySelector("#tvBookings");
const tvVacants = document.querySelector("#tvVacants");
const tvRevenue = document.querySelector("#tvRevenue");
const tvEmptyBookingHistory = document.querySelector("#tvEmptyBookingHistory");
const divBookingHistory = document.querySelector("#divBookingHistory");
let chartBookingHistory = Chart.getChart("chartBookingHistory");

const date = new Date();
const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getTime();
const firstDayOfMonth1MonthAgo = new Date(date.getFullYear(), date.getMonth()-1, 1).getTime();
const lastDayOfMonth1MonthAgo = new Date(date.getFullYear(), date.getMonth()-1 + 1, 0).getTime();
const firstDayOfMonth2MonthsAgo = new Date(date.getFullYear(), date.getMonth()-2, 1).getTime();
const lastDayOfMonth2MonthsAgo = new Date(date.getFullYear(), date.getMonth()-2 + 1, 0).getTime();
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

onAuthStateChanged(auth, user => {
});

cardVacancies.addEventListener("click", function() {
	window.location = "units.html";
});

cardBookings.addEventListener("click", function() {
	window.location = "bookings.html";
});

cardRecentBookings.addEventListener("click", function() {
	window.location = "bookings.html";
});

cardBookingChart.addEventListener("click", function() {
	window.location = "bookings.html";
});

window.addEventListener("load", function() {
	listenToBookingsThisWeek();
	listenToRecentBookings();
	listenToBookingHistory();
	listenToVacantUnits();
	listenToRevenue();
});

function listenToBookingHistory() {
	const qryBookings = query(collection(db, "bookings"));

	onSnapshot(qryBookings, (bookings) => {
		let totalBookings = 0;
		let bookingsThisMonth = 0;
		let bookingsOneMonthAgo = 0;
		let bookingsTwoMonthsAgo = 0;

		bookings.forEach(booking => {
			totalBookings++;

			const timestamp = booking.data().timestamp;
			if (timestamp >= firstDayOfMonth && timestamp <= lastDayOfMonth) {
				bookingsThisMonth++;
			}
			else if (timestamp >= firstDayOfMonth1MonthAgo && timestamp <= lastDayOfMonth1MonthAgo) {
				bookingsOneMonthAgo++;
			}
			else if (timestamp >= firstDayOfMonth2MonthsAgo && timestamp <= lastDayOfMonth2MonthsAgo) {
				bookingsTwoMonthsAgo++;
			}
		

			if (chartBookingHistory != undefined) {
				chartBookingHistory.destroy();
			}
		
			const d = new Date();
			let month = d.getMonth();
			chartBookingHistory = new Chart("chartBookingHistory", {
				type: "line",
				data: {
					labels: [
						months[month-2],
						months[month-1],
						months[month]
					],
					datasets: [{
						label: 'Bookings',
						data: [
							bookingsTwoMonthsAgo,
							bookingsOneMonthAgo,
							bookingsThisMonth
						]
					}]
				},
				options: {
					plugins: {
							legend: {
									display: true,
									position: 'bottom',
									align: 'start'
							}
					}
				}
			});
		
			if (totalBookings == 0) {
				tvEmptyBookingHistory.classList.toggle("d-none", false);
				divBookingHistory.classList.toggle("d-none", true);
			}
			else {
				tvEmptyBookingHistory.classList.toggle("d-none", true);
				divBookingHistory.classList.toggle("d-none", false);
			}
		});
	});
}

function listenToBookingsThisWeek() {
	const d = new Date; // get current date
	let dFirst = new Date;
	let dLast = new Date;
	const first = d.getDate() - d.getDay(); // First day is the day of the month - the day of the week
	const last = first + 6; // last day is the first day + 6

	dFirst = new Date(d.setDate(first)).getTime();
	dLast = new Date(d.setDate(last)).getTime();

	let qryBookings = query(collection(db, "bookings"), or((where("bookingStartDate", ">=", dFirst), where("bookingStartDate", "<=", dLast)), (where("bookingEndDate", ">=", dFirst), where("bookingEndDate", "<=", dLast))));
	
	onSnapshot(qryBookings, (bookings) => {
		tvBookings.innerHTML = bookings.size;
	});
}

function listenToVacantUnits() {
	let qryUnits = query(collection(db, "units"), where("isBooked", "!=", true));

	onSnapshot(qryUnits, (units) => {
		tvVacants.innerHTML = units.size;
	})
}

function listenToRecentBookings() {
	let qryBookings = query(collection(db, "bookings"), orderBy("timestamp", "desc"), limit(10));

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
  const cellStatus = document.createElement('td');

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
  	cellStatus.innerHTML = status;

	rowBookings.appendChild(cellThumbnail);
		cellThumbnail.appendChild(imgThumbnail);
	rowBookings.appendChild(cellUnit);
	rowBookings.appendChild(cellUser);
	rowBookings.appendChild(cellId);
		cellId.appendChild(imgId);
	rowBookings.appendChild(cellBookingStartDate);
	rowBookings.appendChild(cellBookingEndDate);
	rowBookings.appendChild(cellStatus);

	tbodyBookings.appendChild(rowBookings);
}

function listenToRevenue() {
	const qry = query(collection(db, "bookings"), where("status", "==", "completed"));

	onSnapshot(qry, (bookings) => {
		let total = 0;

		bookings.forEach((booking) => {
			getDoc(doc(db, "units", booking.data().unitId)).then((unit) => {
				let date1 = new Date;
				let date2 = new Date;

				date1 = new Date(date1.setTime(booking.data().bookingStartDate));
				date2 = new Date(date2.setTime(booking.data().bookingEndDate));
				const timeDiff = Math.abs(date2.getTime() - date1.getTime());
				const numberOfNights = Math.ceil(timeDiff / (1000 * 3600 * 24)); 

				total += unit.data().price * numberOfNights;
				tvRevenue.innerHTML = "₱" + total.toFixed(2);
			});
		});
	});
}