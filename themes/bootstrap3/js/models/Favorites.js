/*
* TODO PLAN
* Remove offlineFavorites
* Remove template pro ulozeni do Oblibenych pri prihlasene (recordLink()->getActionUrl($this->driver, 'Save'))
* Remove $_ENV['currentRecordNo']
* Remove offlineFavoritesEnabled
* Notifikace bootstrapGrowl - pridat before content ikony pro rozliseni stavu - info, danger..
* Install Babel - https://babeljs.io/setup#installation
* Zobrazovat confirmation pri mazani z oblibenych?
*
* FIXME
* u odebirani favs v search results skace DIV
* V modalu pro pridani Fav nefunguje vyhledavani
* Vytvoreni noveho seznamu udelat do modalu
* Kdyz neni zadny seznam, zobrzit rovnou vytvoreni noveho
* Pri pridavani fav do DB se pouziva jQuery,
* protoze VuFind umi z POSTu ziskat data jenom kdyz je vstup FORM DATA, takze axios a fetchAPI standardne nefunguje
* Kdyz se klikne v modalu na Pridat fo oblibenych, zobrazovat loading
* Kdyz je uzivatel po delsi dobe odhlasen a reloaduje vysledky, pak se uklada do SessionStorage,
* takze po zavreni okna ztrati oblibene. Je potreba do flashMessage pridat hlasku, at se pak i prihlasi.
*
* TODO STEPS

* V navigaci zobrazovat NavItem Oblibene
* Moznost ulozit/smazat 1 record z core
* Moznost ulozit vysledky vyhledavani
* Administrace ulozenych
*/

import User from './User.js';

const RECORD_TYPE = 'RECORD';
const SEARCH_TYPE = 'SEARCH';

export default class Favorites {

    static get RECORD_TYPE() {
        return RECORD_TYPE;
    }

    static get SEARCH_TYPE() {
        return SEARCH_TYPE;
    }

    static openFavoritesModal(recordId, title) {
        let recordHash = Favorites.getRecordIdHash(recordId);

        sessionStorage.setItem('favoriteToAdd', {
            type: Favorites.RECORD_TYPE,
            recordId: recordId,
            title: title,
        });
        document.getElementById(`favoriteModalForRecord${recordHash}Title`).innerHTML = title;
        jQuery(`#favoriteModalForRecord${recordHash}`).modal('show');
    };

    static saveRecord(recordId, listId = undefined, note = undefined, searchClassId = undefined) {
        let alreadyInFavorites = false;

        User.isLoggedIn()
            .then(() => {
                jQuery.ajax({
                    type: 'POST',
                    cache: false,
                    dataType: 'json',
                    url: VuFind.getPath() + '/AJAX/JSON?method=addRecordToFavorites',
                    data: {
                         recordId, listId, note, searchClassId
                    },
                    success: function( response ) {
                        if (response.status == 200) {
                            VuFind.flashMessage('record_added_to_favorites');
                            Favorites.swapButtons(recordId);
                        } else {
                            VuFind.flashMessage('could_not_save_record_to_favorites');
                        }
                    },
                    error: function ( xmlHttpRequest, status, error ) {
                        console.error(error);
                        VuFind.flashMessage('could_not_save_record_to_favorites');
                    }
                });

                /* Save to DB */
                // axios.post(
                //     '/AJAX/JSON?method=addRecordToFavorites',
                //     {
                //         recordId, listId, note, searchClassId
                //     })

                    // .then((response) => response.json())
                    // .then((response) => {
                    //     if (response.status == 200) {
                    //         VuFind.flashMessage('record_added_to_favorites');
                    //         Favorites.swapButtons(recordId);
                    //     }
                    //     VuFind.flashMessage('could_not_save_record_to_favorites');
                    // })
                    // .catch((error) => {
                    //     console.error(error);
                    //     VuFind.flashMessage('could_not_save_record_to_favorites');
                    // });
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

                    Favorites.swapButtons(recordId);

                    VuFind.flashMessage('record_added_to_favorites');
                }
            });
    }

    static removeRecord(recordId, searchClassId) {
        User.isLoggedIn()
            .then(() => {
                /* Save to DB */

                jQuery.ajax({
                    type: 'POST',
                    cache: false,
                    dataType: 'json',
                    url: VuFind.getPath() + '/AJAX/JSON?method=removeRecordFromFavorites',
                    data: {
                        recordId, searchClassId
                    },
                    success: function( response ) {
                        if (response.status == 200) {
                            VuFind.flashMessage('record_removed_from_favorites');
                            Favorites.swapButtons(recordId);
                        } else {
                            VuFind.flashMessage('could_not_remove_record_from_favorites');
                        }
                    },
                    error: function ( xmlHttpRequest, status, error ) {
                        console.error(error);
                        VuFind.flashMessage('could_not_remove_record_from_favorites');
                    }
                });
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

                Favorites.swapButtons(recordId);

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

    static swapButtons(recordId)
    {
        let recordHash = Favorites.getRecordIdHash(recordId);

        /* Swap buttons */
        document.getElementById('add-record-' + recordHash + '-to-favorites').classList.toggle('hidden');
        document.getElementById('remove-record-' + recordHash    + '-from-favorites').classList.toggle('hidden');
    }

    static getRecordIdHash(recordId)
    {
        return recordId.replace(/[^A-Za-z0-9 ]/g, '');
    }
}