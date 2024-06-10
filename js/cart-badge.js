import { db, auth } from '../js/firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js';
import { collection, query, getCountFromServer } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js';

const badgeCart = document.querySelector("#badgeCart");

onAuthStateChanged(auth, user => {
	renderCartBadge();
});

export async function renderCartBadge () {
	const qryCartCount = query(collection(db, "carts", auth.currentUser.uid, "items"));

	const snapshot = await getCountFromServer(qryCartCount);

	const numberOfItems = snapshot.data().count;

	if (numberOfItems < 1) {
		badgeCart.classList.toggle("d-none", true);
		return;
	}

	badgeCart.classList.toggle("d-none", false);
	badgeCart.innerHTML = numberOfItems;
}