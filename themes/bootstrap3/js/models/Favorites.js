/*
* @ENHANCEMENTS
* Notifikace bootstrapGrowl - pridat before content ikony pro rozliseni stavu - info, danger..
* Sjednotit Ui Oblibenych prihlaseneho uzivatele s novym Ui neprihlaseneho uzivatele
* Install Babel - https://babeljs.io/setup#installation
* !!!!!!!!Zobrazovat confirmation pri mazani z oblibenych?
* Pridat moznost ukladat vysledky do SessionStorage? Pujde to pak vubec? Ulozi se searchId pro neprihlaseneho uzivatele?
*
* @REFACTORING
* Nekdy se pri XHR dotazu pouziva jQuery, protoze VuFind umi z POSTu ziskat data jenom kdyz je vstup FORM DATA,
* takze axios a fetchAPI standardne nefunguje. Prepsat do JS fetch API a konvertovat zasilana data do FORM data podoby.
*
* @FIXME
* u odebirani favs v search results skace DIV
* V modalu pro pridani Fav nefunguje vyhledavani
* Vytvoreni noveho seznamu udelat do modalu
* Kdyz neni zadny seznam, zobrzit rovnou vytvoreni noveho
* Kdyz se klikne v modalu na Pridat fo oblibenych, zobrazovat loading
* Kdyz je uzivatel po delsi dobe odhlasen a reloaduje vysledky, pak se uklada do SessionStorage,
* takze po zavreni okna ztrati oblibene. Je potreba do flashMessage pridat hlasku, at se pak i prihlasi.
* Po prihlaseni a prehozeni oblibenych do DB refreshovat menu se seznamy oblibenych a ne celou stranku,
* jsem-li v Mem profilu.
* SessionStorage funguje pouze pro tab, tj. nelze otevrit Oblibene v novem tabu
*
* @TODO
* Sorting
* Actions
* Responsive
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

    static saveRecord(recordId, listId = undefined, note = undefined, recordData = undefined) {
        let alreadyInFavorites = false;

        User.isLoggedIn()
            .then(() => {
                jQuery.ajax({
                    type: 'POST',
                    cache: false,
                    dataType: 'json',
                    url: VuFind.getPath() + '/AJAX/JSON?method=addRecordToFavorites',
                    data: {
                        recordId, listId, note,
                        searchClassId: recordData.searchClassId
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
                //         recordId, listId, note, recordData.searchClassId
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
                    item.type          = Favorites.RECORD_TYPE;
                    item.recordId      = recordId;
                    item.searchClassId = recordData.searchClassId;
                    item.title         = recordData.title,
                    item.published     = recordData.published,
                    item.link          = recordData.link,
                    item.cover         = recordData.cover,
                    item.author        = recordData.author,
                    item.icon = recordData.icon,

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
                searchId: document.getElementById('favoriteModalForSearch').getAttribute('data-search-id'),
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

    static removeRecord(recordId, searchClassId, removeElementId = false, showConfirmation = true) {
        if (showConfirmation && ! window.confirm(VuFind.translate('Do you really want to delete record from favorites?'))) {
            return;
        }

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
                            if (removeElementId) {
                                document.querySelector(`#${removeElementId}`).outerHTML = '';
                            }
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
                    favorites = favorites.filter((favorite) => favorite.recordId != recordId)

                    if (removeElementId) {
                        document.querySelector(`#${removeElementId}`).outerHTML = '';
                    }

                    /* Chceck if there are any favorites left */
                    if (favorites.length == 0 && /\/MyResearch\/Favorites/.test(window.location.href)) {
                        Favorites.renderOfflineFavorites();
                    }
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
        let addRecordToFavoritesButtons = document.querySelector(`#add-record-${recordHash}-to-favorites`);
        let removeRecordFromFavoritesButtons = document.querySelector(`#remove-record-${recordHash}-from-favorites`);

        if (addRecordToFavoritesButtons) {
            addRecordToFavoritesButtons.classList.toggle('hidden');
        }

        if (removeRecordFromFavoritesButtons) {
            removeRecordFromFavoritesButtons.classList.toggle('hidden');
        }
    }

    static getRecordIdHash(recordId)
    {
        return recordId.replace(/[^A-Za-z0-9 ]/g, '');
    }

    /**
     * Move favorites from session to database
     */
    static saveFavoritesToDb() {

        let favorites = Favorites.getSessionFavorites();
        if (favorites.length == 0) {
            return;
        }
        //
        // jQuery.ajax({
        //     type: 'POST',
        //     cache: false,
        //     dataType: 'json',
        //     url: VuFind.getPath() + '/AJAX/JSON?method=pushFavorites',
        //     data: {
        //         favorites
        //     },
        //     success: function(response) {
        //         if (response.status == 200) {
        //             //window.sessionStorage.removeItem('favorites');
        //             location.reload();
        //         }
        //         // if (response.status == 200 && !response.data.isOnMyProfile) {
        //         // TODO reload favorites list in Menu instead previous location.reload(); Existing ticken in bugzilla.
        //         // }
        //     }
        // });

        jQuery.post('/AJAX/JSON?method=pushFavorites', {favorites})
              .success(function(response) {
                  if (response.status == 200) {
                      Favorites.removeSessionFavorites();
                      location.reload();
                  }
                  // if (response.status == 200 && !response.data.isOnMyProfile) {
                  // TODO reload favorites list in Menu instead previous location.reload(); Existing ticken in bugzilla.
                  // }
              });
    }

    /**
     * Remove all session favorites
     */
    static removeSessionFavorites() {
        window.sessionStorage.removeItem('favorites');
    }

    /**
     * Render offline favorites
     */
    static renderOfflineFavorites() {
        let favorites = Favorites.getSessionFavorites();
        let html = '';

        if (favorites.length == 0) {
            document.querySelector('#offline-favorites-container')
                    .innerHTML = `
                        <div class='text-center'>
                          <p>${VuFind.translate('You do not have any saved resources')}</p>
                        </div>
                    `;
            document.querySelector('#favorites-list-header-content').classList.add('hidden');
            return;
        }

        favorites.some(function(favorite) {
            if (favorite.type == Favorites.RECORD_TYPE) {
                html += `
                  <div class='row well result' id='offlineFavoriteFor${Favorites.getRecordIdHash(favorite.recordId)}'>
                      <div class='col-xs-2 left'>
                        <label class='pull-left flip'>
                          <input class='checkbox-select-item' 
                                 type='checkbox' 
                                 name='recordIds[]' 
                                 data-search-class-id='${favorite.recordId}'
                                 data-record-id-hash='${Favorites.getRecordIdHash(favorite.recordId)}'
                                 value='${favorite.recordId}'>
                        </label>
                        <input type='hidden' value='${favorite.recordId}' class='hiddenId'/>
                        <div class='coverThumbnail'>
                          ${favorite.cover ? favorite.cover : favorite.icon}
                        </div>
                      </div>
                      
                      <div class='col-xs-8 middle'>
                        <div class='root-title'>
                          <a class='title' href='${favorite.link}'>
                            ${favorite.title}
                          </a>
                        </div>
                    
                        <div class='author-info'>
                            ${favorite.author ? favorite.author : ''}
                        </div>
                        <div class='summDate'>
                            ${favorite.published ? favorite.published : favorite.published}
                        </div>
                      </div>
                      
                      <div class='col-xs-2 right'>
                        <a onclick='VuFind.removeFromFavorites(
                            "${favorite.recordId}",
                            "${favorite.searchClassId}",
                            "offlineFavoriteFor${Favorites.getRecordIdHash(favorite.recordId)}"
                          );'>
                          <i class='pr-editorial-trashcan'></i> 
                          ${VuFind.translate('Delete')}
                        </a>
                      </div>
                    </div>

                `;
            }
        });

        document.querySelector('#offline-favorites-container').innerHTML = html;
        document.querySelector('#favorites-list-header-content').classList.remove('hidden');
        jQuery.bootstrapGrowl(VuFind.translate('you_have_unsaved_favorites'), {
            type: 'info',
            ele: 'body',
            offset: {
                from: 'top',
                amount: 40
            },
            align: 'right',
            width: 300,
            delay: 0,
            allow_dismiss: true,
            stackup_spacing: 10
        });
    }
}