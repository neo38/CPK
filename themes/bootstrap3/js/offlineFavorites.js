/**
 * On page load render offline favorites
 */
document.addEventListener('DOMContentLoaded',() => {
    VuFind.renderOfflineFavorites();

    if (VuFind.hasOfflineFavorites) {
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
});

/**
 * Delete selected favorites
 */
function deleteSelectedFavorites() {
    let checkedBoxes = document.querySelectorAll('input[name="recordIds[]"]:checked');

    if (checkedBoxes.length > 1
        && ! window.confirm(VuFind.translate('Do you really want to delete selected records from favorites?'))) {
        return;
    }

    if (checkedBoxes.length == 1
        && ! window.confirm(VuFind.translate('Do you really want to delete record from favorites?'))) {
        return;
    }

    checkedBoxes.forEach((checkbox) => {
        VuFind.removeFromFavorites(
            checkbox.value,
            checkbox.getAttribute('data-search-class-id'),
            `offlineFavoriteFor${checkbox.getAttribute('data-record-id-hash')}`,
            false
        )
    });
}

/**
 * Show emailFavoritesModal
 */
function emailSelectedFavorites() {
    let checkedBoxes = document.querySelectorAll('input[name="recordIds[]"]:checked');

    if (checkedBoxes.length == 0) {
        return;
    }

    let html = '';
    checkedBoxes.forEach((checkbox) => {
        html += `<input type='hidden' 
                        name='ids[]' 
                        value='${checkbox.getAttribute('data-search-class-id')}|${checkbox.value}'>`;
    });
    document.querySelector('#email-ids-container').innerHTML = html;

    jQuery(`#emailFavoritesModal`).modal('show');
}

/**
 * Show ExportFavoritesModal
 */
function showExportFavoritesModal() {
    let checkedBoxes = document.querySelectorAll('input[name="recordIds[]"]:checked');

    if (checkedBoxes.length == 0) {
        return;
    }

    let ids = [];
    checkedBoxes.forEach((checkbox) => {
        ids.push(`${checkbox.getAttribute('data-search-class-id')}|${checkbox.value}`);
    });

    jQuery.ajax({
        type: 'POST',
        cache: false,
        url: '/AJAX/JSON?method=getAvailableExportOptions',
        dataType: 'json',
        data: {ids},
        beforeSend: function() {
            let bodyElement = document.getElementsByTagName('body')[0];
            bodyElement.style.cursor = 'wait';
        },
        success: function( response ) {
            if (response.status == 200) {
                let html = '';
                response.data.exportOptions.forEach((option) => {
                    html += `<option value='${option}'>${VuFind.translate(option)}</option>`;
                });
                document.querySelector('#favorites-export-options').innerHTML = html;
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

    document.querySelector('#favorites-export-file-container').innerHTML = '';

    jQuery(`#exportFavoritesModal`).modal('show');
}

/**
 * Print selected favorites
 */
function printSelectedFavorites() {
    let checkedBoxes = document.querySelectorAll('input[name="recordIds[]"]:checked');

    if (checkedBoxes.length == 0) {
        return;
    }

    let printLocation = '/Records/Home?print=1';

    checkedBoxes.forEach((checkbox) => {
        printLocation += `&id[]=${checkbox.getAttribute('data-search-class-id')}|${checkbox.value}`;
    });
    window.open(printLocation, '_blank').focus();
}

/**
 * Select all favorites checkboxes
 * @param Event source
 */
function selectAllFavorites(source) {
    let checkboxes = document.querySelectorAll('input[name="recordIds[]"]');
    for (let i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i] != source) {
            checkboxes[i].checked = source.checked;
        }
    }
}