import Favorites from './models/Favorites.js';
import User from './models/User.js';

VuFind.addToFavorites = (recordId, online = false, recordData = undefined) => {
    let recordHash = Favorites.getRecordIdHash(recordId);

    let listId = undefined;
    let note = undefined;
    let action = undefined;
    let listData = undefined;

    if (online) {
        const selectElement = document.getElementById(`favoritesListFor${recordHash}`);
        if (selectElement) {
            listId = selectElement.options[selectElement.selectedIndex].value;
        }
        note = document.getElementById(`favoritesListFor${recordHash}Note`).value;

        // Detect action (Select list ID or Create new list)
        if (document.querySelector(`#favoriteModalForRecord${recordHash} #favorites-lists-tab`)
                    .classList
                    .contains('active')) {
            action = 'existing';
        } else {
            action = 'new';
            listData = {};
            listData.title = document.querySelector(`#newFavoritesListFor${recordHash}Title`).value;
            listData.description = document.querySelector(`#newFavoritesListFor${recordHash}Description`).value;
        }
    }

    // Validation
    if (action == 'existing' && !listId) {
        VuFind.flashTranslation('Select or create favorites list first');
        return false;
    }

    if (action == 'new' && !listData.title) {
        VuFind.flashTranslation('Select or create favorites list first');
        return false;
    }

    if (recordData) {
        recordData.published = document.querySelector(`#resultFor${recordHash} .summDate`)
            ? document.querySelector(`#resultFor${recordHash} .summDate`)
                      .innerHTML.replace(/\s/g,'')
                      .replace(/<(?:.|\n)*?>/gm, '')
            : false;

        recordData.author = document.querySelector(`#resultFor${recordHash} .author-info`)
            ? document.querySelector(`#resultFor${recordHash} .author-info`).innerHTML.trim()
            : false;
        recordData.cover = document.querySelector(`#resultFor${recordHash} .cover_thumbnail`)
            ? document.querySelector(`#resultFor${recordHash} .cover_thumbnail`).innerHTML
            : false;
        recordData.icon = document.querySelector(`#resultFor${recordHash} .iconlabel`)
            ? document.querySelector(`#resultFor${recordHash} .iconlabel`).innerHTML
            : false;
    }

    Favorites.saveRecord(recordId, listId, note, recordData, action, listData);
};

VuFind.addSearchToFavorites = () => Favorites.addSearchToFavorites();

VuFind.openFavoriteRecordModal = (recordId, recordTitle) => Favorites.openFavoriteRecordModal(recordId, recordTitle);

VuFind.openFavoriteSearchModal = () => Favorites.openFavoriteSearchModal();

VuFind.addSearchToFavorites = () => Favorites.addSearchToFavorites();

VuFind.hasOfflineFavorites = () => Favorites.getSessionFavorites().length > 0;

VuFind.removeFromFavorites = (recordId, searchClassId, removeFromFavorites = false, showConfirmation = true) => {
    Favorites.removeRecord(recordId, searchClassId, removeFromFavorites, showConfirmation);
};

VuFind.saveFavoritesToDb = () => Favorites.saveFavoritesToDb();

VuFind.sortOfflineFavoritesBy = (param) => {
    Favorites.sortFavoritesBy(param);
    Favorites.renderOfflineFavorites();
    document.querySelector('#sort-favorites-by-param-container').innerHTML = VuFind.translate(
        param == 'created' ? 'By addition time' : param == 'title' ? 'By Title' : param == 'author' ? 'By Author' : ''
    );
};

VuFind.renderOfflineFavorites = () => Favorites.renderOfflineFavorites();

VuFind.sendFavoritesViaEmail = () => Favorites.sendFavoritesViaEmail();
VuFind.exportOfflineFavorites = () => Favorites.exportOfflineFavorites();

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
