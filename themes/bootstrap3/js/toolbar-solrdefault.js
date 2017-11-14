/**
 * Moved from {@link themes/bootstrap3/templates/RecordDriver/SolrDefault/toolbar.phtml} to standalone file.
 * @global {Object} solrDefaultToolbar
 */

jQuery( document ).ready( function( $ ) {
    var id = VuFind.translate("solrDefaultToolbarId");
    var referer = VuFind.translate("solrDefaultToolbarReferer");
    var previousRecordText = VuFind.translate("solrDefaultToolbarPrevLbl");
    var nextRecordText = VuFind.translate("solrDefaultToolbarNextLbl");

    referer = referer == "solrDefaultToolbarReferer" ? false : referer;

    var initPrevNextRecords = function() {

        var extraRecords = JSON.parse( localStorage.getItem( referer ) );
        var extraRecordsCount = 0;
        var currentPosition = false;
        var html = '';

        if (extraRecords !== null) {
            extraRecordsCount = extraRecords.length;
            currentPosition = arraySearch( extraRecords, id );
        }

        if ( extraRecordsCount > 1 ) {
            if ( currentPosition > 0 ) {
                var previousRecord = extraRecords[currentPosition-1];
                html += "<a href='/Record/"+previousRecord+"?referer="+referer+"' title='"+previousRecordText+"'>";
                html += "  <i class='pr-interface-arrowleft2'></i>";
                html += "</a>";
            }

            html += "<span> "+(currentPosition+1)+". <?=$this->translate('record')?></span>";

            if ( currentPosition < extraRecordsCount ) {
                var nextRecord = extraRecords[currentPosition+1];
                html += "<a href='/Record/"+nextRecord+"?referer="+referer+"' title='"+nextRecordText+"'>";
                html += "  <i class='pr-interface-arrowright2'></i>";
                html += "</a>";
            }

            $( '#records-switching' ).append( html );
        }
    };

    // ================================================================

    if (referer) {
        initPrevNextRecords();
    }

    $( '#citace-pro' ).on('click', '.citations-link', function(){
        $( '#citationsModal' ).modal( 'show' );
    });
    $( '#permalinkItem' ).on('click', '#permalinkAnchor', function(){
        $( '#permalinkModal' ).modal( 'show' );
    });
    $( '.record-toolbar' ).on('click', '#mail-record', function(){
        $( '#mailRecordModal' ).modal( 'show' );
    });
    $( '#shareItem' ).on('click', '#shareAnchor', function(){
        $( '#shareModal' ).modal( 'show' );
    });
});