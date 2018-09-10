$( function () {
    const accentMap = {
        'ä': 'a',
        'Ä': 'A',
        'á': 'a',
        'Á': 'A',
        'à': 'a',
        'À': 'A',
        'ã': 'a',
        'Ã': 'A',
        'â': 'a',
        'Â': 'A',
        'č': 'c',
        'Č': 'C',
        'ć': 'c',
        'Ć': 'C',
        'ď': 'd',
        'Ď': 'D',
        'ě': 'e',
        'Ě': 'E',
        'é': 'e',
        'É': 'E',
        'ë': 'e',
        'Ë': 'E',
        'è': 'e',
        'È': 'E',
        'ê': 'e',
        'Ê': 'E',
        'í': 'i',
        'Í': 'I',
        'ï': 'i',
        'Ï': 'I',
        'ì': 'i',
        'Ì': 'I',
        'î': 'i',
        'Î': 'I',
        'ľ': 'l',
        'Ľ': 'L',
        'ĺ': 'l',
        'Ĺ': 'L',
        'ń': 'n',
        'Ń': 'N',
        'ň': 'n',
        'Ň': 'N',
        'ñ': 'n',
        'Ñ': 'N',
        'ó': 'o',
        'Ó': 'O',
        'ö': 'o',
        'Ö': 'O',
        'ô': 'o',
        'Ô': 'O',
        'ò': 'o',
        'Ò': 'O',
        'õ': 'o',
        'Õ': 'O',
        'ő': 'o',
        'Ő': 'O',
        'ř': 'r',
        'Ř': 'R',
        'ŕ': 'r',
        'Ŕ': 'R',
        'š': 's',
        'Š': 'S',
        'ś': 's',
        'Ś': 'S',
        'ť': 't',
        'Ť': 'T',
        'ú': 'u',
        'Ú': 'U',
        'ů': 'u',
        'Ů': 'U',
        'ü': 'u',
        'Ü': 'U',
        'ù': 'u',
        'Ù': 'U',
        'ũ': 'u',
        'Ũ': 'U',
        'û': 'u',
        'Û': 'U',
        'ý': 'y',
        'Ý': 'Y',
        'ž': 'z',
        'Ž': 'Z',
        'ź': 'z',
        'Ź': 'Z',
    };

    let normalize = function (term) {
        let ret = '';
        for (let i = 0; i < term.length; i++) {
            ret += accentMap[term.charAt( i )] || term.charAt( i );
        }
        return ret;
    };

    $.getJSON( '/AJAX/JSON?method=getSubcategoryMap', function (data) {
        $( '#add_notes' ).autocomplete( {
            minLength: 1,
            source: function (request, response) {
                let matcher = new RegExp( $.ui.autocomplete.escapeRegex( request.term ), 'i' );
                response( $.grep( data.data, function (value) {
                    value = value.label || value.value || value;
                    return matcher.test( value ) || matcher.test( normalize( value ) );
                } ) );
            },
            focus: function (event, ui) {
                $( '#add_notes' ).val( ui.item.value.split( '=' )[1].trim() );
                return false;
            },
            select: function (event, ui) {
                $( '#add_notes' ).val( ui.item.value.split( '=' )[1].trim() );
                return false;
            },
        } );
    } );
} );
