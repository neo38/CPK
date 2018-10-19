import Favorites from './models/Favorites.js';
import User from './models/User.js';

VuFind.addToFavorites = function(recordId, online = false, searchClassId = undefined) {
    let recordHash = Favorites.getRecordIdHash(recordId);

    let listId = undefined;
    let note = undefined;

    if (online) {
        const selectElement = document.getElementById(`favoritesListFor${recordHash}`);

        listId = selectElement.options[selectElement.selectedIndex].value;
        note = document.getElementById(`favoritesListFor${recordHash}Note`).value;
    }

    Favorites.saveRecord(recordId, listId, note, searchClassId);
};

VuFind.addSearchToFavorites = function() {
    Favorites.addSearchToFavorites();
};

VuFind.openFavoriteRecordModal = function(recordId, recordTitle) {
    Favorites.openFavoriteRecordModal(recordId, recordTitle);
};

VuFind.openFavoriteSearchModal = function() {
    Favorites.openFavoriteSearchModal();
};

VuFind.removeFromFavorites = function(recordId, searchClassId) {
    Favorites.removeRecord(recordId, searchClassId);
};

document.addEventListener('DOMContentLoaded', function() {
    let mainContainerElement = document.getElementById('main-container')
    if (mainContainerElement) {
        /* Load SessionFavorites */
        if (['results', 'view'].includes(mainContainerElement.getAttribute('data-templateName'))) {
            User.isLoggedIn()
                .catch(() => { // If not logged in, load session favorites
                    let favorites = Favorites.getSessionFavorites();

                    if (favorites.length == 0) {
                        return;
                    }

                    let recordsElements = document.getElementsByClassName('add-record-to-favorites-link');

                    Array.prototype.forEach.call(recordsElements, function(element) {
                        let recordId = element.getAttribute('data-recordId');
                        let alreadyInFavorites = false;

                        Array.prototype.forEach.call(favorites, function(item) {
                            if (item.recordId == recordId) {
                                alreadyInFavorites = true;
                                return false;
                            }
                        });

                        if (alreadyInFavorites) {
                            Favorites.swapButtons(recordId);
                        }
                    });
                });
        }
    }
});
