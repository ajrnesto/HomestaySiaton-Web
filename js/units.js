import { db, auth, storage } from '../js/firebase.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js';
import { doc, collection, collectionGroup, addDoc, setDoc, getDoc, getDocs, deleteDoc, updateDoc, increment, query, where, orderBy, startAt, endAt, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-storage.js";
import { blockNonAdmins, showModal, hideModal, resetValidation, invalidate, parseDate } from '../js/utils.js';

// table
const divUnits = document.querySelector('#divUnits');
// modal
const tvManageUnitTitle = document.querySelector('#tvManageUnitTitle');
const btnSaveUnit = document.querySelector('#btnSaveUnit');
const btnCancelUnitManagement = document.querySelector('#btnCancelUnitManagement');
// modal form
const menuCategory = document.querySelector('#menuCategory');
const etUnitName = document.querySelector('#etUnitName');
const etUnitDetails = document.querySelector('#etUnitDetails');
const etUnitAddressLine = document.querySelector('#etUnitAddressLine');
const etPrice = document.querySelector('#etPrice');
const imgUnit = document.querySelector("#imgUnit")
const btnUploadImage = document.querySelector("#btnUploadImage")
let selectedUnitImage = null;
let unitThumbnailWasChanged = false;
let unitLocation = null;

const etSearchUnit = document.querySelector('#etSearchUnit');
const menuCategoriesFilter = document.querySelector('#menuCategoriesFilter');
const btnSearchUnit = document.querySelector('#btnSearchUnit');
let unsubUnitsListener = null;

// delete modal
const tvConfirmDeleteMessage = document.querySelector('#tvConfirmDeleteMessage');
const btnDelete = document.querySelector('#btnDelete');

const unitNameValidator = document.querySelectorAll('.unit-name-validator');
const unitDetailsValidator = document.querySelectorAll('.unit-details-validator');
const priceValidator = document.querySelectorAll('.price-validator');
const unitAddressLineValidator = document.querySelectorAll('.unit-address-line-validator');
const unitLocationValidator = document.querySelectorAll('.unit-location-validator');

const menuFilter = document.querySelector("#menuFilter");
const etSearchId = document.querySelector("#etSearchId");
const etFirstName = document.querySelector("#etFirstName");
const etLastName = document.querySelector("#etLastName");
const btnFilter = document.querySelector("#btnFilter");

menuFilter.addEventListener("change", () => {
	if (menuFilter.value == "User ID") {
		etSearchId.classList.toggle("d-none", false);
		etFirstName.classList.toggle("d-none", true);
		etFirstName.value = "";
		etLastName.classList.toggle("d-none", true);
		etLastName.value = "";
	}
	else {
		etSearchId.classList.toggle("d-none", true);
		etSearchId.value = "";
		etFirstName.classList.toggle("d-none", false);
		etLastName.classList.toggle("d-none", false);
	}
})

onAuthStateChanged(auth, user => {
	blockNonAdmins(user);
});

btnFilter.addEventListener("click", function() {
	queryUnits();
});

window.addEventListener("load", function() {
	autosizeTextareas();
	etSearchId.value = new URL(window.location.href).searchParams.get("id");
	queryUnits();

	console.log("User uid: " + localStorage.getItem("user_uid"));
	console.log("User type: " + localStorage.getItem("user_type"));
});

window.manageUnit = manageUnit;
window.confirmDeleteUnit = confirmDeleteUnit;

btnUploadImage.addEventListener("change", () => {
	selectedUnitImage = btnUploadImage.files[0];
	imgUnit.src = URL.createObjectURL(selectedUnitImage);
	unitThumbnailWasChanged = true;
});

btnSearchUnit.addEventListener("click", function() {
	if (unsubUnitsListener != null) {
		unsubUnitsListener();
	}

	queryUnits();
});

function queryUnits() {
	let qryUnits = null;
	qryUnits = query(collection(db, "units"));

	const uidReadable = etSearchId.value;
	const firstName = etFirstName.value.toUpperCase();
	const lastName = etLastName.value.toUpperCase();

	if (!uidReadable) {
		qryUnits = query(collection(db, "units"));
		renderUnits(qryUnits);
	}
	else {
		const qryUser = query(collection(db, "users"), where("uidReadable", "==", uidReadable));

		getDocs(qryUser).then(users => {
			users.forEach(user => {
				qryUnits = query(collection(db, "units"), where("hostUid", "==", user.id));
				renderUnits(qryUnits);
			});
		})
	}
}

function renderUnits(qryUnits) {
	unsubUnitsListener = onSnapshot(qryUnits, (snapUnits) => {
		// clear table
		divUnits.innerHTML = '';

		snapUnits.forEach(unit => {
      renderUnitsTable(
				unit.id,
				unit.data().unitName,
				unit.data().unitDetails,
				unit.data().addressLine,
				unit.data().keywords,
				unit.data().location,
				unit.data().categoryId,
				unit.data().price,
				unit.data().thumbnail,
				unit.data().isBooked,
				unit.data().bookingEndDate
			);
        });
	});
}

async function renderUnitsTable(id, unitName, unitDetails, addressLine, keywords, location, categoryId, price, thumbnail, isBooked, bookingEndDate) {
    const cardContainer = document.createElement('div');
    const card = document.createElement('div');
    const headerContainer = document.createElement('div');
    const tvStatus = document.createElement('h6');
    const imgThumbnail = document.createElement('img');
    const tvPrice = document.createElement('h5');
    const tvUnitName = document.createElement('h6');
    const tvAddress = document.createElement('p');
    const tvUnitDetails = document.createElement('p');
    const tvCategory = document.createElement('h6');
		const buttonEdit = document.createElement('button');
			const buttonEditIcon = document.createElement('i');
		const buttonDelete = document.createElement('button');
			const buttonDeleteIcon = document.createElement('i');

	cardContainer.className = "col-4 p-3";
	card.className = "col-12 rounded text-center shadow pb-1";
	card.style.cursor = "pointer";

	// header container
	headerContainer.className = "col-12 rounded-top";
	tvStatus.className = "py-1 m-0 text-white";
	if (isBooked) {
		headerContainer.classList.toggle("bg-danger", true);
		tvStatus.innerHTML = "Booked until " + parseDate(bookingEndDate);

		// syncer
		if (Date.now() > bookingEndDate) {
			const unitRef = doc(db, "units", id);
			updateDoc((unitRef), {
				bookingEndDate: 0,
				isBooked: false
			})
			console.log("TODO: reset unit "+id+" bookingEndDate (0) and isBooked (false) fields")
		}
	}
	else {
		headerContainer.classList.toggle("bg-success", true);
		tvStatus.innerHTML = "Available";
	}

	// thumbnail
	if (thumbnail == null){
		imgThumbnail.src = "https://via.placeholder.com/150?text=No+Image";
	}
	else {
		getDownloadURL(ref(storage, 'units/'+thumbnail))
			.then((url) => {
				imgThumbnail.src = url;
			});
	}
	imgThumbnail.className = "col-12 mb-2 rounded-bottom";
	imgThumbnail.style.aspectRatio = "3/2";
	imgThumbnail.style.objectFit = "fill";

	tvPrice.innerHTML = "₱"+Number(price).toFixed(2);
	tvPrice.className = "mx-2";
	tvUnitName.innerHTML = unitName;
	tvUnitName.className = "pb-0 mb-0";
	tvAddress.innerHTML = addressLine;
	tvAddress.className = "pb-0 mx-2";
	tvUnitDetails.innerHTML = unitDetails;
	tvUnitDetails.className = "pb-0 mb-2 mx-2";
	// getDoc(doc(db, "categories", categoryId)).then((category) => {
	// 	tvCategory.innerHTML = category.data().categoryName;
	// });
	
    buttonEdit.className = "btn btn-no-border btn-primary col me-2 mb-2 d-none";
    buttonEdit.onclick = function() { manageUnit(id, unitName, unitDetails, addressLine, keywords, location, categoryId, price, thumbnail) };
	buttonEdit.type = 'button';
	buttonEdit.textContent = "Edit";
		buttonEditIcon.className = "bi bi-pencil-fill text-light ms-2";
		buttonEditIcon.style.fontSize = "0.8rem";

	buttonDelete.className = "btn btn-no-border btn-danger col mb-2 d-none";
	buttonDelete.onclick = function() { confirmDeleteUnit(id, unitName, thumbnail, categoryId) };
	buttonDelete.textContent = "Delete";
	buttonDelete.type = 'button';
		buttonDeleteIcon.className = "bi bi-trash-fill text-light ms-2";
		buttonDeleteIcon.style.fontSize = "0.8rem";

    cardContainer.appendChild(card);
		card.appendChild(headerContainer);
			headerContainer.appendChild(tvStatus);
		card.appendChild(imgThumbnail);
    card.appendChild(tvUnitName);
    card.appendChild(tvAddress);
    card.appendChild(tvUnitDetails);
    card.appendChild(tvPrice);
    // card.appendChild(tvCategory);
		card.appendChild(buttonEdit);
			buttonEdit.appendChild(buttonEditIcon);
		card.appendChild(buttonDelete);
			buttonDelete.appendChild(buttonDeleteIcon);

	divUnits.append(cardContainer);
}

function manageUnit(id, unitName, unitDetails, addressLine, keywords, location, categoryId, price, oldThumbnail) {
	initMap();
	unitLocation = null;

	selectedUnitImage = null;
	resetCategorySelection();

	const NEW_PRODUCT = (id == null);
	if (!NEW_PRODUCT) {
		unitLocation = location;
		showModal('#modalManageUnit');

		tvManageUnitTitle.textContent = "Edit Unit";
		btnSaveUnit.textContent = "Save Unit";

		etUnitName.value = unitName;
		etUnitDetails.value = unitDetails;
		etUnitAddressLine.value = !addressLine?"":addressLine;
		// etUnitLocation.value = location;
		etPrice.value = Number(price).toFixed(2);
		menuCategory.value = categoryId;

		if (oldThumbnail == null) {
			imgUnit.src = "https://via.placeholder.com/150?text=No+Image";
		}
		else {
			getDownloadURL(ref(storage, 'units/'+oldThumbnail)).then((url) => {
				imgUnit.src = url;
			});
		}
	}
	else if (NEW_PRODUCT) {
		imgUnit.src = "https://via.placeholder.com/150?text=No+Image";
		tvManageUnitTitle.textContent = "Add Unit";
		btnSaveUnit.textContent = "Add Unit";
		menuCategory.value = "Uncategorized";
	}

	btnSaveUnit.onclick = function() {
		saveUnit(id, oldThumbnail);
	}
}

function saveUnit(unitId, oldThumbnail) {
	const category = menuCategory.value;
	const unitName = etUnitName.value;
	const unitDetails = etUnitDetails.value;
	const unitAddressLine = etUnitAddressLine.value;
	const keywords = (unitName.toUpperCase().split(" ")).concat(unitAddressLine.toUpperCase().split(", "));
	
	// const location = etUnitLocation.value;
	const price = etPrice.value;

	const PRODUCT_NAME_IS_INVALID = (unitName == null || unitName == "");
	if (PRODUCT_NAME_IS_INVALID) {
		invalidate(unitNameValidator);
		return;
	}
	resetValidation(unitNameValidator);

	const PRODUCT_DETAILS_ARE_INVALID = (unitDetails == null || unitDetails == "");
	if (PRODUCT_DETAILS_ARE_INVALID) {
		invalidate(unitDetailsValidator);
		return;
	}
	resetValidation(unitDetailsValidator);

	const PRICE_IS_INVALID = (price == null || price == "");
	if (PRICE_IS_INVALID) {
		invalidate(priceValidator);
		return;
	}
	resetValidation(priceValidator);

	const ADDRESS_LINE_IS_INVALID = (unitAddressLine == null || unitAddressLine == "");
	if (ADDRESS_LINE_IS_INVALID) {
		invalidate(unitAddressLineValidator);
		return;
	}
	resetValidation(unitAddressLineValidator);

	const LOCATION_IS_INVALID = (unitLocation == null);
	if (LOCATION_IS_INVALID) {
		invalidate(unitLocationValidator);
		const modalDialog = document.querySelector("#modalManageUnitBody");
		modalDialog.scrollTo(0, modalDialog.scrollHeight);
		return;
	}
	resetValidation(unitLocationValidator);

	let unitImageFileName = null;
	if (selectedUnitImage != null) {
		unitImageFileName = Date.now();

		uploadBytes(ref(storage, "units/"+unitImageFileName), selectedUnitImage).then((snapshot) => {
			uploadUnitData(unitId, unitName, unitDetails, unitAddressLine, keywords, price, category, unitImageFileName, oldThumbnail);
		});
	}
	else {
		uploadUnitData(unitId, unitName, unitDetails, unitAddressLine, keywords, price, category, unitImageFileName, oldThumbnail);
	}
}

function uploadUnitData(unitId, unitName, unitDetails, unitAddressLine, keywords, price, category, unitImageFileName, oldThumbnail) {
	const NEW_PRODUCT = (unitId == null);
	
	let unitRef = null;
	let status = null;
	
	if (NEW_PRODUCT) {
		unitRef = doc(db, "units", String(Date.now()));
	}
	else if (!NEW_PRODUCT) {
		unitRef = doc(db, "units", unitId);
	}

	if (unitThumbnailWasChanged) {
		deleteObject(ref(storage, 'units/'+oldThumbnail)).then(() => {
		}).catch((error) => {
			console.log("FAILED TO CHANGE THUMBNAIL: "+error);
		});			  

		// reset variable
		unitThumbnailWasChanged = false;
	}
	else if (oldThumbnail != null) {
		unitImageFileName = oldThumbnail;
	}

	if (NEW_PRODUCT) {
		setDoc((unitRef), {
			id: unitRef.id,
			hostUid: localStorage.getItem("user_uid"),
			unitName: unitName,
			unitNameAllCaps: unitName.toUpperCase(),
			unitDetails: unitDetails,
			addressLine: unitAddressLine,
			hostUid: getAuth().currentUser.uid,
			keywords: keywords,
			location: {
				latitude: unitLocation.latitude,
				longitude: unitLocation.longitude
			},
			price: parseFloat(price),
			categoryId: category,
			thumbnail: unitImageFileName,
			isBooked: false,
			bookingEndDate: 0
		});
	}
	else if (!NEW_PRODUCT) {
		// the host uid is not changed
		updateDoc((unitRef), {
			unitName: unitName,
			unitNameAllCaps: unitName.toUpperCase(),
			unitDetails: unitDetails,
			addressLine: unitAddressLine,
			keywords: keywords,
			location: {
				latitude: unitLocation.latitude,
				longitude: unitLocation.longitude
			},
			price: parseFloat(price),
			categoryId: category,
			thumbnail: unitImageFileName,
			isBooked: false,
			bookingEndDate: 0
		});
	}

	if (NEW_PRODUCT) {
		// increment category
		const categoryRef = doc(db, "categories", category);
		updateDoc((categoryRef), {
			units: increment(1)
		})
	}

	etUnitName.value = "";
	etUnitDetails.value = "";
	etPrice.value = "";
	hideModal('#modalManageUnit');
}

function confirmDeleteUnit(unitId, unitName, thumbnail, categoryId) {
	tvConfirmDeleteMessage.textContent = "Delete the unit \"" + unitName + "\"?";
	btnDelete.textContent = "Delete Unit";
	showModal('#modalConfirmDelete');

	btnDelete.onclick = function() {
		deleteUnit(unitId, categoryId);
	};
}

function deleteUnit(unitId, categoryId) {
	hideModal("#modalConfirmDelete");
	deleteDoc(doc(db, "units", unitId)).then(() => {
		updateDoc(doc(db, "categories", categoryId), {
			units: increment(-1)
		});
	}).catch((error) => {
		console.log("COULD NOT DELETE DATA: "+ error);
	});

	deleteCartItems(unitId);
}

function deleteCartItems(unitId) {
	const qryCartItems = query(collectionGroup(db, "items"), where("unitId", "==", unitId));

	getDocs(qryCartItems).then((docRefs) => {

		docRefs.forEach((docRef) => {
			deleteDoc(docRef.ref);
		});
	});
}

function resetCategorySelection() {
	if (menuCategory.value == -1) {
		menuCategory.value = "Uncategorized";
	}
}

function autosizeTextareas() {
	const txHeight = 56;
	const tx = document.getElementsByTagName("textarea");

	for (let i = 0; i < tx.length; i++) {
		if (tx[i].value == '') {
			tx[i].setAttribute("style", "height:" + txHeight + "px;overflow-y:hidden;");
		}
		else {
			tx[i].setAttribute("style", "height:" + (tx[i].scrollHeight) + "px;overflow-y:hidden;");
		}
		tx[i].addEventListener("input", OnInput, false);
	}

	function OnInput(e) {
		this.style.height = 0;
		this.style.height = (this.scrollHeight) + "px";
	}
}

// Initialize and add the map
let map;

async function initMap() {
	let arrMarkers = [];
  // The location of Siaton
  const centerOfSiaton = { lat: 9.064356662015047, lng: 123.03462204959553 };
  // Request needed libraries.
  //@ts-ignore
  const { Map } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

  // The map, centered at Siaton
  map = new Map(document.getElementById("map"), {
    zoom: 16,
    center: centerOfSiaton,
    mapId: "DEMO_MAP_ID",
		draggableCursor: 'default'
  });

	map.addListener('click', (e) => {
		// remove all markers
		for (let i = 0; i < arrMarkers.length; i++) {
			arrMarkers[i].setMap(null);
		}

		// animate camera
		const location = e.latLng;
		map.panTo(location);

		unitLocation = {
			latitude: location.toJSON().lat,
			longitude: location.toJSON().lng
		};

		// add and draw marker
		const marker = new AdvancedMarkerElement({
			map: map,
			position: location,
			title: etUnitName.value!=""?etUnitName.value:"Unit Location",
			gmpDraggable: true
		});
		arrMarkers.push(marker);

		// listen to marker drag event
		marker.addListener("dragend", (event) => {
			const position = marker.position;

			unitLocation = {
				latitude: position.toJSON().lat,
				longitude: position.toJSON().lng
			};
		});

		// show info window
		const infowindow = new google.maps.InfoWindow({
			content: etUnitName.value!=""?etUnitName.value:"Unit Location"
		});
		infowindow.open({
			anchor: marker,
			map
		});
	});

	// when editing existing unit, load the location of the said existing unit
	if (unitLocation != null) {
		// remove all markers
	for (let i = 0; i < arrMarkers.length; i++) {
		arrMarkers[i].setMap(null);
	}

	// animate camera
	const location = new google.maps.LatLng(unitLocation.latitude, unitLocation.longitude);
	map.panTo(location);

	unitLocation = {
		latitude: location.toJSON().lat,
		longitude: location.toJSON().lng
	};

	// add and draw marker
	const marker = new AdvancedMarkerElement({
		map: map,
		position: location,
		title: etUnitName.value!=""?etUnitName.value:"Unit Location",
		gmpDraggable: true
	});
	arrMarkers.push(marker);

	// listen to marker drag event
	marker.addListener("dragend", (event) => {
		const position = marker.position;

		unitLocation = {
			latitude: position.toJSON().lat,
			longitude: position.toJSON().lng
		};
	});

	// show info window
	const infowindow = new google.maps.InfoWindow({
		content: etUnitName.value!=""?etUnitName.value:"Unit Location"
	});
	infowindow.open({
		anchor: marker,
		map
	});
	}
}