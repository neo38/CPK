/**
 * jQuery Plugin for ObalkyKnih.cz.
 *
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 *
 * @todo Add cache using {@see CPK.localStorage} -> set a limit (20 MB?) but there is plenty of space.
 * @todo Add expiration for the cache.
 * @todo Check {@link https://github.com/moravianlibrary/CPK/commit/412d9dcd24ab1f9af8fda4844da18289332f8c22?diff=unified} and absorb it (names of PDF downloads)!
 * @todo Dont' forgot on this bug {@link https://bugzilla.knihovny.cz/show_bug.cgi?id=312}
 * @todo Try to minify this (if it works well).
 * @todo Add QUnit tests!
 * @todo Check if all strings for `VuFind.translate` are really registered!
 * @todo [PHP] We need ZF view helpers to render all.
 * @todo Use `Function.bind()` and `Function.call()` whenever it's possible (instead of nested functions).
 * @todo We should primarily use book's metadata -> even `fetchImage` gathers images that are mentioned in there....
 */

(function( $, document ) {
	"use strict";

	// Pozn.: Jedna varianta je, že by jsme cachovali jen největší varianty
	// obrázků, druhá je, že by jsme cachovali všechny potřebné velikosti;
	// samozřejmě dle stejného klíče.

	/**
	 * @private Processes elements that represent covers.
	 * @param {$.fn.cpk.Cover} cvr
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
	 * @private Returns cache for the images.
	 * @param {string} key
	 * @returns {object}
	 */
	function getCache( key ) {
		var cache = localStorage.getItem( key );

		if ( cache === null ) {
			cache = Object.create( null );
		} else if ( typeof cache === "string" ) {
			cache = JSON.parse( cache );
		}

		return cache;
	}

	/**
	 * @private Fetches image for the given cover.
	 * @param {CoverPrototype} cover
	 * @param {string} type (Optional.)
	 * @param {boolean} withoutLinks (Optional.)
	 */
	function fetchImage( cover, type, withoutLinks ) {
		console.log( "obalkyknihcz.fetchImage", cover, type, withoutLinks );

		// Consolidate arguments
		type = type === undefined ? "medium" : type;
		withoutLinks = withoutLinks === undefined ? false : withoutLinks;

		/**
		 * @private Retrieves image from the cache.
		 * @param {string} imgKey
		 * @returns {null|string}
		 */
		function getCachedImage( imgKey ) {
			var cache = getCache( "cpk_covers" );
			return ( cache[ imgKey ] !== undefined ) ? cache[ imgKey ] : null;
		}

		/**
		 * @private Saves image to the cache.
		 * @param {string} imgKey
		 * @param {string} img
		 */
		function setChachedImage( imgKey, img ) {
			var cache = getCache( "cpk_covers" );
			cache[ imgKey ] = img;
			localStorage.setItem( "cpk_covers", JSON.stringify( cache ));
		}

		/**
		 * @private Creates final HTML.
		 * @param {HTMLImageElement} img
		 */
		function useImage( img ) {
			var imgElm = createImage( img.src, obalkyknihcz.coverText.toString(), type );

			if ( withoutLinks === true ) {
				$( cover.target ).empty().append( imgElm );
			} else {
				var aElm = createAnchor( getCoverTargetUrl( cover.bibInfo ), imgElm );
				$( cover.target ).empty().append( aElm );
			}
		}

		/**
		 * @type {string|null}
		 */
		var cachedImg = getCachedImage( cover.record );

		// Either use cached image or request not-cached image via Ajax.
		if ( $.type( cachedImg ) === "string" ) {
			console.log( "Using cached image...", cachedImg );
			var img = new Image();
			img.src = cachedImg;
			img.onload = function() {
				useImage( img );
			};
		} else {
			// TODO What about fail?
			$.ajax({
				url: getImageUrl( obalkyknihcz.coverUrl.toString(), cover.bibInfo, type, cover.advert ),
				dataType: "image",
				success: function( img ) {
					if ( img ) {
						useImage( img );
						setChachedImage( cover.record, img.src );
					}
				}
			});
		}
	}

	/**
	 * @private Fetches image for the given cover. Renders image without link.
	 * @param {CoverPrototype} cover
	 * @param {string} type (Optional.)
	 */
	function fetchImageWithoutLinks( cover, type ) {
		console.log( "obalkyknihcz.fetchImageWithoutLinks", cover, type );
		fetchImage( cover, type, true );
	}

	/**
	 * @param {CoverPrototype} cover
	 */
	function displayThumbnail( cover ) {
		console.log( "obalkyknihcz.displayThumbnail", cover );
		fetchImage( cover, "medium", false );
	}

	/**
	 * @param {CoverPrototype} cover
	 */
	function displayThumbnailWithoutLinks( cover ) {
		console.log( "obalkyknihcz.displayThumbnailWithoutLinks", cover );
		fetchImage( cover, "medium", true );
	}

	/**
	 * @param {CoverPrototype} cover
	 * @param {boolean} withoutLinks (Optional.)
	 * @todo Use cache!
	 */
	function displayCover( cover, withoutLinks ) {
		console.log( "obalkyknihcz.displayCover", cover, withoutLinks );

		// Normalize arguments
		withoutLinks = withoutLinks === undefined ? false : withoutLinks;

		var tmp  = $( cover.target ).html(),
		    fail = false;

		console.log( "withoutLinks=" + ( withoutLinks === undefined ? "no" : ( withoutLinks ? "yes" : "no" ) ) );

		// Empty target element
		$( cover.target ).empty();

		// Firstly we need to load cover
		$.ajax({
			url: getImageUrl( obalkyknihcz.coverUrl.toString(), cover.bibInfo, "medium", cover.advert ),
			dataType: "image",
			success: function( img ) {
				if ( ! img ) {
					fail = true;
					return;
				}

				var imgElm = createImage( img.src, obalkyknihcz.coverText.toString(), "medium" );

				if ( withoutLinks === true ) {
					$( cover.target ).prepend( createDiv( "cover", imgElm ) );
				} else {
					var anchorElm = createAnchor( getCoverTargetUrl( cover.bibInfo ), imgElm );
					$( cover.target ).prepend( createDiv( "cover", anchorElm ) );
				}

				fail = false;
			},
			fail: function() {
				fail = true;
			}
		});

		// Secondly we need to load TOC
		$.ajax({
			url: getImageUrl( obalkyknihcz.tocUrl.toString(), cover.bibInfo, "medium", cover.advert ),
			dataType: "image",
			success: function( img ) {
				if ( ! img ) {
					fail = true;
				}

				var imgElm = createImage( img.src, obalkyknihcz.tocText.toString(), "medium" );

				if ( withoutLinks === true ) {
					$( cover.target.append( createDiv( "toc", imgElm ) ) );
				} else {
					var anchorElm = createAnchor( getPdfTargetUrl( cover.bibInfo ), imgElm );
					$( cover.target ).append( createDiv( "toc", anchorElm ) );
				}

				fail = false;
			},
			fail: function() {
				fail = true;
			}
		});

		if ( fail === true ) {
			console.log( "Using temporary saved HTML...", tmp );
			$( cover.target ).html( tmp );
		}
	}

	/**
	 * @param {CoverPrototype} cover
	 * @todo Re-implement it to use `displayCover` primarily...
	 * @todo Use cache!
	 * @todo Check where is this used!
	 */
	function displayCoverWithoutLinks( cover ) {
		console.log( "obalkyknihcz.displayCoverWithoutLinks", cover );
		displayCover( cover, true );
		//--------------------------------------------------------------------------
		/*var tmp  = $( cover.target ).html(),
			fail = false;

		console.log( cover, tmp );

		// Empty target element
		$( cover.target ).empty();

		// Load info text (about the source)
		var infoDivElm = document.createElement( "div" ),
		    infoText = document.createTextNode( VUF.translate( "Source" ) ),
		    infoTextSep = document.createTextNode( VUF.translate( ": " ) ),
		    infoAnchorElm = document.createElement( "a" ),
		    infoAnchorTxt = document.createTextNode( VUF.translate( "obalkyknihcz_title" ) );

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
			url: getImageUrl( obalkyknihcz.coverUrl.toString(), cover.bibInfo, "medium", cover.advert ),
			dataType: "image",
			success: function( img ) {
				if ( img ) {
					var imgElm = createImage( img.src, obalkyknihcz.coverText.toString(), "medium" );
					$( cover.target ).prepend( createDiv( "cover", imgElm ) );
				}
			},
			fail: function() {
				fail = true;
			}
		});

		// Secondly we need to load TOC
		$.ajax({
			url: getImageUrl( obalkyknihcz.tocUrl.toString(), cover.bibInfo, "medium", cover.advert ),
			dataType: "image",
			success: function( img ) {
				if ( img ) {
					var imgElm = createImage( img.src, obalkyknihcz.tocText.toString(), "medium" );
					$( createDiv( "cover", imgElm ) ).insertBefore( infoDivElm );
				}
			},
			fail: function() {
				fail = true;
			}
		});*/
	}

	/**
	 * @param {CoverPrototype} cover
	 */
	function displayThumbnailCoverWithoutLinks( cover ) {
		console.log( "obalkyknihcz.displayThumbnailCoverWithoutLinks", cover );
		var coverUrl = ( typeof cover.bibInfo.cover_medium_url !== "string" ) ?
			getImageUrl( obalkyknihcz.coverUrl.toString(), cover.bibInfo, "medium", cover.advert )
			: cover.bibInfo.cover_medium_url;

		$.ajax({
			url: coverUrl,
			dataType: "image",
			success: function( img ) {
				if ( img ) {
					var imgElm = createImage( img.src, obalkyknihcz.coverText.toString(), "medium" );
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
		console.log( "obalkyknihcz.displayAuthorityCover", cover );
		var auth_id = cover.bibInfo.auth_id;

		// TODO Tady jsou dva zřetězené dotazy...
		// Šlo by to jednodušeji implementovat jako "converter"? Tak, aby se
		// nám vrátil rovnou obrázek.

		$.getJSON(
			"/AJAX/JSON?method=getObalkyKnihAuthorityID",
			{ id: auth_id },
			function( data ) {
				console.log( data );
				$.ajax({
					url: data.data,
					dataType: "image",
					success: function( img ) {
						if ( img ) {
							createAuthorityCover( img.src,
								obalkyknihcz.authorityCoverText.toString(),
								auth_id, cover.target );
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
		console.log( "obalkyknihcz.displayAuthorityThumbnailCoverWithoutLinks", cover );

		// TODO Tady jsou dva zřetězené dotazy...
		// Šlo by to jednodušeji implementovat jako "converter"? Tak, aby se
		// nám vrátil rovnou obrázek.

		$.getJSON(
			"/AJAX/JSON?method=getObalkyKnihAuthorityID",
			{ id: cover.bibInfo.auth_id },
			function( data ) {
				console.log( data );
				$.ajax({
					url: data.data,
					dataType: "image",
					success: function( img ) {
						// TODO Use `createAuthorityCover` (firstly modify it)...
						if ( img ) {
							var imgElm = createImage( img.src, obalkyknihcz.coverText.toString(), "medium" );
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
		console.log( "obalkyknihcz.displaySummary", cover );
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
		console.log( "obalkyknihcz.displaySummaryShort", cover );
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
		 * @todo "Unhandled promise rejection: undefined" error shows up here!
		 */
		function processAuthRequests() {
			console.log( "processAuthRequests", tmp.authority );

			var auth_ids = [],
			    cached   = [];

			/**
			 * @private Retrieves authority's metadata from the cache.
			 * @param {string} imgKey
			 * @returns {null|string}
			 */
			function getCachedMetadata( imgKey ) {
				var cache = getCache( "cpk_auth_metadata" );
				return ( cache[ imgKey ] !== undefined ) ? cache[ imgKey ] : null;
			}

			/**
			 * @private Saves authority's metadata to the cache.
			 * @param {string} imgKey
			 * @param {string} img
			 */
			function setChachedMetadata( imgKey, img ) {
				var cache = getCache( "cpk_auth_metadata" );
				cache[ imgKey ] = img;
				localStorage.setItem( "cpk_auth_metadata", JSON.stringify( cache ));
			}

			// Collect ID of authorities

			// Já tady musím pro každé `auth_id` zjistit, jestli jsou
			// korespondující metadata uložena v cache nebo ne.
			//
			// Pokud ano, rovnou je zpracuji, pokud ne, pak je postoupím
			// k dalšímu zpracování přes AJAX (a tam je uložím do cache).
			//
			// (Pozn.: Pokud jsou data nalezeny v cache, tak musíme také
			// zkontrolovat jejich platnost s ohledem na aktuální čas.)

			tmp.authority.forEach(function( c ) {
				var auth = getCachedMetadata( c.bibInfo.auth_id );
				console.info( auth, auth instanceof $.fn.cpk.AuthorityMetadata );

				if ( auth instanceof $.fn.cpk.AuthorityMetadata ) {

					// Pokud jsou to neexpirovaná metadata tak je rovnou použijeme,
					// v ostatních případech přidáme ID autora do pole ke zpracování.

					cached.push( auth );
				} else {
					auth_ids.push( c.bibInfo.auth_id );
				}
			});

			console.log( auth_ids, cached );

			// If there are no authorities to resolve stop it
			if ( auth_ids.length === 0 && cached.length === 0 ) {
				return;
			}

			/**
			 * @param {object} obj
			 */
			function prepareCached( obj ) {
				/**
				 * @type {jQuery.fn.cpk.AuthorityMetadata}
				 */
				var a = $.fn.cpk.AuthorityMetadata.parseFromObject( obj );
				console.log( a );

				// All data should be pushed into the cache
				setChachedMetadata( a.authinfo.auth_id, a );
				cached.push( a );
			}

			/**
			 * @private Process single authority metadata item.
			 * @param {jQuery.fn.cpk.AuthorityMetadata} auth
			 */
			function processCached( auth ) {
				tmp.authority.forEach(function( cvr ) {
					if ( cvr.bibInfo.auth_id === auth.authinfo.auth_id ) {
						createAuthorityCover( auth.cover_medium_url,
							obalkyknihcz.authorityCoverText.toString(),
							auth.authinfo.auth_id, cvr.target );
					}
				});
			}

			// Get multiple authorities data by their IDs separated by comma
			$.ajax({
				dataType: "json", // TODO Set type to "authority-metadata"...
				url: "/AJAX/JSON?method=getMultipleAuthorityCovers",
				data: { id: auth_ids.join( "," ) },
				global: false,
				method: "GET",
				/**
				 * @param {{ data: array, status: string }} data
				 * @param {string} textStatus
				 * @param {jqXHR} jqXhr
				 */
				success: function( data, textStatus, jqXhr ) {
					console.log( "success", data, textStatus, jqXhr );

					// Check if correct data are returned
					if ( data.data === undefined || ! jQuery.isArray( data.data ) ) {
						console.error( "Request for covers of authorities failed!", data );
						return;
					}

					// Process all obtained data
					data.data.forEach( prepareCached );
				},
				/**
				 * @param {jqXHR} jqXhr
				 * @param {string} textStatus
				 */
				complete: function( jqXhr, textStatus ) {
					console.log( "complete", jqXhr, textStatus );
					console.log( cached );

					// Now process all cached items
					cached.forEach( processCached );
				}
			});
		}

		/**
		 * @private Processes actions `displaySummary` and `displaySummaryShort`.
		 * @returns {Promise}
		 */
		function processSummRequests() {
			console.log( "processSummRequests", tmp.summary );

			var bibInfo   = [];

			// Collects all bibInfos
			tmp.summary.forEach(function( c ) { bibInfo.push( c.bibInfo ); });

			console.log( bibInfo );

			// If there are no summaries to resolve stop it
			if ( bibInfo.length === 0 ) {
				return;
			}

			// Perform XHR request for all metadata
			$.getJSON( "/AJAX/JSON?method=getMultipleSummaries", { multi: bibInfo }, function( data ) {
				console.log( "Data for `getMultipleSummaries`", data );

				if ( data.data === undefined || ! jQuery.isArray( data.data ) ) {
					console.error( "Request for multiple summaries failed!", data );
					return;
				}

				console.log( "It passed...", data );
				//...
			} );
		}

		/**
		 * Are passed arguments or are expected to be get from the data-attributes of the target elements?
		 * @type {boolean}
		 */
		var areArgs = ( action !== undefined && !!bibInfo );
		console.info( areArgs ? "Direct arguments are used..." : "Data attributes are used..." );

		// Initialize `obalkyknihcz` for all the target elements.
		$( this ).each(function( idx, elm ) {
			var cvr = ( areArgs === true ) ?
				new $.fn.cpk.Cover( action, advert, bibInfo, record, elm )
				: $.fn.cpk.Cover.parseFromElement( elm );

			splitCovers( cvr );
		});

		$.when( processAuthRequests(), processSummRequests() );

		return this;
	}

	// Default plugin options

	// Set default cache URL
	var cacheUrl = "https://cache.obalkyknih.cz";

	// Other properties
	Object.defineProperties( obalkyknihcz, {
		"cacheUrl": { get: function() { return cacheUrl; }, set: function( v ) { cacheUrl = v; } },
		"coverUrl": { get: function() { return obalkyknihcz.cacheUrl + "/api/cover"; } },
		"tocUrl": { get: function() { return obalkyknihcz.cacheUrl + "/api/toc/thumbnail"; } },
		"pdfUrl": { get: function() { return obalkyknihcz.cacheUrl + "/api/toc/pdf"; } },
		"linkUrl": { get: function() { return "https://www.obalkyknih.cz/view"; } },
		"coverText": { get: function() { return VuFind.translate( "Cover for the item" ); } },
		"tocText": { get: function() { return VuFind.translate( "Table of contents" ); } },
		"noImgUrl": { get: function() { return "themes/bootstrap3/images/noCover.jpg"; } },
		"authorityCoverText": { get: function() { return VuFind.translate( "Cover for the authority" ); } }
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
	 * @type {obalkyknihcz}
	 */
	$.fn.obalkyknihcz = obalkyknihcz;

	// TODO This is just a temporary solution

	// Initializes all elements with attribute 'data-cover="true"'
	$( document ).ready(function() {
		$( '[data-obalkyknihcz]' ).obalkyknihcz();
	});

	// Return context to allow chaining
	return this;

}( jQuery, document ));
