/*
* @ENHANCEMENTS
* Notifikace bootstrapGrowl - pridat before content ikony pro rozliseni stavu - info, danger..
* Sjednotit Ui Oblibenych prihlaseneho uzivatele s novym Ui neprihlaseneho uzivatele
* Install Babel - https://babeljs.io/setup#installation
* Pridat moznost ukladat vysledky do SessionStorage? Pujde to pak vubec? Ulozi se searchId pro neprihlaseneho uzivatele?
* Sort offline favorites ASC/DESC
* Vytvoreni noveho seznamu udelat do modalu. Pri otevreni modalu pro pridani Oblibenych nacitat seznam asynchronne,
* protoze kdyz si vytvorim seznam a pridam
* zaznam, zavru a pak pridam dalsi, vidim porad stare seznamy nactene z PHP on page load.
* Pridat strankovani
*
* @REFACTORING
* Nekdy se pri XHR dotazu pouziva jQuery, protoze VuFind umi z POSTu ziskat data jenom kdyz je vstup FORM DATA,
* takze axios a fetchAPI standardne nefunguje. Prepsat do JS fetch API a konvertovat zasilana data do FORM data podoby.
* Zkusit pomoci new FormData() https://developer.mozilla.org/en-US/docs/Web/API/FormData/Using_FormData_Objects
*
* @FIXME
* Kdyz je uzivatel po delsi dobe odhlasen a reloaduje vysledky, pak se uklada do SessionStorage,
* takze po zavreni okna ztrati oblibene. Je potreba do flashMessage pridat hlasku, at se pak i prihlasi.
*
* SessionStorage se po prihlaseni smaze jenom v aktualnim tabu. V jinych tabech zustavaju oblibene nadale
* v sessionStorage a po otevreni dalsich tabu se z nich sessionStorage siri dal. Je potreba rozpoznavat ktery je master
* tab a ktery slave. Po prihlaseni by se ve slave tabech mela upravit sessionStorage podle master tabu.
*
* Responsive (zejmena na mobilech)
* Do GA se pripisuje pouze klik na Pridani do oblibenych ve vysledcich vyhledavani. Ne v uplnem zobrazeni ani v profilu,
* a take na odstraneni z oblibenych ani zadne dalsi akce s Oblibenymi.
*
* Je potreba upravit sablonu stranky, na ktere se zobrazuji Oblibene odeslane emailem. Napr.:
* https://knihovny.cz/Records/Home?email=1&id%5B%5D=Solr%7Cvkol.SVK01-001162058&id%5B%5D=Solr%7Csvkpk.PNA01-000701007
*
* @TODO
* Kontrola compare pull request
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

    /**
     * Open FavoriteRecordModal
     * @param String recordId
     * @param String title
     */
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

    /**
     * Open FavoriteSearchModal
     */
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

    /**
     * Save record to favorites
     * @param String recordId
     * @param Integer listId
     * @param String note
     * @param Object recordData
     */
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
                        searchClassId: recordData.searchClassId,
                        created: new Date().getTime(),
                    },
                    beforeSend: function() {
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
                    complete: function() {
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
                    item.icon          = recordData.icon,
                    item.created       = new Date().getTime();

                    favorites.push(item);
                    sessionStorage.setItem('favorites', JSON.stringify(favorites));

                    Favorites.swapButtons(recordId);

                    VuFind.flashTranslation('record_added_to_favorites');
                }
            });
    }

    /**
     * Add search results to favorites
     */
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
            beforeSend: function() {
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
            complete: function() {
                let bodyElement = document.getElementsByTagName('body')[0];
                bodyElement.style.cursor = 'default';
            },
            error: function ( xmlHttpRequest, status, error ) {
                console.error(error);
                VuFind.flashTranslation('could_not_save_search_results_to_favorites');
            }
        });
    }

    /**
     * Remove record from favorites
     * @param String recordId
     * @param String searchClassId
     * @param String removeElementId
     * @param Boolean showConfirmation
     */
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
                    beforeSend: function() {
                        let bodyElement = document.getElementsByTagName('body')[0];
                        bodyElement.style.cursor = 'wait';
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
                    complete: function() {
                        let bodyElement = document.getElementsByTagName('body')[0];
                        bodyElement.style.cursor = 'default';
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

                favorites = favorites.filter((favorite) => favorite.recordId != recordId);

                if (removeElementId) {
                    document.querySelector(`#${removeElementId}`).outerHTML = '';
                }

                Favorites.saveFavoritesToSession(favorites);

                Favorites.swapButtons(recordId);

                /* Chceck if there are any favorites left */
                if (favorites.length == 0 && /\/MyResearch\/Favorites/.test(window.location.href)) {
                    Favorites.renderOfflineFavorites();
                }

                VuFind.flashTranslation('record_removed_from_favorites');
            });
    }

    /**
     * Save offline favorites to session storage
     * @param Array favorites
     */
    static saveFavoritesToSession(favorites) {
        sessionStorage.setItem('favorites', JSON.stringify(favorites));
    }

    /**
     * Get offline favorites from session storage
     * @return Array favorites
     */
    static getSessionFavorites() {
        let favorites = JSON.parse(sessionStorage.getItem('favorites'));

        if (favorites === null || (Array.isArray(favorites) && ! favorites.length)) {
            return [];
        }

        return favorites;
    }

    /**
     * Swap buttons
     * @param String recordId
     */
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

    /**
     * Get sanitized record ID
     * @param String recordId
     * @return String
     */
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

        jQuery.ajax({
            type: 'POST',
            cache: false,
            dataType: 'json',
            url: '/AJAX/JSON?method=pushFavorites',
            data: {favorites},
            success: function(response) {
                if (response.status == 'OK' && response.data.isOnMyProfile) {
                    // Add new list
                    let anchorElement = document.createElement('a');
                    anchorElement.href = `/MyResearch/MyList/${response.data.newListId}`;
                    anchorElement.classList.add('list-group-item');
                    anchorElement.innerHTML = `
                        ${response.data.newListTitle} 
                        <span class='badge'>${response.data.newListCount}</span>
                    `;
                    document.querySelector('#favorites-menu-list').prepend(anchorElement);
                    Favorites.removeSessionFavorites();
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error(jqXHR);
                console.error(textStatus);
                console.error(errorThrown);
            }
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
                                 data-search-class-id='${favorite.searchClassId}'
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
    }

     /**
     * Sort session favorites
     * @param String param [title|author|created]
     * @return Array Sorted Favorites
     */
    static sortFavoritesBy(param) {
        if (['title', 'author'].includes(param)) {
            Favorites.saveFavoritesToSession(
                Favorites.getSessionFavorites().sort((a, b) => a[param].localeCompare(b[param]))
            );
        }

        if (['created'].includes(param)) {
            Favorites.saveFavoritesToSession(
                Favorites.getSessionFavorites().sort((a, b) => a[param] - b[param])
            );
        }
    }

    /**
     * Send favorites via email
     * @return {boolean}
     */
    static sendFavoritesViaEmail() {
        let to = document.querySelector('#email-favorites-to').value;
        let from = document.querySelector('#email-favorites-from').value;
        let message = document.querySelector('#email-favorites-message').value;

        let checkedBoxes = document.querySelectorAll('input[name="recordIds[]"]:checked');

        let ids = [];
        checkedBoxes.forEach((checkbox) => {
            ids.push(`${checkbox.getAttribute('data-search-class-id')}|${checkbox.value}`);
        });

        if (!ids || !to || !from) {
            VuFind.flashTranslation('required fields not filled');
            return false;
        }

        jQuery.ajax({
            type: 'POST',
            cache: false,
            url: '/AJAX/JSON?method=sendFavoritesViaEmail',
            dataType: 'json',
            data: {to, from, message, ids},
            beforeSend: function() {
                let bodyElement = document.getElementsByTagName('body')[0];
                bodyElement.style.cursor = 'wait';
            },
            success: function( response ) {
                if (response.status == 200) {
                    VuFind.flashTranslation('Email sent');
                    jQuery(`#emailFavoritesModal`).modal('hide' );
                } else if (response.status == 400) {
                    VuFind.flashTranslation(response.data.message);
                } else {
                    VuFind.flashTranslation('could_not_send_favorites');
                }
            },
            complete: function() {
                let bodyElement = document.getElementsByTagName('body')[0];
                bodyElement.style.cursor = 'default';
            },
            error: function ( xmlHttpRequest, status, error ) {
                console.error(xmlHttpRequest);
                console.error(status);
                console.error(error);
                VuFind.flashTranslation('could_not_send_favorites');
            }
        });
    }

    /**
     * Export offline favorites
     */
    static exportOfflineFavorites() {
        let formatElement = document.querySelector('#favorites-export-options');
        let format = formatElement.options[formatElement.selectedIndex].value;

        let checkedBoxes = document.querySelectorAll('input[name="recordIds[]"]:checked');

        let ids = [];
        checkedBoxes.forEach((checkbox) => {
            ids.push(`${checkbox.getAttribute('data-search-class-id')}|${checkbox.value}`);
        });

        jQuery.ajax({
            type: 'POST',
            cache: false,
            url: '/AJAX/JSON?method=exportOfflineFavorites',
            dataType: 'json',
            data: {format, ids},
            beforeSend: function() {
                let bodyElement = document.getElementsByTagName('body')[0];
                bodyElement.style.cursor = 'wait';
            },
            success: function( response ) {
                if (response.status == 200) {
                    VuFind.flashTranslation('export_success');
                    document.querySelector('#favorites-export-file-container').innerHTML = response.data.html;
                } else if (response.status == 307) {
                    let tab = window.open(response.data.redirection_link, '_blank');
                    if (tab) {
                        tab.focus();
                    }
                }
            },
            complete: function() {
                let bodyElement = document.getElementsByTagName('body')[0];
                bodyElement.style.cursor = 'default';
            },
            error: function ( xmlHttpRequest, status, error ) {
                console.error(xmlHttpRequest);
                console.error(status);
                console.error(error);
            }
        });
    }
}