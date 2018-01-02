/**
 * jQuery Plugin for ObalkyKnih.cz.
 *
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 *
 * @todo Add cache using {@see CPK.localStorage} -> set a limit (20 MB?) but there is plenty of space.
 * @todo Check https://github.com/moravianlibrary/CPK/commit/412d9dcd24ab1f9af8fda4844da18289332f8c22?diff=unified and absorb it (names of PDF downloads)!
 * @todo Try to minify this (if it works well).
 * @todo Add QUnit tests!
 * @todo Check if all strings for `VuFind.translate` are really registered!
 * @todo [PHP] We need ZF view helpers to render all.
 * @todo Use `Function.bind()` and `Function.call()` whenever it's possible (instead of nested functions).
 */

(function( $, document ) {
	"use strict";

	// This is pretty experimental ;)
	// TODO Remove this befor finishing!
	var XHR_OPTIMALIZATIONS = true;

	/**
	 * Prototype object for single book's metadata (see documentation for ObalkyKnih.cz API)
	 * @property {string} _id
	 * @property {{source: string, html: string}} annotation
	 * @property {string} backlink_url
	 * @property {string} bib_title
	 * @property {string} bib_year
	 * @property {{isbn: string, nbn: string}} bibinfo
	 * @property {string} book_id
	 * @property {string} cover_icon_url
	 * @property {string} cover_medium_url
	 * @property {string} cover_preview510_url
	 * @property {string} cover_thumbnail_url
	 * @property {string} csn_iso_690
	 * @property {string} csn_iso_690_source
	 * @property {string} ean
	 * @property {array} ean_other
	 * @property {number} flag_bare_record
	 * @property {string} nbn
	 * @property {string} oclc
	 * @property {string} orig_height
	 * @property {string} orig_width
	 * @property {number} part_root
	 * @property {number} rating_count
	 * @property {number} rating_sum
	 * @property {array} reviews
	 * @property {string} succ_cover_count
	 * @property {string} succ_toc_count
	 * @constructor
	 * @todo Check against the ObalkyKnih.cz API if all properties are included!
     * @todo Check how is this used in memory (are getters/setters same instances in different instances of the BookMetadataOject)?
	 */
	function BookMetadataPrototype() {
		var _id, annot, burl, bibTitle, bibYear, bibInfo, bookId, cvrIconUrl,
			cvrMediumUrl, cvrPreviewUrl, cvrThumbUrl, csn, csnSrc, ean, eanOther,
			flag, nbn, oclc, origHeight, origWidth, root, ratCnt, ratSum, revs,
			sucCvrCnt, sucTocCnt;

		// Public API
		var Meta = Object.create( null );

		Object.defineProperties( Meta, {
			"_id": { get: function() { return _id; }, set: function( v ) { _id = v; } },
			"annotation": { get: function() { return annot; }, set: function( v ) { annot = v; } },
			"backlink_url": { get: function() { return burl; }, set: function( v ) { burl = v; } },
			"bib_title": { get: function() { return bibTitle; }, set: function( v ) { bibTitle = v; } },
			"bib_year": { get: function() { return bibYear; }, set: function( v ) { bibYear = v; } },
			"bibinfo": { get: function() { return bibInfo; }, set: function( v ) { bibInfo = v; } },
			"book_id": { get: function() { return bookId; }, set: function( v ) { bookId = v; } },
			"cover_icon_url": { get: function() { return cvrIconUrl; }, set: function( v ) { cvrIconUrl = v; } },
			"cover_medium_url": { get: function() { return cvrMediumUrl; }, set: function( v ) { cvrMediumUrl = v; } },
			"cover_preview510_url": { get: function() { return cvrPreviewUrl; }, set: function( v ) { cvrPreviewUrl = v; } },
			"cover_thumbnail_url": { get: function() { return cvrThumbUrl; }, set: function( v ) { cvrThumbUrl = v; } },
			"csn_iso_690": { get: function() { return csn; }, set: function( v ) { csn = v; } },
			"csn_iso_690_source": { get: function() { return csnSrc; }, set: function( v ) { csnSrc = v; } },
			"ean": { get: function() { return ean; }, set: function( v ) { ean = v; } },
			"ean_other": { get: function() { return eanOther; }, set: function( v ) { eanOther = v; } },
			"flag_bare_record": { get: function() { return flag; }, set: function( v ) { flag = v; } },
			"nbn": { get: function() { return nbn; }, set: function( v ) { nbn = v; } },
			"oclc": { get: function() { return oclc; }, set: function( v ) { oclc = v; } },
			"orig_height": { get: function() { return origHeight; }, set: function( v ) { origHeight = v; } },
			"orig_width": { get: function() { return origWidth; }, set: function( v ) { origWidth = v; } },
			"part_root": { get: function() { return root; }, set: function( v ) { root = v; } },
			"rating_count": { get: function() { return ratCnt; }, set: function( v ) { ratCnt = v; } },
			"rating_sum": { get: function() { return ratSum; }, set: function( v ) { ratSum = v; } },
			"reviews": { get: function() { return revs; }, set: function( v ) { revs = v; } },
			"succ_cover_count": { get: function() { return sucCvrCnt; }, set: function( v ) { sucCvrCnt = v; } },
			"succ_toc_count": { get: function() { return sucTocCnt; }, set: function( v ) { sucTocCnt = v; } }
		});

		return Meta;
	}

	/**
	 * Creates instance of {@see BookMetadataPrototype} from given data object.
	 * @param {Object} metadata
	 * @returns {BookMetadataPrototype}
	 * @todo Check against the ObalkyKnih.cz API if all properties are included!
	 */
	BookMetadataPrototype.parseFromObject = function parseMetadataFromObject( metadata ) {
		var ret = new BookMetadataPrototype();

		ret._id = metadata.hasOwnProperty( "_id" ) ? "" : metadata._id;
		ret.annotation = metadata.hasOwnProperty( "annotation" ) ? {} : metadata.annotation;
		ret.backlink_url = metadata.hasOwnProperty( "backlink_url" ) ? "" : metadata.backlink_url;
		ret.bib_title = metadata.hasOwnProperty( "bib_title" ) ? "" : metadata.bib_title;
		ret.bib_year = metadata.hasOwnProperty( "bib_year" ) ? "" : metadata.bib_year;
		ret.bibinfo = metadata.hasOwnProperty( "bibinfo" ) ? {} : metadata.bibinfo;
		ret.book_id = metadata.hasOwnProperty( "book_id" ) ? "" : metadata.book_id;
		ret.cover_icon_url = metadata.hasOwnProperty( "cover_icon_url" ) ? "" : metadata.cover_icon_url;
		ret.cover_medium_url = metadata.hasOwnProperty( "cover_medium_url" ) ? "" : metadata.cover_medium_url;
		ret.cover_preview510_url = metadata.hasOwnProperty( "cover_preview510_url" ) ? "" : metadata.cover_preview510_url;
		ret.cover_thumbnail_url = metadata.hasOwnProperty( "cover_thumbnail_url" ) ? "" : metadata.cover_thumbnail_url;
		ret.csn_iso_690 = metadata.hasOwnProperty( "csn_iso_690" ) ? "" : metadata.csn_iso_690;
		ret.csn_iso_690_source = metadata.hasOwnProperty( "csn_iso_690_source" ) ? "" : metadata.csn_iso_690_source;
		ret.ean = metadata.hasOwnProperty( "ean" ) ? "" : metadata.ean;
		ret.ean_other = metadata.hasOwnProperty( "ean_other" ) ? [] : metadata.ean_other;
		ret.flag_bare_record = metadata.hasOwnProperty( "flag_bar_record" ) ? 0 : metadata.flag_bare_record;
		ret.nbn = metadata.hasOwnProperty( "nbn" ) ? "" : metadata.nbn;
		ret.oclc = metadata.hasOwnProperty( "oclc" ) ? "" : metadata.oclc;
		ret.orig_height = metadata.hasOwnProperty( "orig_height" ) ? "" : metadata.orig_height;
		ret.orig_width = metadata.hasOwnProperty( "orig_width" ) ? "" : metadata.orig_width;
		ret.part_root = metadata.hasOwnProperty( "part_root" ) ? 0 : metadata.part_root;
		ret.rating_count = metadata.hasOwnProperty( "rating_count" ) ? 0 : metadata.rating_count;
		ret.rating_sum = metadata.hasOwnProperty( "rating_sum" ) ? 0 : metadata.rating_sum;
		ret.reviews = metadata.hasOwnProperty( "reviews" ) ? [] : metadata.reviews;
		ret.succ_cover_count = metadata.hasOwnProperty( "succ_cover_count" ) ? "0" : metadata.succ_cover_count;
		ret.succ_toc_count = metadata.hasOwnProperty( "succ_toc_count" ) ? "0" : metadata.succ_toc_count;

		return ret;
	};

	/**
	 * Prototype object for single cover (as is parsed from target <div> element).
	 * @property {string} action
	 * @property {string} advert
	 * @property {{ isbn: string, nbn: string, auth_id: string, cover_medium_url: string}} bibInfo
	 * @property {HTMLElement} target
	 * @property {string} record
	 * @param {string} action (Optional.)
	 * @param {string} advert (Optional.)
	 * @param {{ isbn: string, nbn: string, auth_id: string, cover_medium_url: string}} bibInfo bibInfo (Optional.)
	 * @param {string} record (Optional.)
	 * @param {HTMLElement|string} target (Optional.)
	 * @constructor
	 */
	function CoverPrototype( action, advert, bibInfo, record, target ) {
		var act, adv, bi, elm, rec;

		// Process optional parameters
		if ( action !== undefined && typeof action === "string" ) {
			act = action;
		}

		if ( typeof advert !== undefined && typeof action === "string" ) {
			adv = advert;
		}

		if ( typeof bibInfo !== undefined && typeof bibInfo === "object" ) {
			bi = bibInfo;
		}

		if ( typeof record !== undefined && typeof record === "string" ) {
			rec = record;
		}

		if ( target !== undefined && !!target ) {
			elm = target;
		}

		// Public API
		var Cover = Object.create( null );

		Object.defineProperties( Cover, {
			"action"      : { get: function() { return act; }, set: function( v ) { act = v; } },
			"advert"      : { get: function() { return adv; }, set: function( v ) { adv = v; } },
			"bibInfo"     : { get: function() { return bi; }, set: function( v ) { bi = v; } },
			"target"      : { get: function() { return elm; }, set: function( v ) { elm = v; } },
			"record"      : { get: function() { return rec; }, set: function( v ) { rec = v; } }
		} );

		return Cover;
	}

	/**
	 * Parses {@see CoverPrototype} from data attributes of the given element.
	 * @param {HTMLElement} elm
	 * @returns {CoverPrototype}
	 * @throws Throws errors whenever parsing of element or bibInfo failed.
	 */
	CoverPrototype.parseFromElement = function parseCoverFromElement( elm ) {
		var cover = new CoverPrototype(),
		    bi = Object.create( null );

		// Just to be sure that we are processing correct element
		if ( ! elm.hasAttribute( "data-obalkyknihcz" ) ) {
			throw new Error( "Unable to parse Cover from given element!" );
		}

		if ( elm.hasAttribute( "data-bibinfo" ) ) {
			bi = JSON.parse( elm.getAttribute( "data-bibinfo" ) );
		}

		// Collect data
		cover.target      = elm.parentElement;
		cover.action      = elm.getAttribute( "data-obalkyknihcz" );
		cover.advert      = elm.hasAttribute( "data-advert" ) ? elm.getAttribute( "data-advert" ) : "";
		cover.bibInfo     = bi;
		cover.record      = elm.hasAttribute( "data-recordId" ) ? elm.getAttribute( "data-recordId" ) : "";

		return cover;
	};

	// Below is implemented basic plugin functionality

	/**
	 * @private Processes elements that represent covers.
	 * @param {CoverPrototype} cvr
	 * @param {string} extra (Optional.)
	 */
	function processCover( cvr, extra ) {
		extra = extra === undefined ? "icon" : extra;

		switch( cvr.action ) {

			// These actions don't perform Ajax (and is better to render
			// them through PHP using ZF view helpers if possible).
			case "fetchImage": fetchImage( cvr, extra ); break;
			case "fetchImageWithoutLinks": fetchImageWithoutLinks( cvr, extra ); break;
			case "displayThumbnail": displayThumbnail( cvr ); break;
			case "displayThumbnailWithoutLinks": displayThumbnailWithoutLinks( cvr ); break;

			// These actions perform Ajax but grouping is not possible
			case "displayCover": displayCover( cvr ); break;
			case "displayCoverWithoutLinks": displayCoverWithoutLinks( cvr ); break;
			case "displayThumbnailCoverWithoutLinks": displayThumbnailCoverWithoutLinks( cvr ); break;

			// These actions perform Ajax and are grouped
			case "displayAuthorityCover": displayAuthorityCover( cvr ); break;
			case "displayAuthorityThumbnailCoverWithoutLinks": displayAuthorityThumbnailCoverWithoutLinks( cvr ); break;
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
	 * @param {string} type
	 * @returns {HTMLImageElement}
	 */
	function createImage( src, alt, type ) {
		var img = document.createElement( "img" );

		img.setAttribute( "src", src );
		img.setAttribute( "alt", alt );
		img.classList.add( "obalkyknihcz-" + type );

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

		div.classList.add( "obalkyknihcz-" + cls );
		div.appendChild( elm );

		return div;
	}

	/**
	 * @private Fetches image for the given cover.
	 * @param {CoverPrototype} cover
	 * @param {string} type (Optional.)
	 */
	function fetchImage( cover, type ) {
		type = type === undefined ? "medium" : type;
		$.ajax({
			url: getImageUrl( obalkyknihcz.coverUrl, cover.bibInfo, type, cover.advert ),
			dataType: "image",
			success: function( img ) {
				if ( img ) {
					var imgElm = createImage( img.src, obalkyknihcz.coverText, type );
					$( cover.target ).empty().append( createAnchor( getCoverTargetUrl( cover.bibInfo ), imgElm ) );
				}
			}
		});
	}

	/**
	 * @private Fetches image for the given cover. Renders image without link.
	 * @param {CoverPrototype} cover
	 * @param {string} type (Optional.)
	 */
	function fetchImageWithoutLinks( cover, type ) {
		type = type === undefined ? "thumbnail" : type;
		$.ajax({
			url: getImageUrl( obalkyknihcz.coverUrl, cover.bibInfo, type, cover.advert ),
			dataType: "image",
			success: function( img ) {
				if ( img ) {
					var imgElm = createImage( img.src, obalkyknihcz.coverText, type );
					$( cover.target ).empty().append( imgElm );
				}
			}
		});
	}

	/**
	 * @param {CoverPrototype} cover
	 */
	function displayThumbnail( cover ) {
		fetchImage( cover, "medium" );
	}

	/**
	 * @param {CoverPrototype} cover
	 */
	function displayThumbnailWithoutLinks( cover ) {
		fetchImageWithoutLinks( cover, "medium" );
	}

	/**
	 * @param {CoverPrototype} cover
	 * @todo If we clear target element at the first place we need to assure that some content is shown even no images were not returned.
	 */
	function displayCover( cover ) {
		$( cover.target ).empty();

		// Firstly we need to load cover
		$.ajax({
			url: getImageUrl( obalkyknihcz.coverUrl, cover.bibInfo, "medium", cover.advert ),
			dataType: "image",
			success: function( img ) {
				if ( img ) {
					var imgElm = createImage( img.src, obalkyknihcz.coverText, "medium" ),
						anchorElm = createAnchor( getCoverTargetUrl( cover.bibInfo ), imgElm );
					$( cover.target ).prepend( createDiv( "cover", anchorElm ) );
				}
			}
		});

		// Secondly we need to load TOC
		$.ajax({
			url: getImageUrl( obalkyknihcz.tocUrl, cover.bibInfo, "medium", cover.advert ),
			dataType: "image",
			success: function( img ) {
				if ( img ) {
					var imgElm = createImage( img.src, obalkyknihcz.tocText, "medium" ),
						anchorElm = createAnchor( getPdfTargetUrl( cover.bibInfo ), imgElm );
					$( cover.target ).append( createDiv( "toc", anchorElm ) );
				}
			}
		});
	}

	/**
	 * @param {CoverPrototype} cover
	 */
	function displayCoverWithoutLinks( cover ) {

		// Empty target element
		$( cover.target ).empty();

		// Load info text (about the source)
		var infoDivElm = document.createElement( "div" ),
		    infoText = document.createTextNode( VuFind.translate( "Source" ) ),
		    infoTextSep = document.createTextNode( VuFind.translate( ": " ) ),
		    infoAnchorElm = document.createElement( "a" ),
		    infoAnchorTxt = document.createTextNode( VuFind.translate( "obalkyknihcz_title" ) );

		infoDivElm.classList.add( "obalky-knih-link", "col-md-12" );

		infoAnchorElm.setAttribute( "href", getCoverTargetUrl( cover.bibInfo ) );
		infoAnchorElm.setAttribute( "target", "_blank" );
		infoAnchorElm.classList.add( "title" );

		infoAnchorElm.appendChild( infoAnchorTxt );
		infoDivElm.appendChild( infoText );
		infoDivElm.appendChild( infoTextSep );
		infoDivElm.appendChild( infoAnchorElm );

		$( cover.target ).append( infoDivElm );

		// Firstly we need to load cover
		$.ajax({
			url: getImageUrl( obalkyknihcz.coverUrl, cover.bibInfo, "medium", cover.advert ),
			dataType: "image",
			success: function( img ) {
				if ( img ) {
					var imgElm = createImage( img.src, obalkyknihcz.coverText, "medium" );
					$( cover.target ).prepend( createDiv( "cover", imgElm ) );
				}
			}
		});

		// Secondly we need to load TOC
		$.ajax({
			url: getImageUrl( obalkyknihcz.tocUrl, cover.bibInfo, "medium", cover.advert ),
			dataType: "image",
			success: function( img ) {
				if ( img ) {
					var imgElm = createImage( img.src, obalkyknihcz.tocText, "medium" );
					$( createDiv( "cover", imgElm ) ).insertBefore( infoDivElm );
				}
			}
		});
	}

	/**
	 * @param {CoverPrototype} cover
	 */
	function displayThumbnailCoverWithoutLinks( cover ) {
		var coverUrl = ( typeof cover.bibInfo.cover_medium_url !== "string" )
			? getImageUrl( obalkyknihcz.coverUrl, cover.bibInfo, "medium", cover.advert )
			: cover.bibInfo.cover_medium_url;

		$.ajax({
			url: coverUrl,
			dataType: "image",
			success: function( img ) {
				if ( img ) {
					var imgElm = createImage( img.src, obalkyknihcz.coverText, "medium" );
					$( cover.target ).empty().append( createDiv( "cover", imgElm ) );
				}
			}
		});
	}

	/**
	 * @private Helper method for creating HTML of authority's cover.
	 * @param {string} imgUrl
	 * @param {string} imgAlt
	 * @param {string} authId
	 * @param {HTMLElement} target
	 */
	function createAuthorityCover( imgUrl, imgAlt, authId, target ) {
		var imgElm = createImage( imgUrl, imgAlt, "medium" ),
			anchorElm = createAnchor( "https://www.obalkyknih.cz/view_auth?auth_id=" + authId, imgElm );

		$( target ).empty().append( createDiv( "cover", anchorElm ) );
	}

	/**
	 * @param {CoverPrototype} cover
	 */
	function displayAuthorityCover( cover ) {
		var auth_id = cover.bibInfo.auth_id;
		$.getJSON(
			"/AJAX/JSON?method=getObalkyKnihAuthorityID",
			{ id: auth_id },
			function( data ) {
				$.ajax({
					url: data.data,
					dataType: "image",
					success: function( img ) {
						if ( img ) {
							createAuthorityCover( img.src, obalkyknihcz.authorityCoverText, auth_id, cover.target );
						}
					}
				});
			}
		);
	}

	/**
	 * @param {CoverPrototype} cover
	 */
	function displayAuthorityThumbnailCoverWithoutLinks( cover ) {
		console.log( cover );
		$.getJSON(
			"/AJAX/JSON?method=getObalkyKnihAuthorityID",
			{ id: cover.bibInfo.auth_id },
			function( data ) {
				console.log( data );
				$.ajax({
					url: data.data,
					dataType: "image",
					success: function( img ) {
						if ( img ) {
							var imgElm = createImage( img.src, obalkyknihcz.coverText, "medium" );
							$( cover.target ).empty().append( createDiv( "cover", imgElm ) );
						}
					}
				});
			}
		);
	}

	/**
	 * @param {CoverPrototype} cover
	 */
	function displaySummary( cover ) {
		$.getJSON(
			"/AJAX/JSON?method=getSummaryObalkyKnih",
			{ bibinfo: cover.bibInfo },
			function( data ) {
				$( document.getElementById( "summary_" + cover.record ) ).html( data.data );
			}
		);
	}

	/**
	 * @param {CoverPrototype} cover
	 */
	function displaySummaryShort( cover ) {
		$.getJSON(
			"/AJAX/JSON?method=getSummaryShortObalkyKnih",
			{ bibinfo: cover.bibInfo },
			function( data ) {
				$( document.getElementById( "short_summary_" + cover.record ) ).html( data.data );
			}
		);
	}

	// Other private methods (utilities)

	/**
	 * @private Returns correct URL for the cover with given bibInfo.
	 * @param {{ isbn: string, nbn: string, auth_id: string}} bibInfo
	 * @returns {string}
	 */
	function getCoverTargetUrl( bibInfo ) {
		return obalkyknihcz.linkUrl + "?" + queryPart( bibInfo );
	}

	/**
	 * @private Returns correct URL for PDFs.
	 * @param {{ isbn: string, nbn: string, auth_id: string}} bibInfo
	 * @returns {string}
	 */
	function getPdfTargetUrl( bibInfo ) {
		return obalkyknihcz.pdfUrl + "?" + queryPart( bibInfo );
	}

	/**
	 * @private Creates GET parameters from given `bibInfo`
	 * @param {{ isbn: string, nbn: string, auth_id: string}} bibInfo
	 * @returns {string}
	 */
	function queryPart( bibInfo ) {
		var query = "",
			sep   = "";

		$.each( bibInfo, function( name, value ) {
			query += sep + name + "=" + encodeURIComponent( value );
			sep = "&";
		} );

		return query;
	}

	// Implementation of the jQuery plugin self

	/**
	 * Base of our plugin.
	 *
	 * It works two ways:
	 * 1) by getting neccessarry data from the data attributes of the target element
	 * 2) by putting these data directly through arguments
	 *
	 * Here are the examples:
	 *
	 * <pre>
	 * jQuery( "[data-obalkyknihcz]" ).obalkyknihcz(); // The first case
	 * jQuery( "#some-element" ).obalkyknihcz( "fetchImage", advert, bibInfo, recordId ); // The second case
	 * </pre>
	 *
	 * In both cases we need to check if there are not actions we can group.
	 * This all is because we need to reduce amount of XHR calls.
	 *
	 * We need to separate (and group) these actions:
	 * - `displayAuthorityCover` and `displayAuthorityThumbnailCoverWithoutLinks`
	 * - `displaySummary` and `displaySummaryShort`
	 *
	 * If these will be grouped and thus perform just one XHR call per group
	 * we will be satisfied.
	 *
	 * @param {string} action (Optional.)
	 * @param {string} advert
	 * @param {{ isbn: string, nbn: string, auth_id: string, cover_medium_url: string}} bibInfo (Optional.)
	 * @param {string} record
	 * @return {jQuery}
	 */
	function obalkyknihcz( action, advert, bibInfo, record ) {

		/**
		 * @type {{authority: CoverPrototype[], summary: CoverPrototype[]}}
		 */
		var tmp = { authority: [], summary: [] };

		/**
		 * @private Processes (split) covers.
		 * @param {CoverPrototype} cvr
		 */
		function splitCovers( cvr ) {
			switch ( cvr.action ) {

				// These actions will be processed normally
				case "fetchImage":
				case "fetchImageWithoutLinks":
				case "displayThumbnail":
				case "displayThumbnailWithoutLinks":
				case "displayCover":
				case "displayCoverWithoutLinks":
				case "displayThumbnailCoverWithoutLinks":
					processCover( cvr );
					break;

				// These will be grouped
				case "displayAuthorityCover":
				case "displayAuthorityThumbnailCoverWithoutLinks":
					tmp.authority.push( cvr );
					break;

				case "displaySummery":
				case "displaySummaryShort":
					tmp.summary.push( cvr );
					break;
			}
		}

		/**
		 * @private Processes actions `displayAuthorityCover` and `displayAuthorityThumbnailCoverWithoutLinks`.
		 * @returns {Promise}
		 * @todo "Unhandled promise rejection: undefined" error shows up here!
		 */
		function processAuthRequests() {
			var deferred = $.Deferred(),
			    auth_ids = [];

			// Collect ID of authorities
			tmp.authority.forEach(function( c ) { auth_ids.push( c.bibInfo.auth_id ); });

			// If there are no authorities to resolve stop it
			if ( auth_ids.length === 0 ) {
				setTimeout(function() { deferred.resolve( true ); });
				return deferred.promise();
			}

			// Get multiple authorities data by their IDs separated by comma
			$.getJSON( "/AJAX/JSON?method=getMultipleAuthorityCovers", { id: auth_ids.join( "," ) }, function( data ) {
				console.log( "Data for `getMultipleAuthorityCovers`", data );

				if ( data.data === undefined || ! jQuery.isArray( data.data ) ) {
					console.error( "Request for covers of authorities failed!", data );
					deferred.resolve( true );
					return;
				}

				for ( var i = 0; i < data.data.length; i++ ) {
					/**
					 * @type {{ _id: string, auth_biographical_or_historical_data: string, auth_id: string, auth_name: string, auth_year: string, authinfo: Object, backlink_url: string, cover_icon_url: string, cover_medium_url: string, cover_preview510_url: string, cover_thumbnail_url: string, links: array, orig_height: string, orig_width: string }}
					 */
					var itm = data.data[i];

					if ( typeof itm.authinfo !== "object" ) {
						continue;
					}

					for ( var j = 0; j < tmp.authority.length; j++ ) {
						/**
						 * @type {CoverPrototype}
						 */
						var cvr = tmp.authority[j];

						if ( cvr.bibInfo.auth_id !== itm.authinfo.auth_id ) {
							continue;
						}

						createAuthorityCover( itm.cover_medium_url, obalkyknihcz.authorityCoverText, itm.authinfo.auth_id, cvr.target );
					}
				}

				deferred.resolve( true );
			});

			return deferred.promise();
		}

		/**
		 * @private Processes actions `displaySummary` and `displaySummaryShort`.
		 * @returns {Promise}
		 */
		function processSummRequests() {
			console.log( "X4", tmp.summary );

			var deferred = $.Deferred(),
				bibInfo   = [];

			// Collects all bibInfos
			tmp.summary.forEach(function( c ) { bibInfo.push( c.bibInfo ); });

			console.log( bibInfo );

			// If there are no summaries to resolve stop it
			if ( bibInfo.length === 0 ) {
				setTimeout(function() { deferred.resolve(true); });
				return deferred.promise();
			}

			// Perform XHR request for all metadata
			$.getJSON( "/AJAX/JSON?method=getMultipleSummaries", { multi: bibInfo }, function( data ) {
				console.log( "Data for `getMultipleSummaries`", data );

				if ( data.data === undefined || ! jQuery.isArray( data.data ) ) {
					console.error( "Request for multiple summaries failed!", data );
					deferred.resolve( false );
					return;
				}

				//...

				deferred.resolve( true );
			} );

			return deferred.promise();
		}

		/**
		 * Are passed arguments or are expected to be get from the data-attributes of the target elements?
		 * @type {boolean}
		 */
		var areArgs = ( action !== undefined && !!bibInfo );
		console.info( areArgs ? "Direct arguments are used..." : "Data attributes are used..." );
		console.info( XHR_OPTIMALIZATIONS ? "XHR optimalizations are used..." : "XHR optimalizations are NOT used..." );

		// Initialize `obalkyknihcz` for all the target elements.
		$( this ).each(function( idx, elm ) {
			var cvr = ( areArgs === true )
				? new CoverPrototype( action, advert, bibInfo, record, elm )
				: CoverPrototype.parseFromElement( elm );

			( XHR_OPTIMALIZATIONS === true ) ? splitCovers( cvr ) : processCover( cvr );
		});

		// In both cases we need to execute promises if XHR optimalizations are enabled
		if ( XHR_OPTIMALIZATIONS === true ) {
			$.when( processAuthRequests(), processSummRequests() )
				.done( function( first, second ) {
					console.log( "DONE", first, second );
				} )
				.fail( function( first, second ) {
					console.log( "FAIL", first, second );
				} );
		}

		return this;
	}

	// Default plugin options

	// Set default cache URL
	var cacheUrl = "https://cache.obalkyknih.cz";
	Object.defineProperty( obalkyknihcz, "cacheUrl", {
		get: function() { return cacheUrl; },
		set: function( v ) { cacheUrl = v; }
	});

	// Other properties
	Object.defineProperties( obalkyknihcz, {
		"coverUrl" : { get: function() { return obalkyknihcz.cacheUrl + "/api/cover"; } },
		"tocUrl"   : { get: function() { return obalkyknihcz.cacheUrl + "/api/toc/thumbnail"; } },
		"pdfUrl"   : { get: function() { return obalkyknihcz.cacheUrl + "/api/toc/pdf"; } },
		"linkUrl"  : { get: function() { return "https://www.obalkyknih.cz/view"; } },
		"coverText": { get: function() { return VuFind.translate( "Cover for the item" ); } },
		"tocText"  : { get: function() { return VuFind.translate( "Table of contents" ); } },
		"noImgUrl" : { get: function() { return "themes/bootstrap3/images/noCover.jpg"; } },
		"authorityCoverText": { get: function() { return VuFind.translate( "Cover for the authority" ); } }
	});

	// Extend it with our prototype objects
	$.extend( obalkyknihcz, {
		BookMetadata: BookMetadataPrototype,
		Cover: CoverPrototype
	});

	// Publish it all for jQuery

	/**
	 * @property {string} coverUrl
	 * @property {string} tocUrl
	 * @property {string} pdfUrl
	 * @property {string} linkUrl
	 * @property {string} coverText
	 * @property {string} tocText
	 * @property {string} noImgUrl
	 * @property {string} authorityCoverText
	 * @property {BookMetadataPrototype} BookMetadata
	 * @property {CoverPrototype} Cover
	 * @type {obalkyknihcz}
	 */
	$.fn.obalkyknihcz = obalkyknihcz;

	// Our additition to jQuery ajaxTransport - support for "image" data type.
	$.ajaxTransport( "image", function( options, originalOptions, jqXhr ) {

		// We works only for asynchronous GET requests
		if ( options.type !== "GET" || ! options.async ) {
			return;
		}

		/**
		 * @type {Image} image
		 */
		var image;

		return {

			/**
			 * Send request for the image.
			 * @param {object} headers
			 * @param {function} complete
			 */
			send: function( headers, complete ) {
				image = new Image();

				/**
				 * @private Handles image request.
				 * @param {number} status
				 */
				function done( status ) {
					if ( image ) {
						var statusText = status === 200 ? "success" : "error",
							tmp = image;

						image = image.onreadystatechange = image.onerror = image.oload = null;
						complete( status, statusText, { image: (tmp.width > 1 && tmp.height > 1) ? tmp : null } );
					}
				}

				image.onreadystatechange = image.onload = function() { done( 200 ); };
				image.onerror = function() { done( 404 ); };
				image.src = options.url;
			},

			/**
			 * On image loading is aborted.
			 */
			abort: function() {
				if ( image ) {
					image = image.onreadystatechange = image.onerror = image.onload = null;
				}
			}
		};
	});

	// TODO This is just a temporary solution

	// Initializes all elements with attribute 'data-cover="true"'
	$( document ).ready(function() {
		$( '[data-obalkyknihcz]' ).obalkyknihcz();
	});

	// Return context to allow chaining
	return this;

}( jQuery, document ));
