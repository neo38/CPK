/**
 * Covers for books.
 *
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 */

(function( $ ) {
	"use strict";

	/**
	 * Prototype object for single cover (as is parsed from target <div> element).
	 * @property {string} action
	 * @property {string} advert
	 * @property {{ isbn: string, nbn: string, auth_id: string, cover_medium_url: string}} bibInfo
	 * @property {HTMLElement} target
	 * @property {string} record
	 * @constructor
	 */
	function CoverPrototype() {
		var act, adv, bi, elm, rec;

		// Public API
		var Cover = Object.create( null );

		Object.defineProperty( Cover, "action", { get: function() { return act; }, set: function( v ) { act = v; } } );
		Object.defineProperty( Cover, "advert", { get: function() { return adv; }, set: function( v ) { adv = v; } } );
		Object.defineProperty( Cover, "bibInfo", { get: function() { return bi; }, set: function( v ) { bi = v; } } );
		Object.defineProperty( Cover, "target", { get: function() { return elm; }, set: function( v ) { elm = v; } } );
		Object.defineProperty( Cover, "record", { get: function() { return rec; }, set: function( v ) { rec = v; } } );

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

		var bi = Object.create( null );

		if ( elm.hasAttribute( "data-bibinfo" ) ) {
			bi = JSON.parse( elm.getAttribute( "data-bibinfo" ) );
		}

		cover.target  = elm.parentElement;
		cover.action  = elm.getAttribute( "data-action" );
		cover.advert  = elm.hasAttribute( "data-advert" ) ? elm.getAttribute( "data-advert" ) : "";
		cover.bibInfo = bi;
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
	 * @private Processes elements that represent covers.
	 * @param {number} idx
	 * @param {HTMLElement} elm
	 */
	function processCover( idx, elm ) {
		var cvr = CoverPrototype.parseFromElement( elm );

		switch( cvr.action ) {
			case "fetchImage": fetchImage( cvr, "thumbnail" ); break;
			case "fetchImageWithoutLinks": fetchImageWithoutLinks( cvr, "thumbnail" ); break;
			case "displayThumbnail": displayThumbnail( cvr ); break;
			case "displayThumbnailWithoutLinks": displayThumbnailWithoutLinks( cvr ); break;
			case "displayCover": displayCover( cvr ); break;
			case "displayCoverWithoutLinks": displayCoverWithoutLinks( cvr ); break;
			case "displayThumbnailCoverWithoutLinks": displayThumbnailCoverWithoutLinks( cvr ); break;
			case "displayAuthorityCover": displayAuthorityCover( cvr ); break;
			case "displayAuthorityThumbnailCoverWithoutLinks": displayAuthorityThumbnailCoverWithoutLinks( cvr ); break;
			case "displayAuthorityResults": displayAuthorityResults( cvr ); break;
			case "displaySummary": displaySummary( cvr ); break;
			case "displaySummaryShort": displaySummaryShort( cvr ); break;
		}
	}

	/**
	 * @private Returns URL for the cover's image.
	 * @param {string} baseUrl
	 * @param {Object} bibInfo
	 * @param {string} type
	 * @param {string} query
	 * @returns {string}
	 */
	function getImageUrl( baseUrl, bibInfo, type, query ) {
		return baseUrl +
			"?multi=" + encodeURIComponent( JSON.stringify( bibInfo ) ) +
			"&type=" + type + "&keywords=" + encodeURIComponent( query );
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

		if ( size !== undefined ) {
			img.style.height = size.height.toString();
			img.style.width  = size.width.toString();
		}

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
	 * @private Creates div element.
	 * @param {string} cls
	 * @param {HTMLAnchorElement|HTMLImageElement} elm
	 * @returns {HTMLDivElement}
	 */
	function createDiv( cls, elm ) {
		var div = document.createElement( "div" );

		div.classList.add( cls );
		div.appendChild( elm );

		return div;
	}

	/**
	 * @param {HTMLImageElement} img
	 */
	function isImageLoaded( img ) {
		return ( img.height > 1 && img.width > 1 );
	}

	/**
	 * @private Fetches image for the given cover.
	 * @param {CoverPrototype} cover
	 * @param {string} type (Optional.)
	 */
	function fetchImage( cover, type ) {
		var img   = new Image();

		if ( type === undefined ) {
			type = "thumbnail";
		}

		img.onload = function onLoadImage() {
			if ( isImageLoaded( img ) ) {
				var size   = ( type === "thumbnail" ) ? $.fn.cpkCover.defaults.thumbnail : $.fn.cpkCover.defaults.normal,
				    imgElm = createImage( img.src, $.fn.cpkCover.coverText, size ),
				    aElm   = createAnchor( $.fn.cpkCover.getCoverTargetUrl( cover.bibInfo ), imgElm );

				$( cover.target ).empty().append( aElm );
			}
		};

		img.src = getImageUrl( $.fn.cpkCover.coverUrl, cover.bibInfo, type, cover.advert );
	}

	/**
	 * @private Fetches image for the given cover. Renders image without link.
	 * @param {CoverPrototype} cover
	 * @param {string} type (Optional.)
	 */
	function fetchImageWithoutLinks( cover, type ) {
		var img   = new Image();

		if ( type === undefined ) {
			type = "thumbnail";
		}

		img.onload = function onLoadImage() {
			if ( isImageLoaded( img ) ) {
				var size = (type === "thumbnail") ? $.fn.cpkCover.defaults.thumbnail : $.fn.cpkCover.defaults.normal,
				    imgElm = createImage( img.src, $.fn.cpkCover.coverText, size );

				$( cover.target ).empty().append( imgElm );
			}
		};

		img.src = getImageUrl( $.fn.cpkCover.coverUrl, cover.bibInfo, type, cover.advert );
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
	function displayCover( cover ) {
		var imgCover = new Image(),
		    imgToc   = new Image();

		$( cover.target ).empty();

		// Firstly we need to load cover
		imgCover.onload = function onLoadCover() {
			if ( isImageLoaded( imgCover ) ) {
				var imgElm = createImage( imgCover.src, $.fn.cpkCover.coverText, $.fn.cpkCover.defaults.medium ),
				    anchorElm = createAnchor( $.fn.cpkCover.getCoverTargetUrl( cover.bibInfo ), imgElm ),
				    divElm = createDiv( "cover_thumbnail", anchorElm );

				$( cover.target ).prepend( divElm );
			}
		};

		imgCover.src = getImageUrl( $.fn.cpkCover.coverUrl, cover.bibInfo, "medium", cover.advert );

		// Secondly we need to load TOC
		imgToc.onload = function onLoadToc() {
			if ( isImageLoaded( imgToc ) ) {
				var imgElm = createImage( imgToc.src, $.fn.cpkCover.tocText, $.fn.cpkCover.defaults.medium ),
				    anchorElm = createAnchor( $.fn.cpkCover.getCoverTargetUrl( cover.bibInfo ), imgElm ),
				    divElm = createDiv( "cover_thumbnail", anchorElm );

				$( cover.target ).append( divElm );
			}
		};

		imgToc.src = getImageUrl( $.fn.cpkCover.tocUrl, cover.bibInfo, "medium", cover.advert );
	}

	/**
	 * @param {CoverPrototype} cover
	 */
	function displayCoverWithoutLinks( cover ) {
		var imgCover = new Image(),
		    imgToc   = new Image();

		// Empty target element
		$( cover.target ).empty();

		// Load info text (about the source)
		var infoDivElm = document.createElement( "div" ),
		    infoText = document.createTextNode( VuFind.translate( "Source" ) ),
		    infoTextSep = document.createTextNode( VuFind.translate( ": " ) ),
		    infoAnchorElm = document.createElement( "a" );

		infoDivElm.style.paddingLeft = "0px";
		infoDivElm.style.textAlign = "center";
		infoDivElm.classList.add( "obalky-knih-link", "col-md-12" );

		infoAnchorElm.setAttribute( "href", $.fn.cpkCover.getCoverTargetUrl( cover.bibInfo ) );
		infoAnchorElm.setAttribute( "target", "_blank" );
		infoAnchorElm.classList.add( "title" );

		infoAnchorElm.appendChild( document.createTextNode( "Obálky knih" ) );
		infoDivElm.appendChild( infoText );
		infoDivElm.appendChild( infoTextSep );
		infoDivElm.appendChild( infoAnchorElm );

		$( cover.target ).append( infoDivElm );

		// Firstly we need to load cover
		imgCover.onload = function onLoadCover() {
			if ( isImageLoaded( imgCover ) ) {
				var imgElm = createImage( imgCover.src, $.fn.cpkCover.coverText, $.fn.cpkCover.defaults.medium ),
				    divElm = createDiv( "cover_thumbnail", imgElm );

				$( cover.target ).prepend( divElm );
			}
		};

		imgCover.src = getImageUrl( $.fn.cpkCover.coverUrl, cover.bibInfo, "medium", cover.advert );

		// Secondly we need to load TOC
		imgToc.onload = function onLoadToc() {
			if ( isImageLoaded( imgToc ) ) {
				var imgElm = createImage( imgToc.src, $.fn.cpkCover.tocText, $.fn.cpkCover.defaults.medium ),
				    divElm = createDiv( "cover_thumbnail", imgElm );

				$( divElm ).insertBefore( infoDivElm );
			}
		};

		imgToc.src = getImageUrl( $.fn.cpkCover.tocUrl, cover.bibInfo, "medium", cover.advert );
	}

	/**
	 * @param {CoverPrototype} cover
	 */
	function displayThumbnailCoverWithoutLinks( cover ) {
		var img = new Image();

		img.onload = function onLoadImage() {
			if ( isImageLoaded( img ) ) {
				var imgElm = createImage( img.src, $.fn.cpkCover.coverText, undefined ),
				    divElm = createDiv( "cover_thumbnail", imgElm );

				$( cover.target ).empty().append( divElm );
			}
		};

		img.src = ( typeof cover.bibInfo.cover_medium_url !== "string" )
			? getImageUrl( $.fn.cpkCover.coverUrl, cover.bibInfo, "medium", cover.advert )
			: cover.bibInfo.cover_medium_url;
	}

	/**
	 * @param {CoverPrototype} cover
	 */
	function displayAuthorityCover( cover ) {
		var auth_id = cover.bibInfo.auth_id;

		/**
		 * @param {Object} data
		 */
		function resolveData( data ) {
			var img = new Image();

			img.onload = function onImageLoad() {
				if ( isImageLoaded( img ) ) {
					var imgElm = createImage( img.src, $.fn.cpkCover.coverText, undefined ),
					    anchorElm = createAnchor( "http://www.obalkyknih.cz/view_auth?auth_id=" + auth_id, imgElm ),
					    divElm = createDiv( "cover_thumbnail", anchorElm );

					$( cover.target ).empty().append( divElm );
				}
			};

			img.src = data.data;
		}

		$.getJSON( "/AJAX/JSON?method=getObalkyKnihAuthorityID", { id: auth_id }, resolveData );
	}

	/**
	 * @param {CoverPrototype} cover
	 */
	function displayAuthorityThumbnailCoverWithoutLinks( cover ) {

		/**
		 * @param {Object} data
		 */
		function resolveData( data ) {
			var img = new Image();

			img.onload = function onLoadImage() {
				if ( isImageLoaded( img ) ) {
					var imgElm = createImage( img.src, $.fn.cpkCover.coverText, undefined ),
					    divElm = createDiv( "cover_thumbnail", imgElm );

					imgElm.style.width = "65px";

					$( cover.target ).empty().append( divElm );
				}
			};

			img.src = data.data;
		}

		$.getJSON( "/AJAX/JSON?method=getObalkyKnihAuthorityID", { id: cover.bibInfo.auth_id }, resolveData );
	}

	/**
	 * @param {CoverPrototype} cover
	 * @todo We should resolve also failure of the request!
	 */
	function displayAuthorityResults( cover ) {

		/**
		 * @param {Object} data
		 */
		function resolveData( data ) {
			var img = new Image();

			img.onload = function onLoadImage() {
				if ( isImageLoaded( img ) ) {
					var imgElm = createImage( img.src, $.fn.cpkCover.coverText, undefined ),
					    divElm = createDiv( "cover_thumbnail", imgElm );

					imgElm.style.width = "100px";

					$( cover.target ).empty().append( divElm );
				}
			};

			img.src = data.data;
		}

		$.getJSON( "/AJAX/JSON?method=getObalkyKnihAuthorityID", { id: cover.bibInfo.auth_id }, resolveData );
	}

	/**
	 * @param {CoverPrototype} cover
	 * @todo We should resolve also failure of the request!
	 */
	function displaySummary( cover ) {

		/**
		 * @param {Object} data
		 */
		function resolveData( data ) {
			$( document.getElementById( "summary_" + cover.record ) ).html( data.data );
		}

		$.getJSON( "/AJAX/JSON?method=getSummaryObalkyKnih", { bibinfo: cover.bibInfo }, resolveData );
	}

	/**
	 * @param {CoverPrototype} cover
	 * @todo We should resolve also failure of the request!
	 */
	function displaySummaryShort( cover ) {

		/**
		 * @param {Object} data
		 */
		function resolveData( data ) {
			$( document.getElementById( "short_summary_" + cover.record ) ).html( data.data );

		}

		$.getJSON( "/AJAX/JSON?method=getSummaryShortObalkyKnih", { bibinfo: cover.bibInfo }, resolveData );
	}

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
		var query = "",
		    sep   = "";

		/**
		 * @param {string} name
		 * @param {string} value
		 */
		function createQuery( name, value ) {
			query += sep + name + "=" + encodeURIComponent( value );
			sep = "&";
		}

		$.each( bibInfo, createQuery );

		return queryPart;
	}

	// Default plugin options
	cover.defaults = {
		normal: new CoverSizePrototype( 63, 80, "themes/bootstrap3/images/noCover.jpg" ),
		thumbnail: new CoverSizePrototype( 27, 36, "themes/bootstrap3/images/noCover.jpg" ),
		medium: new CoverSizePrototype( 218, 262, "themes/bootstrap3/images/noCover.jpg" )
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

			/**
			 * TODO Rozdělit obálky, dle typu akce a sjednotit XHR requesty!
			 *
			 * Tady musíme rozdělit získané `CoverPrototype`s tak, aby akce,
			 * které vyžadují Ajax, byly spuštěny zvlášť a hlavně, aby byl
			 * výsledkem jen jeden XHR request (či max. dva).
			 *
			 * Akce, které používají Ajax jsou:
			 *
			 * - `displayAuthorityCover` a `displayAuthorityCoverWithoutLinks`
			 * - `displayAuthorityResults`
			 * - `displaySummary` a `displaySummaryShort`
			 */

			/**
			 * @type {{normal: HTMLElement[], authority: HTMLElement[], summary: HTMLElement[]}} covers
			 */
			var covers = {
				normal: [],
				authority: [],
				summary: []
			};

			$( "[data-cover='true']" ).each( function( idx, elm ) {
				var action = $( elm ).data( "action" );

				switch( action ) {
					case "fetchImage":
					case "fetchImageWithoutLinks":
					case "displayThumbnail":
					case "displayThumbnailWithoutLinks":
					case "displayCover":
					case "displayCoverWithoutLinks":
					case "displayThumbnailCoverWithoutLinks":
						// Note: API obalekknih.cz neumožňuje dotaz na více autorit najednou...
						//covers.normal.push( elm );
						//break;

					case "displayAuthorityCover":
					case "displayAuthorityThumbnailCoverWithoutLinks":
						//covers.normal.push( elm );
						//break;

					case "displayAuthorityResults":
					case "displaySummary":
					case "displaySummaryShort":
						covers.summary.push( elm );
						break;
				}
			});

			console.log( "Splitted coveres: ", covers );

			// Here are actions without XHR
			$( covers.normal ).cpkCover();

			// Authority-related actions
			//setTimeout(function() { $( covers.authority ).cpkCover(); });

			// Summary-related actions
			//setTimeout(function() { $( covers.summary ).cpkCover(); });
			var bibInfo = [];

			covers.summary.forEach(function( elm ) {
				bibInfo.push(( CoverPrototype.parseFromElement( elm ) ).bibInfo);
			});
			console.log( bibInfo );

			/**
			 * @param {{data: array, status: string}} data
			 */
			function resolveData( data ) {
				if ( ! data || data.status === undefined ) {
					return;
				}

				if ( data.status !== "OK" ) {
					if ( CPK.verbose === true ) {
						console.log( data );
					}

					return;
				}

				if ( data.length <= 0 ) {
					if ( CPK.verbose === true ) {
						console.log( "No data for multiple summaries returned." );
					}

					return;
				}

				data.data.forEach(function( metadata ) {
					//...
				});

				console.log( data );
			}

			$.getJSON( "/AJAX/JSON?method=getMultipleSummaries", { multi: bibInfo }, resolveData );

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