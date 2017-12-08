/**
 * Refactored code from `themes/bootstrap3/templates/RecordDriver/SolrDefault/toolbar.phtml`
 *
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 */

(function( $ ) {

	/**
	 * @private Creates prev/next links for records switching.
	 * @param {string} rec
	 * @param {string} ref
	 * @param {string} tit
	 * @param {string} cls
	 * @returns {string}
	 */
	function link( rec, ref, tit, cls ) {
		var ret = "";

		ret += "<a href='/Record/" + rec + "?referer=" + ref + "' title='" + tit + "'>";
		ret += "<i class='pr-interface-" + cls + "'></i>";
		ret += "</a>";

		return ret;
	}

	/**
	 * @returns {Promise<HTMLElement>}
	 */
	function initDom() {
		return Promise.resolve( document.getElementById( "records-switching" ) );
	}

	/**
	 * @param {HTMLElement} elm
	 * @returns {Promise<boolean>}
	 */
	function initRecordsSwitching( elm ) {
		try {
			// Some variables
			var id       = $( elm ).data( "record_id" ),
				referer  = $( elm ).data( "record_referer" ),
				records  = JSON.parse( CPK.localStorage.getItem( referer ) ),
				position = records.indexOf( id ),
				html     = "";

			// No need of prev/next links
			if ( records.length <= 1 ) {
				return Promise.resolve( true );
			}

			// Create HTML with prev/next links
			if ( position > 0 ) {
				html += link( records[ position - 1 ], referer, VuFind.translate( "previousRecordText" ), "arrowleft2" );
			}

			html += "<span> " + ( position + 1 ) + ". " + VuFind.translate( "recordText" ) + "</span>";

			if ( position < records.length ) {
				html += link( records[ position + 1 ], referer, VuFind.translate( "nextRecordText" ), "arrowright2" );
			}

			// Append HTML to the element
			$( elm ).append( html );

			// And resolve as TRUE
			return Promise.resolve( true );
		} catch ( e ) {
			return Promise.resolve( false );
		}
	}

	/**
	 * @private Finalizes initialization of records switching.
	 * @param {boolean} result
	 * @returns {Promise<boolean>}
	 */
	function finalizeInitRecordsSwitching( result ) {
		if ( result !== true && CPK.verbose === true ) {
			console.warn( "Records switching for toolbar.phtml was not initialized!" );
		} else if ( CPK.verbose === true ) {
			console.info( "Records switching for toolbar.phtml was successfully initialized!" );
		}

		return Promise.resolve( true );
	}

	/**
	 * @private Initializes modal links.
	 * @returns {Promise<boolean>}
	 */
	function initModalLinks() {

		// Initialize all handlers
		$( "#citace-pro" ).on( "click", ".citations-link", citationsModalHandler );
		$( "#permalinkItem" ).on( "click", "#permalinkAnchor", permalinkModalHandler );
		$( ".record-toolbar" ).on( "click", "#mail-record", mailModalHandler );
		$( "#shareItem" ).on( "click", "#shareAnchor", shareModalHandler );

		return Promise.resolve( true );
	}

	// Handlers for modal links
	function citationsModalHandler() { $( document.getElementById( "citationsModal" ) ).modal( "show" ); }
	function permalinkModalHandler() { $( document.getElementById( "permalinkModal" ) ).modal( "show" ); }
	function mailModalHandler() { $( document.getElementById( "mailRecordModal" ) ).modal( "show" ); }
	function shareModalHandler() { $( document.getElementById( "shareModal" ) ).modal( "show" ); }


	/**
	 * Toolbar for RecordDriver SolrDefault.
	 * @returns {Object}
	 * @constructor
	 */
	function SolrDefaultToolbar() {

		/**
		 * Initializes toolbar.
		 * @returns {Promise<boolean>}
		 */
		function init() {
			return Promise
				.resolve( initDom() )
				.then( initRecordsSwitching )
				.then( finalizeInitRecordsSwitching )
				.then( initModalLinks );
		}

		// Public API
		var Toolbar = Object.create( null );

		Toolbar.initialize = init;

		return Toolbar;
	}

	/**
	 * @type {SolrDefaultToolbar}
	 */
	CPK.toolbar = new SolrDefaultToolbar();

}( jQuery ) );