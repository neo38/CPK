/*
* TODO PLAN
* Remove offlineFavorites
* Remove template pro ulozeni do Oblibenych pri prihlasene (recordLink()->getActionUrl($this->driver, 'Save'))
* Remove $_ENV['currentRecordNo']
* Remove offlineFavoritesEnabled
* Notifikace bootstrapGrowl - pridat before content ikony pro rozliseni stavu - info, danger..
* Install Babel - https://babeljs.io/setup#installation
*
* FIXME
* u odebirani favs v search results skace DIV
*
* TODO STEPS
* Nacist Oblibene z DB pro search resultsVuFind.removeFromFavorites
* ukladatFavorites do DB
* mazat Favorites z DB
* upravit strukturu DB?
* */

import User from './User.js'

const RECORD_TYPE = 'RECORD';
const SEARCH_TYPE = 'SEARCH';

export default class Favorites {

    static get RECORD_TYPE() {
        return RECORD_TYPE;
    }

    static get SEARCH_TYPE() {
        return SEARCH_TYPE;
    }

    static saveRecord(recordId) {
        let alreadyInFavorites = false;
        console.info('Add '+recordId+' to favorites.');
        User.isLoggedIn()
            .then(() => {
                /* Save to DB */
                // TODO save favorite do DB
                VuFind.flashMessage('record_added_to_favorites');
            })
            .catch(() => {
                /* Save to SessionStorage */
                let favorites = Favorites.getSessionFavorites();

                if (favorites.length > 0) {
                    favorites.forEach(favorite => {
                        if (favorite.recordId && favorite.recordId == recordId) {
                            alreadyInFavorites = true;
                        }
                    });
                }

                if (!alreadyInFavorites) {
                    let item = {};
                    item.type = Favorites.RECORD_TYPE;
                    item.recordId = recordId;

                    favorites.push(item);
                    sessionStorage.setItem('favorites', JSON.stringify(favorites));

                    /* Swap buttons */
                    document.getElementById('add-record-' + recordId + '-to-favorites').classList.toggle('hidden');
                    document.getElementById('remove-record-' + recordId + '-from-favorites').classList.toggle('hidden');

                    VuFind.flashMessage('record_added_to_favorites');
                }
            });
    }

    static removeRecord(recordId) {
        User.isLoggedIn()
            .then(() => {
                /* Save to DB */
                // TODO remove favorite from DB
                VuFind.flashMessage('record_removed_from_favorites');
            })
            .catch(() => {
                /* Remove from SessionStorage */
                let favorites = Favorites.getSessionFavorites();

                if (favorites.length > 0) {
                    favorites.some(function(favorite, key) {
                        if (favorite.recordId && favorite.recordId == recordId) {
                            favorites.splice(key, 1);
                            return true;
                        }
                    });
                }

                sessionStorage.setItem('favorites', JSON.stringify(favorites));

                /* Swap buttons */
                document.getElementById('add-record-' + recordId + '-to-favorites').classList.toggle('hidden');
                document.getElementById('remove-record-' + recordId + '-from-favorites').classList.toggle('hidden');

                VuFind.flashMessage('record_removed_from_favorites');
            });
    }

    static getSessionFavorites() {
        let favorites = JSON.parse(sessionStorage.getItem('favorites'));

        if (favorites === null || (Array.isArray(favorites) && ! favorites.length)) {
            return [];
        }

        return favorites;
    }
}