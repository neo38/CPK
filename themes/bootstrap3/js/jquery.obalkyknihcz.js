/**
 * jQuery Plugin for ObalkyKnih.cz.
 *
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 *
 * @todo Add cache using {@see CPK.localStorage}.
 * @todo Add selection filter to group some actions to reduce count of Ajax requests.
 * @todo Add custom jQuery selectors (select them directly by action's name).
 * @todo Check https://github.com/moravianlibrary/CPK/commit/412d9dcd24ab1f9af8fda4844da18289332f8c22?diff=unified and absorb it!
 * @todo Try to minify this (if it works well).
 * @todo Add QUnit tests!
 * @todo Check if all strings for `VuFind.translate` are really registered!
 */

(function( $, document ) {
	"use strict";

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
	 * @constructor
	 */
	function CoverPrototype() {
		var act, adv, bi, elm, rec;

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
		var cover = new CoverPrototype();

		// Just to be sure that we are processing correct element
		if ( ! elm.hasAttribute( "data-obalkyknihcz" ) ) {
			throw new Error( "Unable to parse Cover from given element!" );
		}

		var bi = Object.create( null );

		if ( elm.hasAttribute( "data-bibinfo" ) ) {
			try {
				bi = JSON.parse( elm.getAttribute( "data-bibinfo" ) );
			} catch( e ) {
				throw new Error( "Unable to parse BibInfo from given element!" );
			}
		}

		// Collect data
		cover.target      = elm.parentElement;
		cover.action      = elm.getAttribute( "data-obalkyknihcz" );
		cover.advert      = elm.hasAttribute( "data-advert" ) ? elm.getAttribute( "data-advert" ) : "";
		cover.bibInfo     = bi;
		cover.record      = elm.hasAttribute( "data-recordId" ) ? elm.getAttribute( "data-recordId" ) : "";

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
		var Size = Object.create( null );

		Object.defineProperties( Size, {
			"width": { get: function() { return w; } },
			"height": { get: function() { return h; } },
			"noImg": { get: function() { return img; } }
		} );

		return Size;
	}

	/**
	 * @private Processes elements that represent covers.
	 * @param {CoverPrototype} cvr
	 * @param {string} extra (Optional.)
	 */
	function processCover( cvr, extra ) {
		extra = extra === undefined ? "icon" : extra;

		switch( cvr.action ) {
			case "fetchImage": fetchImage( cvr, extra ); break;
			case "fetchImageWithoutLinks": fetchImageWithoutLinks( cvr, extra ); break;
			case "displayThumbnail": displayThumbnail( cvr ); break;
			case "displayThumbnailWithoutLinks": displayThumbnailWithoutLinks( cvr ); break;
			case "displayCover": displayCover( cvr ); break;
			case "displayCoverWithoutLinks": displayCoverWithoutLinks( cvr ); break;
			case "displayThumbnailCoverWithoutLinks": displayThumbnailCoverWithoutLinks( cvr ); break;
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
	 * @param {CoverSizePrototype} size
	 * @returns {HTMLImageElement}
	 */
	function createImage( src, alt, size ) {
		var img = document.createElement( "img" );

		img.setAttribute( "src", src );
		img.setAttribute( "alt", obalkyknihcz.coverText );

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
					var imgElm = createImage( img.src, obalkyknihcz.coverText, getCoverSize( type ) );
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
					var imgElm = createImage( img.src, obalkyknihcz.coverText, getCoverSize( type ) );
					$( cover.target ).empty().append( imgElm );
				}
			}
		});
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
					var imgElm = createImage( img.src, obalkyknihcz.coverText, obalkyknihcz.defaults.medium ),
						anchorElm = createAnchor( getCoverTargetUrl( cover.bibInfo ), imgElm );
					$( cover.target ).prepend( createDiv( "cover_thumbnail", anchorElm ) );
				}
			}
		});

		// Secondly we need to load TOC
		$.ajax({
			url: getImageUrl( obalkyknihcz.tocUrl, cover.bibInfo, "medium", cover.advert ),
			dataType: "image",
			success: function( img ) {
				if ( img ) {
					var imgElm = createImage( img.src, obalkyknihcz.tocText, obalkyknihcz.defaults.medium ),
						anchorElm = createAnchor( getPdfTargetUrl( cover.bibInfo ), imgElm );
					$( cover.target ).append( createDiv( "toc_thumbnail", anchorElm ) );
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
			infoAnchorElm = document.createElement( "a" );

		infoDivElm.style.paddingLeft = "0px";
		infoDivElm.style.textAlign = "center";
		infoDivElm.classList.add( "obalky-knih-link", "col-md-12" );

		infoAnchorElm.setAttribute( "href", getCoverTargetUrl( cover.bibInfo ) );
		infoAnchorElm.setAttribute( "target", "_blank" );
		infoAnchorElm.classList.add( "title" );

		infoAnchorElm.appendChild( document.createTextNode( VuFind.translate( obalkyknihcz_title ) ) );
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
					var imgElm = createImage( img.src, obalkyknihcz.coverText, obalkyknihcz.defaults.medium );
					$( cover.target ).prepend( createDiv( "cover_thumbnail", imgElm ) );
				}
			}
		});

		// Secondly we need to load TOC
		$.ajax({
			url: getImageUrl( obalkyknihcz.tocUrl, cover.bibInfo, "medium", cover.advert ),
			dataType: "image",
			success: function( img ) {
				if ( img ) {
					var imgElm = createImage( img.src, obalkyknihcz.tocText, obalkyknihcz.defaults.medium );
					$( createDiv( "cover_thumbnail", imgElm ) ).insertBefore( infoDivElm );
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
					var imgElm = createImage( img.src, obalkyknihcz.coverText, obalkyknihcz.defaults.icon );
					$( cover.target ).empty().append( createDiv( "cover_thumbnail", imgElm ) );
				}
			}
		});
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
							var imgElm = createImage( img.src, obalkyknihcz.coverText, obalkyknihcz.defaults.medium ),
								anchorElm = createAnchor( "https://www.obalkyknih.cz/view_auth?auth_id=" + auth_id, imgElm );
							$( cover.target ).empty().append( createDiv( "cover_thumbnail", anchorElm ) );
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
		$.getJSON(
			"/AJAX/JSON?method=getObalkyKnihAuthorityID",
			{ id: cover.bibInfo.auth_id },
			function( data ) {
				$.ajax({
					url: data.data,
					dataType: "image",
					success: function( img ) {
						if ( img ) {
							var imgElm = createImage( img.src, obalkyknihcz.coverText, obalkyknihcz.defaults.medium );
							$( cover.target ).empty().append( createDiv( "cover_thumbnail", imgElm ) );
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

	// Plugin self

	/**
	 * Base of our plugin.
	 * @param {string} action (Optional.)
	 * @param {{ isbn: string, nbn: string, auth_id: string, cover_medium_url: string}} bibInfo (Optional.)
	 * @param {string} advert
	 * @param {string} type
	 * @return {jQuery}
	 */
	function obalkyknihcz( action, bibInfo, advert, type ) {
		if ( action === undefined || ! bibInfo ) {
			$( this ).each(function( idx, elm ) {
				processCover( ( CoverPrototype.parseFromElement( elm ) ) );
			});
		} else {
			$( this ).each(function( idx, elm ) {
				var cvr = new CoverPrototype();
				cvr.action  = action;
				cvr.bibInfo = bibInfo;
				cvr.advert  = advert;
				cvr.target  = elm;

				processCover( cvr, type );
			});
		}

		// Return context to allow chaining
		return this;
	}

	// Default plugin options

	// Set covers cache URL
	var defaults = Object.create( null ),
		cacheUrl = "https://cache.obalkyknih.cz",
	    noImgUrl = "themes/bootstrap3/images/noCover.jpg";

	// Defaults
	Object.defineProperties( defaults, {
		"icon"     : { get: function() { return new CoverSizePrototype( 54, 68, noImgUrl ); } },
		"medium"   : { get: function() { return new CoverSizePrototype( 170, 240, noImgUrl ); } } ,
		"thumbnail": { get: function() { return new CoverSizePrototype( 27, 36, noImgUrl ); } }
	});

	// obalkyknihcz.cacheUrl
	Object.defineProperty( obalkyknihcz, "cacheUrl", {
		get: function() { return cacheUrl; },
		set: function( v ) { cacheUrl = v; }
	});

	// Other properties
	Object.defineProperties( obalkyknihcz, {
		"defaults"  : { get: function() { return defaults; } },
		"coverUrl"  : { get: function() { return obalkyknihcz.cacheUrl + "/api/cover"; } },
		"tocUrl"    : { get: function() { return obalkyknihcz.cacheUrl + "/api/toc/thumbnail"; } },
		"pdfUrl"    : { get: function() { return obalkyknihcz.cacheUrl + "/api/toc/pdf"; } },
		"linkUrl"   : { get: function() { return "https://www.obalkyknih.cz/view"; } },
		"coverText" : { get: function() { return VuFind.translate( "Cover for the item" ); } },
		"tocText"   : { get: function() { return VuFind.translate( "Table of contents" ); } }
	});

	/**
	 * @private Retrieves name for PDF document from its bibInfo.
	 * @param {{ isbn: string, nbn: string, auth_id: string, cover_medium_url: string}} bibInfo
	 * @returns {string}
	 */
	function getPdfDocumentName( bibInfo ) {
		var part = "",
			sep = "";

		$.each( bibInfo, function( name, value ) {
			part += sep + name + "-" + value;
			sep = "_";
		});

		var documentName = $( ".record-title strong" ).html(),
			resultName = documentName !== "undefined"
				? normalizeStr( documentName )
				: part;

		return resultName.replace( /[|&;^=$:%@"<>()`\/+,.{}\]]/g, "" ).split( " " ).join( "_" );
	}

	/**
	 * @private Normalizes string.
	 * @param {string} str
	 * @returns {string}
	 */
	function normalizeStr( str ) {
		return "" + str.normalize( 'NFD' ).replace( /[\u0300-\u036f]/g, "" );
	}

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

	/**
	 * @private Returns correct cover size by type.
	 * @param {string} type
	 * @returns {CoverSizePrototype}
	 */
	function getCoverSize( type ) {
		return obalkyknihcz.defaults[ type ] === undefined
			? obalkyknihcz.defaults.medium
			: obalkyknihcz.defaults[ type ];
	}

	// Extend it with our prototype objects
	$.extend( obalkyknihcz, {
		BookMetadata: BookMetadataPrototype,
		Cover: CoverPrototype,
		CoverSize: CoverSizePrototype
	});

	// Publish it all for jQuery

	/**
	 * @property {{icon: CoverSizePrototype, medium: CoverSizePrototype, thumbnail: CoverSizePrototype}} defaults
	 * @property {string} coverUrl
	 * @property {string} tocUrl
	 * @property {string} pdfUrl
	 * @property {string} linkUrl
	 * @property {string} coverText
	 * @property {string} tocText
	 * @property {BookMetadataPrototype} BookMetadata
	 * @property {CoverPrototype} Cover
	 * @property {CoverSizePrototype} CoverSize
	 * @type {obalkyknihcz}
	 */
	$.fn.obalkyknihcz = obalkyknihcz;

	// Our additition to jQuery ajaxTransport - support for "image" data type.
	$.ajaxTransport( "image", function( options, originalOptions, jqXhr ) {
		if ( options.type !== "GET" || ! options.async ) {
			return;
		}

		var image;
		return {
			send: function( headers, complete ) {
				image = new Image();
				function done( status ) {
					if ( image ) {
						var statusText = status === 200 ? "success" : "error",
							tmp = image;

						image = image.onreadystatechange = image.onerror = image.oload = null;
						complete( status, statusText, { image: (tmp.width > 1 && tmp.height > 1) ? tmp : null } );
					}
				}
				image.onreadystatechange = image.onload = function() {
					done( 200 );
				};
				image.onerror = function() {
					done( 404 );
				};
				image.src = options.url;
			},
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