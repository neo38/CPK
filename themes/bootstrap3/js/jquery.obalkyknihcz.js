/**
 * jQuery Plugin for ObalkyKnih.cz.
 *
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 *
 * @todo Add cache using {@see CPK.localStorage} -> set a limit (20 MB?) but there is plenty of space.
 * @todo Add selection filter to group some actions to reduce count of Ajax requests.
 * @todo Add custom jQuery selectors (select them directly by action's name).
 * @todo Check https://github.com/moravianlibrary/CPK/commit/412d9dcd24ab1f9af8fda4844da18289332f8c22?diff=unified and absorb it!
 * @todo Try to minify this (if it works well).
 * @todo Add QUnit tests!
 * @todo Check if all strings for `VuFind.translate` are really registered!
 * @todo Append just class according to size type to the image - do not use "width" or "height" attributes!!!
 * @todo [PHP] We need ZF view helpers to render all.
 *
 * @todo responsive
 * @todo (resit v MZK siti) user 702 - Nefunguje nacitani obalek pri strankovani
 * 
 * @todo Obálky čísel periodik https://bugzilla.knihovny.cz/show_bug.cgi?id=250
 * @fixme neni ikona pre Similar - Osobní finance. 10/2004 https://beta.knihovny.cz/Record/vkol.SVK01-001032551?referer=aHR0cHM6Ly9iZXRhLmtuaWhvdm55LmN6L1NlYXJjaC9SZXN1bHRzLz9ib29sMCU1QiU1RD1BTkQmdHlwZTAlNUIlNUQ9QWxsRmllbGRzJmxvb2tmb3IwJTVCJTVEPTE4MDUtOTAxNSZqb2luPUFORCZzZWFyY2hUeXBlVGVtcGxhdGU9YWR2YW5jZWQmZGF0YWJhc2U9U29sciZsaW1pdD0yMCZzb3J0PXJlbGV2YW5jZSZwYWdlPTE
 */

(function( $, document ) {
	"use strict";

	// This is pretty experimental ;)
	let XHR_OPTIMALIZATIONS = false;

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
		let _id, annot, burl, bibTitle, bibYear, bibInfo, bookId, cvrIconUrl,
			cvrMediumUrl, cvrPreviewUrl, cvrThumbUrl, csn, csnSrc, ean, eanOther,
			flag, nbn, oclc, origHeight, origWidth, root, ratCnt, ratSum, revs,
			sucCvrCnt, sucTocCnt;

		// Public API
		let Meta = Object.create( null );

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
		let ret = new BookMetadataPrototype();

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
		let act, adv, bi, elm, rec;

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
		let Cover = Object.create( null );

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
		let cover = new CoverPrototype(),
		    bi = Object.create( null );

		// Just to be sure that we are processing correct element
		if ( ! elm.hasAttribute( "data-obalkyknihcz" ) ) {
			throw new Error( "Unable to parse Cover from given element!" );
		}

		if ( elm.hasAttribute( "data-bibinfo" ) ) {
			bi = JSON.parse( elm.getAttribute( "data-bibinfo" ) );
		}

		// Collect data
		cover.target        = elm.parentElement;
		cover.action        = elm.getAttribute( "data-obalkyknihcz" );
		cover.advert        = elm.hasAttribute( "data-advert" ) ? elm.getAttribute( "data-advert" ) : "";
		cover.bibInfo       = bi;
		cover.record        = elm.hasAttribute( "data-recordId" ) ? elm.getAttribute( "data-recordId" ) : "";
        cover.format        = elm.hasAttribute( "data-format" ) ? elm.getAttribute( "data-format" ) : "";
        cover.hasMoreCovers = elm.hasAttribute( "data-hasMoreCovers" ) ? elm.getAttribute( "data-hasMoreCovers" ) : "";

		return cover;
	};

	// Below is implemented basic plugin functionality

	/**
	 * @private Processes elements that represent covers.
	 * @param {CoverPrototype} cvr
	 * @param {string} extra (Optional.)
	 */
	function processCover( cvr, extra ) {
		extra = extra === undefined ? "medium" : extra;

		switch( cvr.action ) {

			// These actions don't perform Ajax (and is better to render
			// them through PHP using ZF view helpers if possible).
			case "fetchImage": fetchImage( cvr, extra ); break;
			case "displayThumbnail": displayThumbnail( cvr ); break;

			// These actions perform Ajax but grouping is not possible

            case "displaySmallCover": displaySmallCover( cvr ); break;
			case "displayCover": displayCover( cvr ); break;
            case "displayCoreCover": displayCover( cvr, 'core' ); break;

			// These actions perform Ajax and are grouped
			case "displayAuthorityCover": displayAuthorityCover( cvr ); break;
            case "displayAuthorityCoreCover": displayAuthorityCover( cvr, 'core' ); break;
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

		if (undefined == bibInfo) {
			let bibInfo = {};
		}

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
		let img = document.createElement( "img" );

		img.setAttribute( "src", src );
		img.setAttribute( "alt", obalkyknihcz.coverText );
		img.classList.add( "obalkyknihcz-" + type );

		return img;
	}

	/**
	 * @private Creates anchor element.
	 * @param {string} href
	 * @param {HTMLImageElement} img
     * @param {string} target
	 * @returns {HTMLAnchorElement}
	 */
	function createAnchor( href, img, target = '_self' ) {
		let a = document.createElement( "a" );

		a.setAttribute( "href", href );
		a.classList.add( "title" );
		a.appendChild( img );

		a.setAttribute( "target", target );

		return a;
	}

	/**
	 * @private Creates div element.
	 * @param {string} cls
	 * @param {HTMLAnchorElement|HTMLImageElement} elm
	 * @returns {HTMLDivElement}
	 */
	function createDiv( cls, elm ) {
		let div = document.createElement( "div" );

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
					let imgElm = createImage( img.src, obalkyknihcz.coverText, type );
					$( cover.target ).empty().append( createAnchor( getCoverTargetUrl( cover.bibInfo ), imgElm, '_blank' ) );
				}
			},
		});
	}

    /**
     * @param {CoverPrototype} cover
	 * @param {string} iconType icon|thumbnail|medium|core
     */
    function displayCover( cover, iconType = 'medium' ) {

        let isCore = (iconType == 'core');
        let type = 'medium';
        let size = isCore ? 'preview510' : type;

        // Firstly we need to load cover
        $.ajax({
            url: getImageUrl( obalkyknihcz.coverUrl, cover.bibInfo, size, cover.advert ),
            dataType: "image",
            success: function( img ) {

                if ( img ) {

                    // Empty target element
                    $( cover.target ).empty();

                    let imgElm = createImage( img.src, obalkyknihcz.coverText, type );

                    if (isCore) {
                        let bigImageAnchorElm = createAnchor( img.src, imgElm) ;
                        bigImageAnchorElm.setAttribute( "class", "fancyZoomImage" );
                        $( cover.target ).prepend( createDiv( "cover", bigImageAnchorElm ) );

                        $( '.fancyZoomImage' ).fancybox({
                            'hideOnContentClick': true,
                            'transitionIn'	:	'elastic',
                            'transitionOut'	:	'elastic',
                            'speedIn'		:	600,
                            'speedOut'		:	200,
                            'overlayShow'	:	false
                        });
                    } else {
                        $( cover.target ).prepend( createDiv( "cover", imgElm ) );
                    }

                    if (isCore) {

						// Secondly we need to load TOC
						$.ajax({
							url: getImageUrl( obalkyknihcz.tocUrl, cover.bibInfo, "medium", cover.advert ),
							dataType: "image",
							success: function( img ) {
								if ( img ) {
									let imgElm = createImage( img.src, obalkyknihcz.tocText, type );
									let anchorElm = createAnchor( getPdfTargetUrl( cover.bibInfo ), imgElm, '_blank' );
									$( cover.target ).find( ".obalkyknihcz-cover" ).append( createDiv( "toc", anchorElm ) );
								}
							}
						});

                        // Load info text (about the source)
						let infoDivElm = document.createElement("div");
						let infoText = document.createTextNode(VuFind.translate("Source"));
                        let infoTextSep = document.createTextNode( VuFind.translate( ": " ) );
						let infoAnchorElm = document.createElement("a");
						let infoAnchorTxt = document.createTextNode(
							VuFind.translate(cover.hasMoreCovers ? "Show older periodic covers" : "obalkyknihcz_title")
						);

						$(cover.target).append(infoDivElm);

						infoDivElm.classList.add("obalky-knih-link", "col-md-12");

						infoAnchorElm.setAttribute("href", getCoverTargetUrl(cover.bibInfo));
						infoAnchorElm.setAttribute("target", "_blank");
						infoAnchorElm.classList.add("title");

						infoAnchorElm.appendChild(infoAnchorTxt);
						if (cover.hasMoreCovers == false) {
                            infoDivElm.appendChild(infoText);
                            infoDivElm.appendChild(infoTextSep);
                        }
						infoDivElm.appendChild(infoAnchorElm);
                    }

                }
            }
        });

    }

    /**
     * @param {CoverPrototype} cover
     */
    function displaySmallCover( cover ) {

        let type = 'medium';
        let size = 'small';

        let coverUrl = ( typeof cover.bibInfo.cover_medium_url !== "string" )
            ? getImageUrl( obalkyknihcz.coverUrl, cover.bibInfo, type, cover.advert )
            : cover.bibInfo.cover_medium_url;

        $.ajax({
            url: coverUrl,
            dataType: "image",
            success: function( img ) {
                if ( img ) {
                    let imgElm = createImage( img.src, obalkyknihcz.coverText, size );
                    $( cover.target ).empty().append( createDiv( "cover", imgElm ) );
                }
            }
        });
    }

    /**
     * @param {CoverPrototype} cover
     */
    function displayThumbnail( cover ) {

        let type = 'thumbnail';

        let coverUrl = ( typeof cover.bibInfo.cover_medium_url !== "string" )
            ? getImageUrl( obalkyknihcz.coverUrl, cover.bibInfo, type, cover.advert )
            : cover.bibInfo.cover_medium_url;

        $.ajax({
            url: coverUrl,
            dataType: "image",
            success: function( img ) {
                if ( img ) {
                    let imgElm = createImage( img.src, obalkyknihcz.coverText, type );
                    $( cover.target ).empty().append( createDiv( "cover", imgElm ) );
                }
            }
        });
    }

	/**
	 * @param {CoverPrototype} cover
     * @param {string} iconType icon|thumbnail|medium|core
	 */
	function displayAuthorityCover( cover, iconType = 'medium' ) {

        let isCore = (iconType == 'core');
        let type = 'medium';

		let auth_id = cover.bibInfo.auth_id;
		$.getJSON(
			"/AJAX/JSON?method=getObalkyKnihAuthorityID",
			{ id: auth_id },
			function( data ) {
				$.ajax({
					url: data.data.cover_medium_url,
					dataType: "image",
					success: function( img ) {
						if ( img ) {
							let imgElm = createImage( img.src, obalkyknihcz.coverText, type ),
								authorityLink = obalkyknihcz.authorityLinkUrl + "?auth_id=" + auth_id,
								anchorElm = createAnchor( authorityLink, imgElm, '_blank' );
							$( cover.target ).empty().append( createDiv( "cover", anchorElm ) );

							if (isCore) {
								// Load info text (about the source)
                                let infoDivElm = document.createElement( "div" ),
                                    infoText = document.createTextNode( VuFind.translate( "Source" ) ),
                                    infoTextSep = document.createTextNode( VuFind.translate( ": " ) ),
                                    infoAnchorElm = document.createElement( "a" ),
                                    infoAnchorTxt = document.createTextNode( VuFind.translate( "obalkyknihcz_title" ) );

                                $( cover.target ).append( infoDivElm );

                                infoDivElm.classList.add("obalky-knih-link", "col-md-12");

                                infoAnchorElm.setAttribute("href", authorityLink);
                                infoAnchorElm.setAttribute("target", "_blank");
                                infoAnchorElm.classList.add("title");

                                infoAnchorElm.appendChild(infoAnchorTxt);
                                infoDivElm.appendChild(infoText);
                                infoDivElm.appendChild(infoTextSep);
                                infoDivElm.appendChild(infoAnchorElm);
							}
						}
					},
					fail: function( jqXHR, textStatus, errorThrown ) {
                        console.error('getJSON request failed! ' + textStatus);
					}
				});
			}
		).fail(function( jqXHR, textStatus, errorThrown ) {
            console.error('getJSON request failed! ' + textStatus);
        });
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
		let query = "",
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
	 * - `displayAuthorityCover`
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
		let tmp = { authority: [], summary: [] };
        console.warn(action);
		/**
		 * @private Processes (split) covers.
		 * @param {CoverPrototype} cvr
		 */
		function splitCovers( cvr ) {
			switch ( cvr.action ) {

				// These actions will be processed normally
				case "fetchImage":
				case "displayThumbnail":
                case "displaySmallCover":
				case "displayCover":
                case "displayCoreCover":
					processCover( cvr );
					break;

				// These will be grouped
				case "displayAuthorityCover":
                case "displayAuthorityCoreCover":
					tmp.authority.push( cvr );
					break;

				case "displaySummery":
				case "displaySummaryShort":
					tmp.summary.push( cvr );
					break;
			}
		}

		/**
		 * @private Processes actions `displayAuthorityCover`.
		 * @returns {Promise}
		 */
		function processAuthRequests() {
			let deferred = $.Deferred(),
				auth_ids = [];

			// Collect ID of authorities
			tmp.authority.forEach(function( c ) { auth_ids.push( c.bibInfo.auth_id ); });

			// If there are no authorities to resolve stop it
			if ( auth_ids.length === 0 ) {
				setTimeout(function() { deferred.resolve(true); });
				return deferred.promise();
			}

			auth_ids = auth_ids.join( "," );

			// Get multiple authorities data by their IDs separated by comma
			$.getJSON( "/AJAX/JSON?method=getMultipleAuthorityCovers", { id: auth_ids }, function( data ) {

				// TODO Use obtained covers!

				deferred.resolve( true );
			});

			//$( covers.authority ).cpkCover();

			return deferred.promise();
		}

		/**
		 * @private Processes actions `displaySummary` and `displaySummaryShort`.
		 * @returns {Promise}
		 */
		function processSummRequests() {

			let deferred = $.Deferred(),
				bibInfo   = [];

			// Collects all bibInfos
			tmp.summary.forEach(function( c ) { bibInfo.push( c.bibInfo ); });

			// If there are no summaries to resolve stop it
			if ( bibInfo.length === 0 ) {
				setTimeout(function() { deferred.resolve(true); });
				return deferred.promise();
			}

			/**
			 * @param {Object} metadata
			 */
			function resolveMetadata( metadata ) {

				if ( ! ( !! metadata  ) ) {
					return;
				}

				if ( metadata.data === null ) {
					return;
				}

				/**
				 * @param {{ isbn: string, nbn: string }} aBibInfo
				 */
				function findCover( aBibInfo ) {
					return tmp.summary.filter(function( c ) {
						return ( aBibInfo.isbn === c.bibInfo.isbn && bibInfo.nbn === c.bibInfo.nbn );
					});
				}

				let meta          = [],
					currentCovers = [];

				$.each( metadata.data, function( i, d ) {
					let md = BookMetadataPrototype.parseFromObject( d );

					meta.push( md );
					currentCovers.push( findCover( md.bibinfo ) );
				});

				let currentCover = findCover( meta.bibinfo );

				let recId    = currentCover.record,
					cvrElm   = document.getElementById( "cover_" + recordId ),
					summElm  = document.getElementById( "summary_" + recordId ),
					ssummElm = document.getElementById( "short_summary_" + recordId );

				// TODO We need to use cover and annotation!
				try {
					// TODO Create image for the cover...
					//console.warn( "XXX Finish creating of image for the cover!", meta, currentCover, recId, cvrElm );
				} catch( e ) {}

				try {
					// TODO Create summary...
					//console.warn( "XXX Finish creating of summary!", meta, currentCover, recId, summElm );
				} catch( e ) {}

				try {
					// TODO Create short summary....
					//console.warn( "XXX Finish creating of short summary!", meta, currentCover, recId, ssummElm );
				} catch( e ) {}

				deferred.resolve( true );
			}

			// Perform XHR request for all metadata
			$.getJSON( "/AJAX/JSON?method=getMultipleSummaries", { multi: bibInfo }, resolveMetadata )
				.fail(function resolveMetadataActionsXhrFail() {
					deferred.reject( "XHR request 'resolveSummaryActions' failed!" );
				});

			return deferred.promise();
		}

		/**
		 * @private Resolves all promises.
		 * @param {boolean} first Result of the first promise.
		 * @param {boolean} second Result of the second promise.
		 */
		function resolvePromises( first, second ) {
			console.log( "X5", first, second );
		}

		// This is for elements which has data attributes
		if ( action === undefined || ! bibInfo ) {

			// Process all actions and split them as we need
			$( this ).each(function( idx, elm ) {
				let cvr = CoverPrototype.parseFromElement( elm );

				if ( XHR_OPTIMALIZATIONS === true ) {
					splitCovers( cvr );
				} else {
					processCover( cvr );
				}
			});

			// Process actions with grouped Ajax request
			if ( XHR_OPTIMALIZATIONS === true ) {
				let promises = $.when( processAuthRequests(), processSummRequests() );
				promises.done( resolvePromises );
			}
		}

		// This is for cases if arguments are passed
		else {

			// Process all actions and split them as we need
			$( this ).each(function( idx, elm ) {
				let cvr = new CoverPrototype( action, advert, bibInfo, record, elm );

				if ( XHR_OPTIMALIZATIONS === true ) {
					splitCovers( cvr );
				} else {
					processCover( cvr );
				}
			});

			// Process actions with grouped Ajax request
			if ( XHR_OPTIMALIZATIONS === true ) {
				let promises = $.when( processAuthRequests(), processSummRequests() );
				promises.done( resolvePromises );
			}
		}

		return this;
	}

	// Default plugin options

	// Set default cache URL
	let cacheUrl = "https://cache.obalkyknih.cz";
	Object.defineProperty( obalkyknihcz, "cacheUrl", {
		get: function() { return cacheUrl; },
		set: function( v ) { cacheUrl = v; }
	});

	// Other properties
	Object.defineProperties( obalkyknihcz, {
		"coverUrl"          : { get: function() { return obalkyknihcz.cacheUrl + "/api/cover"; } },
		"tocUrl"            : { get: function() { return obalkyknihcz.cacheUrl + "/api/toc/thumbnail"; } },
		"pdfUrl"            : { get: function() { return obalkyknihcz.cacheUrl + "/api/toc/pdf"; } },
		"linkUrl"           : { get: function() { return "https://www.obalkyknih.cz/view"; } },
        "authorityLinkUrl"  : { get: function() { return "https://www.obalkyknih.cz/view_auth"; } },
		"coverText"         : { get: function() { return VuFind.translate( "Cover for the item" ); } },
		"tocText"           : { get: function() { return VuFind.translate( "Table of contents" ); } },
		"noImgUrl"          : { get: function() { return "themes/bootstrap3/images/noCover.jpg"; } }
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
	 * @property {string} authorityLinkUrl
	 * @property {string} coverText
	 * @property {string} tocText
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
		let image;

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
						let statusText = status === 200 ? "success" : "error",
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