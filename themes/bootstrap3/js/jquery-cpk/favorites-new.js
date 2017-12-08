/**
 * Favorites service.
 *
 * @author Jiří Kozlovský, original Angular solution
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 */

(function( $ ) {
	"use strict";

	if ( CPK.verbose === true ) {
		console.info( "jquery-cpk/favorites-new.js" );
	}

	// Here are some extensions to jQuery self
	$.fn.switchAddRemoveFavoriteLink = switchAddRemoveFavoriteLinkLabel;
	$.fn.addRemoveFavorite           = addRemoveFavoriteEventHandler;
	$.fn.parseRecord                 = parseRecord;



	/**
	 * Switches between "Add favorite" and "Remove favorite" labels.
	 * @returns {jQuery}
	 */
	function switchAddRemoveFavoriteLinkLabel() {

		/**
		 * @param {number} idx
		 * @param {HTMLElement} elm
		 * @todo Using `rank` check if item is favorite or not!
		 */
		function switchAddRemoveFavoriteLabel( idx, elm ) {
			var link    = $( ".search-results-favorite-button > li > a", elm ),
				rank    = $( link ).data( "rank" ),
				addLink = $( ".add-favorite-link", link ),
				remLink = $( ".remove-favorite-link", link );

			var isFavorite = false;

			if ( isFavorite === true ) {
				console.info( "Element already represents favorite - showing 'Remove favorite'..." );
				remLink.removeClass( "hidden" );
				addLink.addClass( "hidden" );
			} else {
				console.info( "Element doesn't represent a favorite - showing 'Add favorite'..." );
				addLink.removeClass( "hidden" );
				remLink.addClass( "hidden" );
			}
		}

		// Go through all elements and switch the label
		this.each( switchAddRemoveFavoriteLabel );

		// Return context to allow chaining
		return this;
	}

	/**
	 * On click event handler for "addRemoveFavorite" links.
	 * @returns {jQuery}
	 */
	function addRemoveFavoriteEventHandler() {
		//...

		// Return context to allow chaining
		return this;
	}

	/**
	 * Parses record for the element (works for search results and record's detail page).
	 *
	 * The resulted object with record's value is attached to given context
	 * thus then is available through the target element self.
	 *
	 * @returns {jQuery}
	 */
	function parseRecord() {

		/**
		 * @type {array} records
		 */
		this.records = [];

		this.getRecord = function( idx ) {
			if ( records.length < idx || idx < 0 ) {
				return null;
			} else {
				return records[ idx ];
			}
		};

		/**
		 * @param {number} idx
		 * @param {HTMLElement} elm
		 */
		function parseRecordInner( idx, elm ) {
			// We need to recognize what parsing method we should use
			var isRecordDetail = false,
				isSearchPage   = false;

			if ( isSearchPage === true ) {
				parseSearchRecord( elm );
			} else if ( isRecordDetail === true ) {
				parseRecordDetail( elm );
			} else {
				console.log( "Unrecognized context -> can not parse records!" );
			}
		}



		// Return context to allow chaining
		return this;
	}

	/**
	 * Parses record for the search results.
	 * @param {jQuery} context
	 */
	function parseSearchRecord( context ) {
		console.log( "parseSearchRecord", context );
		//...
	}

	/**
	 * Parses record on the record's detail page.
	 * @param {jQuery} context
	 */
	function parseRecordDetail( context ) {
		console.log( "parseRecordDetail", context );
		//...
	}

}( jQuery ) );