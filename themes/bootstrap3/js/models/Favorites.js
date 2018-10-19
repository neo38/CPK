/*
* TODO PLAN
* Remove offlineFavorites
* Remove template pro ulozeni do Oblibenych pri prihlasene (recordLink()->getActionUrl($this->driver, 'Save'))
* Remove $_ENV['currentRecordNo']
* Remove offlineFavoritesEnabled
* Notifikace bootstrapGrowl - pridat before content ikony pro rozliseni stavu - info, danger..
* Install Babel - https://babeljs.io/setup#installation
* Zobrazovat confirmation pri mazani z oblibenych?
* Pridat moznost ukladat vysledky do SessionStorage? Pujde to pak vubec? Ulozi se searchId pro neprihlaseneho uzivatele?
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
* Add favortites to modal - udelat jako componentu, ted se opakuje 3 krat stejny kod
* Zobrazeni linku pro add/remove favorites - udelat take jako komponentu?
* Kdyz sa zmenit async dotaz, neaktualizuje se nazev noveho Listu v moddalu na oblibene vysledku vyhledavani a take
* se ulozi vysledky ze stareho vyhledavani
*
* TODO STEPS
*
* V navigaci zobrazovat NavItem Oblibene
* Administrace ulozenych
* Smazat themes/bootstrap3/js/ng-cpk/favorites
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

    static openFavoriteRecordModal(recordId, title) {
        let recordHash = Favorites.getRecordIdHash(recordId);

        sessionStorage.setItem('favoriteToAdd', {
            type: Favorites.RECORD_TYPE,
            recordId: recordId,
            title: title,
        });
        document.getElementById(`favoriteModalForRecord${recordHash}Title`).innerHTML = title;
        jQuery(`#favoriteModalForRecord${recordHash}`).modal('show');
    };

    static openFavoriteSearchModal() {
        let lookForElement = undefined;
        if (lookForElement = document.getElementsByName('last_searched_lookfor0')[0]) {
            let newFavoritesListTitleElement = undefined;
            if (newFavoritesListTitleElement = document.getElementById('newFavoritesListTitle')) {
                let newValue = VuFind.translate('Search query') + ': ' + VuFind.escapeHtml(lookForElement.value);
                newFavoritesListTitleElement.value = newValue;
                newFavoritesListTitleElement.placeholder = newValue;
            }
        }
        jQuery(`#favoriteModalForSearch`).modal('show');
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
                    beforeSend() {
                        let bodyElement = document.getElementsByTagName('body')[0];
                        bodyElement.style.cursor = 'wait';
                    },
                    success: function( response ) {
                        if (response.status == 200) {
                            VuFind.flashTranslation('record_added_to_favorites');
                            Favorites.swapButtons(recordId);
                        } else {
                            VuFind.flashTranslation('could_not_save_record_to_favorites');
                        }
                    },
                    complete() {
                        let bodyElement = document.getElementsByTagName('body')[0];
                        bodyElement.style.cursor = 'default';
                    },
                    error: function ( xmlHttpRequest, status, error ) {
                        console.error(error);
                        VuFind.flashTranslation('could_not_save_record_to_favorites');
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
                    //         VuFind.flashTranslation('record_added_to_favorites');
                    //         Favorites.swapButtons(recordId);
                    //     }
                    //     VuFind.flashTranslation('could_not_save_record_to_favorites');
                    // })
                    // .catch((error) => {
                    //     console.error(error);
                    //     VuFind.flashTranslation('could_not_save_record_to_favorites');
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

                    VuFind.flashTranslation('record_added_to_favorites');
                }
            });
    }

    static addSearchToFavorites() {
        $.ajax({
            type: 'POST',
            cache: false,
            dataType: 'json',
            url: VuFind.getPath() + '/AJAX/JSON?method=addResultsToFavorites',
            data: {
                numberOfRecords: document.getElementById('numberOfRecordsToAdd').value,
                searchId: document.getElementsByClassName('data-search-id')[0].getAttribute('data-search-id'),
                title: document.getElementById('newFavoritesListTitle').value,
            },
            beforeSend() {
                let bodyElement = document.getElementsByTagName('body')[0];
                bodyElement.style.cursor = 'wait';
            },
            success: function( response ) {
                if (response.status == 'OK') {
                    VuFind.flashTranslation('search_results_added_to_favorites');
                    document.getElementById('add-search-results-to-favorites-container').classList.add('hidden');
                } else if (response.status == 'ERROR') {
                    VuFind.flashMessage(response.data);
                } else {
                    VuFind.flashTranslation('could_not_save_search_results_to_favorites');
                }
            },
            complete() {
                let bodyElement = document.getElementsByTagName('body')[0];
                bodyElement.style.cursor = 'default';
            },
            error: function ( xmlHttpRequest, status, error ) {
                console.error(error);
                VuFind.flashTranslation('could_not_save_search_results_to_favorites');
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
                            VuFind.flashTranslation('record_removed_from_favorites');
                            Favorites.swapButtons(recordId);
                        } else {
                            VuFind.flashTranslation('could_not_remove_record_from_favorites');
                        }
                    },
                    error: function ( xmlHttpRequest, status, error ) {
                        console.error(error);
                        VuFind.flashTranslation('could_not_remove_record_from_favorites');
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

                VuFind.flashTranslation('record_removed_from_favorites');
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