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

		// Public API
		var Cover = Object.create( null );

		Object.defineProperty( Cover, "action", { get: function() { return action; }, set: function( v ) { action = v; } } );
		Object.defineProperty( Cover, "advert", { get: function() { return advert; }, set: function( v ) { advert = v; } } );
		Object.defineProperty( Cover, "bibInfo", { get: function() { return bibInfo; }, set: function( v ) { bibInfo = v; } } );
		Object.defineProperty( Cover, "target", { get: function() { return target; }, set: function( v ) { target = v; } } );
		Object.defineProperty( Cover, "record", { get: function() { return record; }, set: function( v ) { record = v; } } );

		return Cover;
	}

	/**
	 * Parses {@see CoverPrototype} from data attributes of the given element.
	 * @param {HTMLElement} elm
	 * @returns {CoverPrototype}
	 */
	CoverPrototype.parseFromElement = function parseCoverFromElement( elm ) {
		var cover = new CoverPrototype();

		// Just to be sure that we are processing correct element
		if ( ! elm.hasAttribute( "data-action" ) || ! elm.hasAttribute( "data-cover" ) ) {
			throw new Error( "Unable to parse Cover from given element!" );
		}

		cover.target  = elm;
		cover.action  = elm.getAttribute( "data-action" );
		cover.advert  = elm.hasAttribute( "data-advert" ) ? elm.getAttribute( "data-advert" ) : "";
		cover.bibInfo = elm.hasAttribute( "data-bibinfo" ) ? JSON.parse( elm.getAttribute( "data-bibinfo" ) ) : Object.create( null );
		cover.record  = elm.hasAttribute( "data-recordId" ) ? elm.getAttribute( "data-recordId" ) : "";

		return cover;
	};

	/**
	 * Simple prototype object that defines size for covers.
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

		// Public API
		var CoverSize = Object.create( null );

		Object.defineProperty( CoverSize, "width", { get: function() { return w; } } );
		Object.defineProperty( CoverSize, "height", { get: function() { return h; } } );
		Object.defineProperty( CoverSize, "noImg", { get: function() { return img; } } );

		return CoverSize;
	}

	/**
	 * Function that extends `jQuery.fn`.
	 * @return {jQuery}
	 */
	function cover() {

		// Process all covers
		$( this ).each( processCover );

		// Return context to allow chaining
		return this;
	}

	/**
	 * @private Creates image element.
	 * @param {string} src
	 * @param {string} alt
	 * @param {CoverSizePrototype} size
	 * @returns {HTMLImageElement}
	 */
	function createImage( src, alt, size ) {
		var img = document.createElement( "img" );

		img.setAttribute( "src", src );
		img.setAttribute( "alt", cover.coverText );
		img.style.height = size.height;
		img.style.width  = size.width;

		return img;
	}

	/**
	 * @private Creates anchor element.
	 * @param {string} href
	 * @param {HTMLImageElement} img
	 * @returns {HTMLAnchorElement}
	 */
	function createAnchor( href, img ) {
		var a = document.createElement( "a" );

		a.setAttribute( "href", href );
		a.classList.add( "title" );
		a.appendChild( img );

		return a;
	}

	/**
	 * @private Processes elements that represent covers.
	 * @param {number} idx
	 * @param {HTMLElement} elm
	 */
	function processCover( idx, elm ) {
		var cover = CoverPrototype.parseFromElement( elm );
		
		switch( cover.action ) {
			case "fetchImage": fetchImage( cover ); break;
			case "fetchImageWithoutLinks": fetchImageWithoutLinks( cover ); break;
			case "displayThumbnail": displayThumbnail( cover ); break;
			case "displayThumbnailWithoutLinks": displayThumbnailWithoutLinks( cover ); break;
			case "displayCover": displayCover( cover ); break;
			case "displayCoverWithoutLinks": displayCoverWithoutLinks( cover ); break;
			case "displayThumbnailCover": displayThumbnailCover( cover ); break;
			case "displayThumbnailCoverWithoutLinks": displayThumbnailCoverWithoutLinks( cover ); break;
			case "displayAuthorityCover": displayAuthorityCover( cover ); break;
			case "displayAuthorityCoverWithoutLinks": displayAuthorityCoverWithoutLinks( cover ); break;
			case "displayAuthorityResults": displayAuthorityResults( cover ); break;
			case "displaySummary": displaySummary( cover ); break;
			case "displaySummaryShort": displaySummaryShort( cover ); break;
		}
	}

	/**
	 * @private Returns URL for the cover's image.
	 * @param {Object} bibInfo
	 * @param {string} type
	 * @param {string} query
	 * @returns {string}
	 */
	function getImageUrl( bibInfo, type, query ) {
		return cover.coverUrl +
			"?multi=" + encodeURIComponent( JSON.stringify( bibInfo ) ) +
			"&type=" + type + "&keywords=" + encodeURIComponent( query )
	}

	/**
	 * @private Fetches image for the given cover.
	 * @param {CoverPrototype} cover
	 * @param {string} type (Optional.)
	 */
	function fetchImage( cover, type ) {
		var img   = new Image(),
		    query = "";

		if ( type === undefined ) {
			type = "thumbnail";
		}

		img.onload = function() {
			if ( CPK.verbose === true ) {
				console.log( "fetchImage", "resolveImage", cover, type );
			}

			var href   = cover.getCoverTargetUrl( cover.bibInfo ),
				size   = ( type === "thumbnail" ) ? $.fn.cpkCover.defaults.thumbnail : $.fn.cpkCover.defaults.normal,
				imgElm = createImage( img.src, $.fn.cpkCover.coverText, size ),
				aElm   = createAnchor( href, imgElm );

			cover.target.appendChild( aElm );
		};

		var url = getImageUrl( cover.bibInfo, type, query );
		console.log( url );

		img.src = url;
	}

	/**
	 * @private Fetches image for the given cover. Renders image without link.
	 * @param {CoverPrototype} cover
	 * @param {string} type (Optional.)
	 */
	function fetchImageWithoutLinks( cover, type ) {
		var img   = new Image(),
			query = "";

		if ( type === undefined ) {
			type = "thumbnail";
		}

		img.onload = function( event ) {
			console.log( event );
			var size   = ( type === "thumbnail" ) ? $.fn.cpkCover.defaults.thumbnail : $.fn.cpkCover.defaults.normal,
				imgElm = createImage( img.src, $.fn.cpkCover.coverText, size );

			cover.target.appendChild( imgElm );
		};

		var url = getImageUrl( cover.bibInfo, type, query );
		console.log( url );

		img.src = url;
	}

	/**
	 * @param {CoverPrototype} cover
	 */
	function displayThumbnail( cover ) {
		fetchImage( cover, "icon" );
	}

	/**
	 * @param {CoverPrototype} cover
	 */
	function displayThumbnailWithoutLinks( cover ) {
		fetchImageWithoutLinks( cover, "icon" );
	}

	/**
	 * @param {CoverPrototype} cover
	 */
	function displayCover( cover ) { console.log( "XXX displayCover", cover ); }

	/**
	 * @param {CoverPrototype} cover
	 */
	function displayCoverWithoutLinks( cover ) { console.log( "XXX displayCoverWithoutLinks", cover ); }

	/**
	 * @param {CoverPrototype} cover
	 */
	function displayThumbnailCover( cover ) { console.log( "XXX displayThumbnailCover", cover ); }

	/**
	 * @param {CoverPrototype} cover
	 */
	function displayThumbnailCoverWithoutLinks( cover ) { console.log( "XXX displayThumbnailCoverWithoutLinks", cover ); }

	/**
	 * @param {CoverPrototype} cover
	 */
	function displayAuthorityCover( cover ) { console.log( "XXX displayAuthorityCover", cover ); }

	/**
	 * @param {CoverPrototype} cover
	 */
	function displayAuthorityCoverWithoutLinks( cover ) { console.log( "XXX displayAuthorityCoverWithoutLinks", cover ); }

	/**
	 * @param {CoverPrototype} cover
	 */
	function displayAuthorityResults( cover ) { console.log( "XXX displayAuthorityResults", cover ); }

	/**
	 * @param {CoverPrototype} cover
	 */
	function displaySummary( cover ) { console.log( "XXX displaySummary", cover ); }

	/**
	 * @param {CoverPrototype} cover
	 */
	function displaySummaryShort( cover ) { console.log( "XXX displaySummaryShort", cover ); }

	/**
	 * Sets cache URL for covers service.
	 * @param {string} cacheUrl
	 */
	function setCoversCacheUrl( cacheUrl ) {
		cover.cacheUrl = cacheUrl;
		cover.coverUrl = cacheUrl + "/api/cover";
		cover.tocUrl   = cacheUrl + "/api/toc/thumbnail";
		cover.pdfUrl   = cacheUrl + "/api/toc/pdf";
	}

	/**
	 * Returns correct URL for the cover with given bibInfo.
	 * @param {{ isbn: string, nbn: string, auth_id: string}} bibInfo
	 * @returns {string}
	 */
	function coverTargetUrl( bibInfo ) {
		return cover.linkUrl + "?" + cover.queryPart( bibInfo );
	}

	/**
	 * Creates GET parameters from given `bibInfo`
	 * @param {{ isbn: string, nbn: string, auth_id: string}} bibInfo
	 * @returns {string}
	 */
	function queryPart( bibInfo ) {
		var queryPart = "",
			sep       = "";

		$.each( bibInfo, function( name, value ) {
			queryPart += sep + name + "=" + encodeURIComponent( value );
			sep = "&";
		} );

		return queryPart;
	}

	// Default plugin options
	cover.defaults = {
		normal: new CoverSizePrototype( 63, 80, "themes/bootstrap3/images/noCover.jpg" ),
		thumbnail: new CoverSizePrototype( 27, 36, "themes/bootstrap3/images/noCover.jpg" )
		//icon: new CoverSizePrototype( *, *, "" )
	};

	// Set covers cache URL
	setCoversCacheUrl( "https://cache.obalkyknih.cz" );

	// Other properties
	cover.linkUrl   = "https://www.obalkyknih.cz/view";
	cover.coverText = "cover";
	cover.tocText   = "table of content";

	// Some methods
	cover.setCacheUrl       = setCoversCacheUrl;
	cover.getCoverTargetUrl = coverTargetUrl;
	cover.queryPart         = queryPart;

	// Public API for jQuery

	// Here are some extensions to jQuery self
	$.fn.cpkCover = cover;

	/**
	 * Controller for covers.
	 * @constructor
	 */
	function CoversController() {

		/**
		 * Initializes the controller.
		 * @returns {Promise<boolean>}
		 */
		function init() {
			// TODO We should separate those covers which actions need Ajax -> "one request for covers per page"
			$( "[data-cover='true']" ).cpkCover();

			return Promise.resolve( true );
		}

		// Public API
		var Controller = Object.create( null );

		Controller.initialize = init;

		return Controller;
	}

	// Public API for CPK

	/**
	 * @type {CoversController}
	 */
	CPK.covers = new CoversController();

	// Return context to allow chaining
	return this;

}( jQuery ));