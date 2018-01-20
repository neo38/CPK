/**
 * In this file are our customizations of jQuery self.
 *
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 */
(function( $ ) {
	"use strict";

	// TODO Rozšířit jQuery-based Ajax o automatické zpracování
	// Zásady zpracování:
	//
	// Pokud není vrácen objekt ve tvaru `{ data: Object, status: string }`,
	// tak je vždy chyba.
	//
	// Dále je prozkoumán status -> pouze "STATUS_OK" je plně ok, ostatní
	// znamenají různé úrovně chyb.
	//
	// Když je status ok, vracejí se plná data (včetně statusu).

	// Our additition to jQuery ajaxTransport - support for "image" data type.
	$.ajaxTransport( "image", function( options, originalOptions, jqXhr ) {

		// We works only for asynchronous GET requests
		if ( options.type !== "GET" || ! options.async ) {
			return;
		}

		/**
		 * @type {HTMLImageElement} image
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

						image = image.onreadystatechange = image.onerror = image.onload = null;
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

	/**
	 * Prototype object for meta data of an authority.
	 * @property {NULL|string} _id
	 * @property {NULL|string} auth_biographical_or_historical_data
	 * @property {NULL|string} auth_id
	 * @property {NULL|string} auth_name
	 * @property {NULL|string} auth_year
	 * @property {NULL|{auth_id: string}} authinfo
	 * @property {NULL|string} backlink_url
	 * @property {NULL|string} cover_icon_url
	 * @property {NULL|string} cover_medium_url
	 * @property {NULL|string} cover_preview510_url
	 * @property {NULL|string} cover_thumbnail_url
	 * @property {NULL|array} links
	 * @property {NULL|string} orig_height
	 * @property {NULL|string} orig_width
	 * @constructor
	 * @todo Check against the ObalkyKnih.cz API if all properties are included!
	 */
	function AuthorityMetadataPrototype() {
		this._id = null;
		this.auth_biographical_or_historical_data = null;
		this.auth_id = null;
		this.auth_name = null;
		this.auth_year = null;
		this.authinfo = null;
		this.backlink_url = null;
		this.cover_icon_url = null;
		this.cover_medium_url = null;
		this.cover_preview510_url = null;
		this.cover_thumbnail_url = null;
		this.links = null;
		this.orig_height = null;
		this.orig_width = null;
	}

	/**
	 * Creates instance of {@see AuthorityMetadataPrototype} from given data object.
	 * @param {Object} metadata
	 * @returns {AuthorityMetadataPrototype}
	 * @todo Check against the ObalkyKnih.cz API if all properties are included!
	 */
	AuthorityMetadataPrototype.parseFromObject = function parseAuthMetadataFromObject( metadata ) {
		var ret = new AuthorityMetadataPrototype();

		ret._id = metadata.hasOwnProperty( "_id" ) ? metadata._id : "";
		ret.auth_biographical_or_historical_data = metadata.hasOwnProperty( "auth_biographical_or_historical_data" ) ? metadata.auth_biographical_or_historical_data : "";
		ret.auth_id = metadata.hasOwnProperty( "auth_id" ) ? metadata.auth_id : "";
		ret.auth_name = metadata.hasOwnProperty( "auth_name" ) ? metadata.auth_name : "";
		ret.auth_year = metadata.hasOwnProperty( "auth_year" ) ? metadata.auth_year : "";
		ret.authinfo = metadata.hasOwnProperty( "authinfo" ) ? metadata.authinfo : {};
		ret.backlink_url = metadata.hasOwnProperty( "backlink_url" ) ? metadata.backlink_url : "";
		ret.cover_icon_url = metadata.hasOwnProperty( "cover_icon_url" ) ? metadata.cover_icon_url : "";
		ret.cover_medium_url = metadata.hasOwnProperty( "cover_medium_url" ) ? metadata.cover_medium_url : "";
		ret.cover_preview510_url = metadata.hasOwnProperty( "cover_preview510_url" ) ? metadata.cover_preview510_url : "";
		ret.cover_thumbnail_url = metadata.hasOwnProperty( "cover_thumbnail_url" ) ? metadata.cover_thumbnail_url : "";
		ret.links = metadata.hasOwnProperty( "links" ) ? metadata.links : [];
		ret.orig_height = metadata.hasOwnProperty( "orig_height" ) ? metadata.orig_height : "";
		ret.orig_width = metadata.hasOwnProperty( "orig_width" ) ? metadata.orig_width : "";

		return ret;
	};

	/**
	 * Prototype object for meta data of a book (see documentation for ObalkyKnih.cz API)
	 * @property {string} _id
	 * @property {{source: string, html: string}} annotation
	 * @property {string} backlink_url
	 * @property {string} bib_title
	 * @property {string} bib_year
	 * @property {{isbn: string, nbn: string, oclc: string}} bibinfo
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
	BookMetadataPrototype.parseFromObject = function parseBookMetadataFromObject( metadata ) {
		var ret = new BookMetadataPrototype();

		ret._id = metadata.hasOwnProperty( "_id" ) ? metadata._id : "";
		ret.annotation = metadata.hasOwnProperty( "annotation" ) ? metadata.annotation : "";
		ret.backlink_url = metadata.hasOwnProperty( "backlink_url" ) ? metadata.backlink_url : "";
		ret.bib_title = metadata.hasOwnProperty( "bib_title" ) ? metadata.bib_title : "";
		ret.bib_year = metadata.hasOwnProperty( "bib_year" ) ? metadata.bib_year : "";
		ret.bibinfo = metadata.hasOwnProperty( "bibinfo" ) ? metadata.bibinfo : {};
		ret.book_id = metadata.hasOwnProperty( "book_id" ) ? metadata.book_id : "";
		ret.cover_icon_url = metadata.hasOwnProperty( "cover_icon_url" ) ? metadata.cover_icon_url : "";
		ret.cover_medium_url = metadata.hasOwnProperty( "cover_medium_url" ) ? metadata.cover_medium_url : "";
		ret.cover_preview510_url = metadata.hasOwnProperty( "cover_preview510_url" ) ? metadata.cover_preview510_url : "";
		ret.cover_thumbnail_url = metadata.hasOwnProperty( "cover_thumbnail_url" ) ? metadata.cover_thumbnail_url : "";
		ret.csn_iso_690 = metadata.hasOwnProperty( "csn_iso_690" ) ? metadata.csn_iso_690 : "";
		ret.csn_iso_690_source = metadata.hasOwnProperty( "csn_iso_690_source" ) ? metadata.csn_iso_690_source : "";
		ret.ean = metadata.hasOwnProperty( "ean" ) ? metadata.ean : "";
		ret.ean_other = metadata.hasOwnProperty( "ean_other" ) ? metadata.ean_other : [];
		ret.flag_bare_record = metadata.hasOwnProperty( "flag_bar_record" ) ? metadata.flag_bare_record : 0;
		ret.nbn = metadata.hasOwnProperty( "nbn" ) ? metadata.nbn : "";
		ret.oclc = metadata.hasOwnProperty( "oclc" ) ? metadata.oclc : "";
		ret.orig_height = metadata.hasOwnProperty( "orig_height" ) ? metadata.orig_height : "";
		ret.orig_width = metadata.hasOwnProperty( "orig_width" ) ? metadata.orig_width : "";
		ret.part_root = metadata.hasOwnProperty( "part_root" ) ? metadata.part_root : 0;
		ret.rating_count = metadata.hasOwnProperty( "rating_count" ) ? metadata.rating_count : 0;
		ret.rating_sum = metadata.hasOwnProperty( "rating_sum" ) ? metadata.rating_sum : 0;
		ret.reviews = metadata.hasOwnProperty( "reviews" ) ? metadata.reviews : [];
		ret.succ_cover_count = metadata.hasOwnProperty( "succ_cover_count" ) ? metadata.succ_cover_count : "0";
		ret.succ_toc_count = metadata.hasOwnProperty( "succ_toc_count" ) ? metadata.succ_toc_count : "0";

		return ret;
	};

	/**
	 * Prototype object for single cover (as is parsed from target <div> element).
	 * @property {string} action
	 * @property {string} advert
	 * @property {{ isbn: string, nbn: string, auth_id: string, cover_medium_url: string, oclc: string}} bibInfo
	 * @property {HTMLElement} target
	 * @property {string} record
	 * @param {string} action (Optional.)
	 * @param {string} advert (Optional.)
	 * @param {{ isbn: string, nbn: string, auth_id: string, cover_medium_url: string, oclc: string}} bibInfo (Optional.)
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

		if ( advert !== undefined && typeof action === "string" ) {
			adv = advert;
		}

		if ( bibInfo !== undefined && typeof bibInfo === "object" ) {
			bi = bibInfo;
		}

		if ( record !== undefined && typeof record === "string" ) {
			rec = record;
		}

		if ( target !== undefined && !!target ) {
			elm = target;
		}

		// Public API
		var Cover = Object.create( null );

		Object.defineProperties( Cover, {
			"action"  : { get: function() { return act; }, set: function( v ) { act = v; } },
			"advert"  : { get: function() { return adv; }, set: function( v ) { adv = v; } },
			"bibInfo" : { get: function() { return bi; }, set: function( v ) { bi = v; } },
			"target"  : { get: function() { return elm; }, set: function( v ) { elm = v; } },
			"record"  : { get: function() { return rec; }, set: function( v ) { rec = v; } }
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
		cover.target  = elm.parentElement;
		cover.action  = elm.getAttribute( "data-obalkyknihcz" );
		cover.advert  = elm.hasAttribute( "data-advert" ) ? elm.getAttribute( "data-advert" ) : "";
		cover.bibInfo = bi;
		cover.record  = elm.hasAttribute( "data-recordId" ) ? elm.getAttribute( "data-recordId" ) : "";

		return cover;
	};

	/**
	 * This is our jQuery global access point.
	 * @type {Object}
	 */
	var cpk = Object.create( null );

	// Here goes prototype objects
	$.extend( cpk, {
		AuthorityMetadata: AuthorityMetadataPrototype,
		BookMetadata: BookMetadataPrototype,
		Cover: CoverPrototype
	} );

	// TODO Is `fn` really the point we want to extend? (in jQuery of course...)
	$.fn.cpk = cpk;

}( jQuery ));