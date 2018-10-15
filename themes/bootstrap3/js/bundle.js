import Favorites from './models/Favorites.js';
import User from './models/User.js';

VuFind.addToFavorites = function(recordId) {
    Favorites.saveRecord(recordId);
};

VuFind.removeFromFavorites = function(recordId) {
    Favorites.removeRecord(recordId);
};

document.addEventListener('DOMContentLoaded', function() {
    let mainContainerElement = document.getElementById('main-container')
    if (mainContainerElement) {
        /* Load SessionFavorites */
        if (mainContainerElement.getAttribute('data-templateName') == 'results') {
            User.isLoggedIn()
                .catch(() => { // If not logged in, load session favorites
                    let favorites = Favorites.getSessionFavorites();
                    if (favorites.length > 0) {
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
                                /* Swap buttons */
                                document.getElementById('add-record-' + recordId + '-to-favorites').classList.toggle('hidden');
                                document.getElementById('remove-record-' + recordId + '-from-favorites').classList.toggle('hidden');
                            }
                        });
                    }
                });
        }
    }
});
