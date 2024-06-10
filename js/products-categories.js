import { db, storage } from '../js/firebase.js';
import { doc, collection, addDoc, updateDoc, deleteDoc, query, orderBy, startAt, endAt, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js';
import { showModal, hideModal, resetValidation, invalidate } from '../js/utils.js';

// table
const tbodyCategories = document.querySelector('#tbodyCategories');
// modal
const btnDelete = document.querySelector('#btnDelete');
const tvConfirmDeleteMessage = document.querySelector('#tvConfirmDeleteMessage');
const btnSaveCategory = document.querySelector('#btnSaveCategory');
// modal form
const etCategoryName = document.querySelector('#etCategoryName');
const categoryNameValidator = document.querySelectorAll('.category-name-validator');
const menuCategory = document.querySelector('#menuCategory');
const menuCategoriesFilter = document.querySelector('#menuCategoriesFilter');

const etSearchCategory = document.querySelector('#etSearchCategory');
const btnSearchCategory = document.querySelector('#btnSearchCategory');

let unsubCategoryListener = null;

window.addEventListener("load", function() {
	renderCategoriesSelectOptions();
});

window.manageCategory = manageCategory;
window.confirmDeleteCategory = confirmDeleteCategory;

btnSearchCategory.addEventListener("click", function() {
	console.log("Searching for categories...");

	if (unsubCategoryListener != null) {
		unsubCategoryListener();
	}

	renderCategoriesSelectOptions();
});

menuCategory.addEventListener("change", () => {
	const ADD_NEW_CATEGORY = -1;
	const SELECTED_MENU_OPTION = menuCategory.value;
	
	if (SELECTED_MENU_OPTION == ADD_NEW_CATEGORY) {
		hideModal('#modalManageUnit');
		showModal('#modalManageCategory');
		manageCategory(null, null);
	}
});

function renderCategoriesSelectOptions() {
	const searchKey = etSearchCategory.value.toUpperCase();

	let qryCategories = null;
	if (searchKey == "") {
		qryCategories = query(collection(db, "categories"));
	}
	else {
		qryCategories = query(collection(db, "categories"), orderBy("categoryNameAllCaps"), startAt(searchKey), endAt(searchKey+'\uf8ff'));
	}
	
	unsubCategoryListener = onSnapshot(qryCategories, (snapCategories) => {
		// clear table
		tbodyCategories.innerHTML = '';

		// clear category select options
		while (menuCategory.length > 2) {
			menuCategory.remove(menuCategory.length - 1);
		}

		snapCategories.forEach(category => {
			const categoryName = category.data().categoryName;
			const units = category.data().units;

			if (categoryName != "Uncategorized") {
				const optionForMenuCategoriesFilter = document.createElement("option");
				optionForMenuCategoriesFilter.innerHTML = categoryName;
				optionForMenuCategoriesFilter.value = category.id;
				menuCategoriesFilter.add(optionForMenuCategoriesFilter);
				const optionForMenuCategory = document.createElement("option");
				optionForMenuCategory.innerHTML = categoryName;
				optionForMenuCategory.value = category.id;
				menuCategory.append(optionForMenuCategory);
			}
            renderCategoryTable(
				category.id,
				categoryName,
				units
			);
        });
	});
}

function renderCategoryTable(id, categoryName, units) {
    const newRow = document.createElement('tr');
    const cellCategoryName = document.createElement('td');
    const cellItems = document.createElement('td');
    const cellAction = document.createElement('td');

	if (categoryName != "Uncategorized") {
		const buttonEdit = document.createElement('button');
			const buttonEditIcon = document.createElement('i');
		const buttonDelete = document.createElement('button');
			const buttonDeleteIcon = document.createElement('i');

		buttonEdit.className = "btn btn-no-border btn-primary col me-2";
		buttonEdit.onclick = function() { manageCategory(id, categoryName) };
		buttonEdit.type = 'button';
			buttonEditIcon.className = "bi bi-pencil-fill text-light";
			buttonEditIcon.style.fontSize = "0.8rem";
		
		buttonDelete.className = "btn btn-no-border btn-danger col";
		buttonDelete.onclick = function() { confirmDeleteCategory(id, categoryName) };
		buttonDelete.type = 'button';
			buttonDeleteIcon.className = "bi bi-trash-fill text-light";
			buttonDeleteIcon.style.fontSize = "0.8rem";

		cellAction.appendChild(buttonEdit);
			buttonEdit.appendChild(buttonEditIcon);
		cellAction.appendChild(buttonDelete);
		buttonDelete.appendChild(buttonDeleteIcon);
	}
	
	cellCategoryName.innerHTML = categoryName;
	cellItems.innerHTML = parseInt(units);

    newRow.appendChild(cellCategoryName);
    newRow.appendChild(cellItems);
    newRow.appendChild(cellAction);

	tbodyCategories.append(newRow);
}

function manageCategory(categoryId, categoryName) {
	if (categoryId != null) {
		showModal('#modalManageCategory');
		etCategoryName.value = categoryName;
		tvManageCategoryTitle.textContent = "Edit Category";
		btnSaveCategory.textContent = "Save Category";
	}
	else {
		etCategoryName.value = "";
		tvManageCategoryTitle.textContent = "Add Category";
		btnSaveCategory.textContent = "Add Category";
	}

	btnSaveCategory.onclick = function () {
		saveCategory(categoryId);
	}
	// btnSaveCategory.addEventListener("click", function() {}, {once: true});
}

function saveCategory(categoryId) {
	let categoryName = etCategoryName.value;

	if (categoryName == null || categoryName == "") {
		invalidate(categoryNameValidator);
		return;
	}

	resetValidation(categoryNameValidator);

	if (categoryId == null) {
		addDoc(collection(db, "categories"), {
			categoryName: categoryName,
			categoryNameAllCaps: categoryName.toUpperCase(),
			units: parseInt(0)
		});
	}
	else {
		updateDoc(doc(db, "categories", categoryId), {
			categoryName: categoryName,
			categoryNameAllCaps: categoryName.toUpperCase(),
		});
	}

	etCategoryName.value = "";
	hideModal('#modalManageCategory');
}

function confirmDeleteCategory(categoryId, categoryName) {
	tvConfirmDeleteMessage.innerHTML = "Delete the category \"" + categoryName + "\"?\n<br>This will mark all items under this category as uncategorized.";
	btnDelete.textContent = "Delete Category";
	showModal('#modalConfirmDelete');

	btnDelete.onclick = function() {
		deleteCategory(categoryId)
	};
}

function deleteCategory(categoryId) {
	hideModal("#modalConfirmDelete");
	deleteDoc(doc(db, "categories", categoryId)).then(() => {
		console.log("DELETED PRODUCT: "+ categoryId);
	}).catch((error) => {
		console.log("COULD NOT DELETE DATA: "+ error);
	});
}