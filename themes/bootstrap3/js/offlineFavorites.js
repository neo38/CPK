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

function deleteSelectedFavorites() {

    let checkedBoxes = document.querySelectorAll('input[name="recordIds[]"]:checked');

    if (checkedBoxes.length > 1 && ! window.confirm(VuFind.translate('Do you really want to delete selected records from favorites?'))) {
        return;
    }

    if (checkedBoxes.length == 1 && ! window.confirm(VuFind.translate('Do you really want to delete record from favorites?'))) {
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

function emailSelectedFavorites() {
    let checkedBoxes = document.querySelectorAll('input[name="recordIds[]"]:checked');

    if (checkedBoxes.length == 0) {
        return;
    }

    checkedBoxes.forEach((checkbox) => {
        //
    });
}

function showExportFavoritesModal() {
    let checkedBoxes = document.querySelectorAll('input[name="recordIds[]"]:checked');

    if (checkedBoxes.length == 0) {
        return;
    }

    let html = '';
    checkedBoxes.forEach((checkbox) => {
        html += `<input type='hidden' name='ids[]' value='${checkbox.getAttribute('data-search-class-id')}|${checkbox.value}'>`;
    });
    document.querySelector('#export-ids-container').innerHTML = html;

    jQuery(`#exportFavoritesModal`).modal('show');
}

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

function selectAllFavorites(source) {
    let checkboxes = document.querySelectorAll('input[name="recordIds[]"]');
    for (let i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i] != source) {
            checkboxes[i].checked = source.checked;
        }
    }
}