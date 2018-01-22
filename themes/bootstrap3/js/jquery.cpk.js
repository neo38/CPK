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
	 * @property {NULL|[{ source_name: string, link: string, title: string }]} links
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
	 * @property {string} bib_author
	 * @property {string} bib_title
	 * @property {string} bib_year
	 * @property {{isbn: string, nbn: string, oclc: string}} bibinfo
	 * @property {string} book_id
	 * @property {string} book_id_parent
	 * @property {string} flag_bare_record (0=record contains cover, toc, comments...; 1=record has no additional info (cover, toc, comments))
	 * @property {string} part_info
	 * @property {string} part_root
	 * @property {string} part_no
	 * @property {string} part_name
	 * @property {string} part_year
	 * @property {string} part_volume
	 * @property {string} cover_icon_url
	 * @property {string} cover_medium_url
	 * @property {string} cover_preview510_url
	 * @property {string} cover_thumbnail_url
	 * @property {string} toc_thumbnail_url
	 * @property {string} toc_pdf_url
	 * @property {string} toc_full_text
	 * @property {string} csn_iso_690
	 * @property {string} csn_iso_690_source
	 * @property {string} ean
	 * @property {array} ean_other
	 * @property {number} flag_bare_record
	 * @property {string} nbn
	 * @property {string} oclc
	 * @property {string} ismn
	 * @property {string} orig_height
	 * @property {string} orig_width
	 * @property {number} part_root
	 * @property {number} rating_count
	 * @property {number} rating_sum
	 * @property {number} rating_avg5
	 * @property {number} rating_avg100
	 * @property {number} rating_url
	 * @property {array} reviews
	 * @property {string} succ_cover_count
	 * @property {string} succ_toc_count
	 * @property {string} ebook
	 * @constructor
	 * @todo Check against the ObalkyKnih.cz API if all properties are included!
	 */
	function BookMetadataPrototype() {
		this._id = null;
		this.annotation = null;
		this.backlink_url = null;
		this.bib_title = null;
		this.bib_year = null;
		this.bibinfo = null;
		this.book_id = null;
		this.cover_icon_url = null;
		this.cover_medium_url = null;
		this.cover_preview510_url = null;
		this.cover_thumbnail_url = null;
		this.csn_iso_690 = null;
		this.csn_iso_690_source = null;
		this.ean = null;
		this.ean_other = null;
		this.flag_bare_record = null;
		this.nbn = null;
		this.oclc = null;
		this.orig_height = null;
		this.orig_width = null;
		this.part_root = null;
		this.rating_count = null;
		this.rating_sum = null;
		this.reviews = null;
		this.succ_cover_count = null;
		this.succ_toc_count = null;
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
	 * @property {NULL|string} action
	 * @property {NULL|string} advert
	 * @property {NULL|{ isbn: string, nbn: string, auth_id: string, cover_medium_url: string, oclc: string}} bibInfo
	 * @property {NULL|HTMLElement} target
	 * @property {NULL|string} record
	 * @param {string} action (Optional.)
	 * @param {string} advert (Optional.)
	 * @param {{ isbn: string, nbn: string, auth_id: string, cover_medium_url: string, oclc: string}} bibInfo (Optional.)
	 * @param {string} record (Optional.)
	 * @param {HTMLElement|string} target (Optional.)
	 * @constructor
	 */
	function CoverPrototype( action, advert, bibInfo, record, target ) {
		this.action = ( action !== undefined && typeof action === "string" ) ? action : null;
		this.advert = ( advert !== undefined && typeof action === "string" ) ? advert : null;
		this.bibInfo = ( bibInfo !== undefined && typeof bibInfo === "object" ) ? bibInfo : null;
		this.record = ( record !== undefined && typeof record === "string" ) ? record :  null;
		this.target = ( target !== undefined && !!target ) ? target : null;
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
	 * Prototype for cache item.
	 * @param {NULL,string} id Record's identifier ("mzkXXXX..").
	 * @property {NULL|string} id
	 * @property {NULL|string} icon_url
	 * @property {NULL|string} medium_url
	 * @property {NULL|string} pdf_url
	 * @property {NULL|string} preview_url
	 * @property {NULL|string} thumbnail_url
	 * @property {NULL|string} summary
	 * @property {NULL|string} summary_short
	 * @constructor
	 */
	function CoverCacheItemPrototype( id ) {
		this.id = id;
		this.icon_url = null;
		this.medium_url = null;
		this.pdf_url = null;
		this.preview_url = null;
		this.thumbnail_url = null;
		this.summary = null;
		this.summary_short = null;
	}

	/**
	 * Parses {@see CoverCacheItemPrototype} from the given object.
	 * @param {AuthorityMetadataPrototype|{ id: string, icon_url: string, medium_url: string, pdf_url: string, preview_url: string, thumbnail_url: string, summary: string, summary_short: string }} obj
	 * @returns {CoverCacheItemPrototype}
	 */
	CoverCacheItemPrototype.parseFromObject = function( obj ) {
		var cacheItem;

		if ( obj.constructor.name === "AuthorityMetadataPrototype" ) {
			cacheItem = new CoverCacheItemPrototype( obj.authinfo.auth_id );
			cacheItem.icon_url = obj.cover_icon_url;
			cacheItem.medium_url = obj.cover_medium_url;
			cacheItem.preview_url = obj.cover_preview510_url;
			cacheItem.thumbnail_url = obj.cover_thumbnail_url;
			cacheItem.summary_short = obj.auth_biographical_or_historical_data;
		} else {
			cacheItem = new CoverCacheItemPrototype( obj.hasOwnProperty( "id" ) ? obj.id : null );
			cacheItem.icon_url = "icon_url" in obj ? obj.icon_url : null;
			cacheItem.medium_url = "medium_url" in obj ? obj.medium_url : null;
			cacheItem.pdf_url = "pdf_url" in obj ? obj.pdf_url : null;
			cacheItem.preview_url = "preview_url" in obj ? obj.preview_url : null;
			cacheItem.thumbnail_url = "thumbnail_url" in obj ? obj.thumbnail_url : null;
			cacheItem.summary = "summary" in obj ? obj.summary : null;
			cacheItem.summary_short = "summary_short" in obj ? obj.summary_short : null;
		}

		return cacheItem;
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
		Cover: CoverPrototype,
		CoverCacheItem: CoverCacheItemPrototype
	} );

	// TODO Is `fn` really the point we want to extend? (in jQuery of course...)
	$.fn.cpk = cpk;

}( jQuery ));