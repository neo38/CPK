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
	 * @var {jQuery} self
	 */
	var self = this;

	/**
	 * Prototype object for single cover (as is parsed from target <div> element).
	 * @property {string} action
	 * @property {string} advert
	 * @property {{ isbn: string, nbn: string, auth_id: string}} bibInfo
	 * @property {HTMLElement} target
	 * @property {string} record
	 * @constructor
	 */
	function CoverPrototype() {
		var action, advert, bibInfo, target, record;

		/**
		 * @private Parses given <div> element which represents single cover.
		 * @param {HTMLElement} elm
		 */
		function parseCoverFromElement( elm ) {

			// Just to be sure that we are processing correct element
			if ( ! elm.hasAttribute( "data-action" ) || ! elm.hasAttribute( "data-cover" ) ) {
				throw new Error( "Unable to parse Cover from given element!" );
			}

			target  = elm;
			action  = elm.getAttribute( "data-action" );
			advert  = elm.hasAttribute( "data-advert" ) ? elm.getAttribute( "data-advert" ) : "";
			bibInfo = elm.hasAttribute( "data-bibinfo" ) ? JSON.parse( elm.getAttribute( "data-bibinfo" ) ) : Object.create( null );
			record  = elm.hasAttribute( "data-recordId" ) ? elm.getAttribute( "data-advert" ) : "";
		}

		// Public API
		var Cover = Object.create( null );

		Object.defineProperty( Cover, "action", { get: function() { return action; } } );
		Object.defineProperty( Cover, "advert", { get: function() { return advert; } } );
		Object.defineProperty( Cover, "bibInfo", { get: function() { return bibInfo; } } );
		Object.defineProperty( Cover, "target", { get: function() { return target; } } );
		Object.defineProperty( Cover, "record", { get: function() { return record; } } );

		Cover.parseFromElement = parseCoverFromElement;

		return Cover;
	}

	/**
	 * @param {number} width
	 * @param {number} height
	 * @param {string} noImg
	 * @property {number} width
	 * @property {number} height
	 * @property {string} noImg
	 * @constructor
	 */
	function CoverSizePrototype( width, height, noImg ) {
		var w   = width,
			h   = height,
			img = noImg;

		var CoverSize = Object.create( null );

		Object.defineProperty( CoverSize, "width", { get: function() { return w; } } );
		Object.defineProperty( CoverSize, "height", { get: function() { return h; } } );
		Object.defineProperty( CoverSize, "noImg", { get: function() { return img; } } );

		return CoverSize;
	}

	/**
	 * Function that extends `jQuery.fn`.
	 * @param {string} action (Optional.) Requested cover action.
	 * @param {string} profile (Optional.) Size profile.
	 * @param {Object} options (Optional.) Custom options (overrides default options).
	 * @return {jQuery}
	 */
	function cover( action, profile, options ) {

		/**
		 * @type {string[]}
		 */
		var availableActions  = [ "fetchImage", "fetchImageWithoutLinks",
		                          "displayThumbnail", "displayThumbnailWithoutLinks",
		                          "displayCover", "displayCoverWithoutLinks",
		                          "displayThumbnailCover", "displayThumbnailCoverWithoutLinks",
		                          "displayAuthorityCover", "displayAuthorityCoverWithoutLinks",
		                          "displayAuthorityResults",
		                          "displaySummary", "displaySummaryShort" ],
		    availableProfiles = [ "normal", "small" ];

		// Normalize given parameters
		if ( action === undefined && profile === undefined && options === undefined ) {
			action  = "fetchImage";
			profile = "normal";
			options = Object.create( null );
		} else if ( typeof action === "object" && profile === undefined && options === undefined ) {
			options = action;
			action  = "fetchImage";
			profile = "normal";
		} else if ( typeof action === "string" && typeof profile === "object" && options === undefined ) {
			options = profile;
			profile = "normal";
		}

		// Check if requested action is supported
		if ( availableActions.indexOf( action ) === -1 ) {
			if ( CPK.verbose === true ) {
				console.error( "Unknown action type provided!", action );
			}

			return self;
		}

		// Ensure the profile is correct
		if ( availableProfiles.indexOf( profile ) === -1 ) {
			profile = "normal";
		}

		/**
		 * @var {{ normal: CoverSizePrototype, thumbnail: CoverSizePrototype}} opts
		 */
		var opts = $.extend( {}, $.fn.cpkCover.defaults, options[ profile ] );

		/**
		 * @param {number} idx
		 * @param {HTMLElement} elm
		 */
		function prepareRequest( idx, elm ) {
			console.log( "cover", "prepareRequest", idx, elm );
			//...
		}

		/**
		 * @param {number} idx
		 * @param {HTMLElement} elm
		 */
		function makeRequest( idx, elm ) {
			console.log( "cover", "makeRequest", idx, elm );
			//...
		}

		/**
		 * @param {number} idx
		 * @param {HTMLElement} elm
		 */
		function useRequest( idx, elm ) {
			console.log( "cover", "useRequest", idx, elm );
			//...
		}

		// Start processing elements in chain
		$( self )
			// Collect info about all covers we need
			.each( prepareRequest )
			// Make request for needed covers
			.each( makeRequest )
			// Apply images into the page
			.each( useRequest );

		// Return context to allow chaining
		return self;
	}

	// Default plugin options
	cover.defaults = {
		normal: new CoverSizePrototype( 63, 80, "themes/bootstrap3/images/noCover.jpg" ),
		thumbnail: new CoverSizePrototype( 27, 36, "themes/bootstrap3/images/noCover.jpg" )
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
	 * Creates GET parameters from given `bibInfo`
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

	// ========================================================================
	// CPK.covers

	/**
	 * Controller for covers.
	 * @constructor
	 * @todo Finish this!!!
	 */
	function CoversController() {

		/**
		 * Initializes the controller.
		 * @returns {Promise<boolean>}
		 */
		function init() {
			$( "[data-cover='true']" ).cpkCover();

			return Promise.resolve( true );
		}

		// Public API
		var Controller = Object.create( null );

		Controller.initialize = init;

		return Controller;
	}

	/**
	 * @type {CoversController}
	 */
	CPK.covers = new CoversController();

	// ========================================================================
	// Public API for $.fn.cover

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