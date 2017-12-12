/**
 * Covers for books.
 *
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 */

(function( $ ) {
	if ( CPK.verbose === true ) {
		console.log( "jquery-cpk/covers.js" );
	}

	/**
	 * @param {string} action Requested cover action.
	 * @param {string} profile (Optional.) Size profile.
	 * @param {Object} options (Optional.) Custom options (overrides default options).
	 * @return {jQuery}
	 * @todo Make `action` parameter optional -> set default action in `$.fn.cpkCovers.defaults`
	 */
	function cover( action, profile, options ) {

		// V zásadě by to tady mělo být tak, že musí být nastavena
		// pouze `action` - všechno ostatní má defaultní hodnoty.
		// V proměnné `action` pak musí být uveden název akce, který
		// odpovídá názvu metody objektu `$.fn.cover`.
		//
		// Tzn. tyto volání jsou platná (a v tomto případě i stejná):
		//
		// jQuery( "*" ).cover( "displayThumbnail" );
		// jQuery( "*" ).cover( "displayThumbnail", "normal" );
		// jQuery( "*" ).cover( "displayThumbnail", "normal", { noImg: "some.png" } );
		// jQuery( "*" ).cover( "displayThumbnail", { noImg: "some.png" } );

		var availableActions  = [],
			availableProfiles = [ "normal", "small" ];

		if ( availableActions.indexOf( action ) === -1 ) {
			// TODO Unknown action type!
		}

		// Check if only options are passed
		if ( typeof profile === "object" && typeof options === "undefined" ) {
			options = profile;
			profile = "normal";
		}

		// Ensure the profile is correct
		if ( availableProfiles.indexOf( profile ) === -1 ) {
			profile = "normal";
		}

		var opts = $.extend( {}, $.fn.cpkCover.defaults, options[ profile ] ),
			requests = [],
			responses = [];

		/**
		 * @param {number} idx
		 * @param {HTMLElement} elm
		 */
		function prepareRequest( idx, elm ) {
			//...
		}

		/**
		 * @param {number} idx
		 * @param {HTMLElement} elm
		 */
		function makeRequest( idx, elm ) {
			//...
		}

		/**
		 * @param {number} idx
		 * @param {HTMLElement} elm
		 */
		function useRequest( idx, elm ) {
			//...
		}

		this
			// Collect info about all covers we need
			.each( prepareRequest )
			// Make request for needed covers
			.each( makeRequest )
			// Apply images into the page
			.each( useRequest );

		// Return context to allow chaining
		return this;
	}

	// Default options
	cover.defaults = {
		normal: {
			width: 63,
			height: 80,
			noImg: "themes/bootstrap3/images/noCover.jpg"
		},
		thumbnail: {
			width: 27,
			height: 36,
			noImg: "themes/bootstrap3/images/noCover.jpg"
		}
	};

	/**
	 * Sets cache URL for covers service.
	 * @param {string} cacheUrl
	 */
	function setCoversCacheUrl( cacheUrl ) {
		cover.cacheUrl = cacheUrl;
		cover.coverUrl = cover.cacheUrl + "/api/cover";
		cover.tocUrl   = cover.cacheUrl + "/api/toc/thumbnail";
		cover.pdfUrl   = cover.cacheUrl + "/api/toc/pdf";
	}

	/**
	 * @param {Object} bibInfo
	 * @returns {string}
	 */
	function setCoversQueryPart( bibInfo ) {
		var queryPart = "",
			sep       = "";

		$.each( bibInfo, function( name, value ) {
			queryPart += sep + name + "=" + encodeURIComponent( value );
			sep = "&";
		} );

		return queryPart;
	}

	// Set covers cache URL
	setCoversCacheUrl( "https://cache.obalkyknih.cz" );

	// Other properties
	cover.linkUrl   = "https://www.obalkyknih.cz/view";
	cover.coverText = "cover";
	cover.tocText   = "table of content";

	// Some methods
	cover.setCacheUrl = setCoversCacheUrl;
	cover.queryPart = setCoversQueryPart;

	// Here are some extensions to jQuery self
	$.fn.cpkCover = cover;

	// Return context to allow chaining
	return this;

}( jQuery ));