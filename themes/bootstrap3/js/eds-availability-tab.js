let handleEdsAvailability = (data) => {

    jQuery( document ).ready( function( $ ) {

        if (data.accessUrl) {
            const html = `
              <tr class='d-none'>
                <td>
                  <a href='${data.accessUrl}' target='_blank' title='${VuFind.translate('Fulltext')}'>
                    ${VuFind.translate('Fulltext')}
                  </a>
                </td>
              </tr>`;

            $( '#eds-links-placeholder' ).append( html );
            $( '#eds-links-placeholder tr' ).show( 'blind', {}, 200 );

            $( '#free-eds-link-available' ).show( 'blind', {}, 200 );

            $( '.eds-want-it' ).show( 'blind', {}, 200 );

        } else if (data.containsFulltext) {
            const html = `
              <tr class='d-none'>
                <td>
                  <a id='scrollToFulltext' href='#html' target='_blank' title='${VuFind.translate('Free fulltext')}'>
                    ${VuFind.translate('Free fulltext')}
                  </a>
                </td>
              </tr>`;
            $( '#eds-links-placeholder' ).append( html );
            $( '#eds-links-placeholder tr' ).show( 'blind', {}, 200 );

            $( '#free-eds-link-available' ).show( 'blind', {}, 200 );

            $( '.eds-want-it' ).show( 'blind', {}, 200 );

        } else {

            let recordData = {};
            if (data.issns) recordData.issns = data.issns;
            if (data.electronicIssns) recordData.electronicIssns = data.electronicIssns;
            if (data.isbns) recordData.isbns = data.isbns;
            if (data.publishDate) recordData.publishDate = data.publishDate;
            if (data.titles) recordData.titles = data.titles;
            if (data.authors) recordData.authors = data.authors;
            if (data.sourceTitle) recordData.sourceTitle = data.sourceTitle;
            if (data.volume) recordData.volume = data.volume;

            $.ajax({
                method: 'POST',
                dataType: 'json',
                async: true,
                url: '/AJAX/JSON?method=getEdsFulltextLink',
                data: {
                    recordData: recordData
                },
                beforeSend: function () {
                    $('#eds-links-placeholder')
                        .append("<div class='eds-links-loader text-center'><i class='fa fa-2x fa-refresh fa-spin'></i></div>");
                },
                success: function (response) {

                    if (response.status == 'OK') {

                        const links = response.data.links;
                        const edsLinks = links.length;

                        let html = '';
                        links.forEach( link => html += `<tr class='d-none'><td>${link}</td></tr>` );

                        if (edsLinks == 1) {
                            if (links[0].indexOf('free-eds-link-special-class') >= 0) {
                                $( '#free-eds-link-available' ).show( 'blind', {}, 200 );
                            } else {
                                $( '#only-one-eds-link-header' ).show( 'blind', {}, 200 );
                            }
                        }

                        if (edsLinks > 1) {
                            $( '#many-eds-links-header' ).show( 'blind', {}, 200 );
                        }

                        $( '#eds-links-placeholder' ).append( html );
                        $( '#eds-links-placeholder tr' ).show( 'blind', {}, 200 );

                        $( '.eds-want-it' ).show( 'blind', {}, 200 );
                    }

                    if (response.status == 'NOT_OK') {
                        console.log( '' );
                        console.warn( 'Response message:' + response.data.message );

                        $( '#edsavailability' ).parent().removeClass( 'active' ).addClass( 'disabled' );
                        $( '#eds-links-placeholder' ).append( VuFind.translate('Fulltext not found') );
                        $( '#no-eds-links' ).show( 'blind', {}, 200 );

                    }

                    if (undefined != response.data.not_ok_messages) {
                        response.data.not_ok_messages.forEach( function( message ) {
                            console.warn( message );
                        });
                    }
                },
                complete: function () {
                    $( '.eds-links-loader' ).remove();
                },
                error: function ( jqXHR, textStatus, errorThrown ) {
                    console.error( JSON.stringify( jqXHR ) );
                    console.error( 'AJAX error: ' + textStatus + ' : ' + errorThrown );
                }
            });

        }

    });

};

$( document ).on( 'click', '#scrollToFulltext', function( event ) {
    event.preventDefault();
    smoothScrollToElement( '#html' );
});
