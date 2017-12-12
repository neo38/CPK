/**
 * New implementation of history of checked-out items.
 *
 * @author Jiří Kozlovský, original Angular solution
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 */

(function( $ ) {
    if (CPK.verbose === true) {
        console.log( "jquery-cpk/history.js" );
    }

	/**
	 * Data for single history source (institution).
	 * @param {Object} data
	 * @property {Array} items
	 * @property {Object} covers
	 * @property {number} pages
	 * @constructor
	 */
    function HistorySourceData( data ) {
    	this.items  = data.historyPage;
    	this.covers = data.obalky;
    	this.pages  = data.totalPages;
	}

	/**
	 * Prototype for single history source (institution).
	 * @param {number} idx
	 * @param {jQuery) elm
	 * @constructor
	 */
	function HistorySource( idx, elm ) {
		console.log( idx, elm );

		/**
		 * @var {string} username
		 */
		var username = $( elm ).data( "username" );

		/**
		 * @var {string} source
		 */
		var source = $( elm ).data( "source" );

		/**
		 * @var {HistorySourceData} pageCache
		 */
		var pageCache;

		// Private
		var cont       = $( ".history-item-list-cont", elm ),
			loader     = $( ".history-item-list-loader", elm ),
			pagination = $( ".history-item-list-pagination", elm );

		/**
		 * Gets page with history of borrows.
		 * @returns {Promise<boolean>}
		 */
		function getHistoryPage() {

			/**
			 * @private
			 * @param {Object} response
			 * @returns {Promise<boolean>}
			 */
			function onAjaxDone( response ) {
				if ( typeof response.data.php_errors !== "undefined" ) {
					if ( CPK.verbose === true ) {
						console.error( response.data.php_errors );
					}

					return Promise.resolve( false );
				}

				if ( response.data.status === "OK" ) {
					if ( CPK.verbose === true ) {
						console.warn( "Returned not OK status!", response );
					}

					return Promise.resolve( false );
				}

				/**
				 * @property {Array} historyPage
				 * @property {Object} obalky
				 * @property {number} totalPages
				 */
				var data = response.data;
				console.log( "HistorySource", "getHistoryPage", "onAjaxDone", data );

				// Check if data are correct
				if ( typeof data.historyPage === undefined || typeof data.obalky === "undefined" ) {
					if ( CPK.verbose === true ) {
						console.warn( "Returned history page data are not correct!", response, data );
					}

					return Promise.resolve( false );
				}

				// Save page into the cache
				pageCache = new HistorySourceData( data );

				return Promise.resolve( true );
			}

			/**
			 * @private Injects HTML from the `pagesCache[ cacheIndex ]`.
			 * @param {boolean} result
			 * @returns {Promise<boolean>}
			 */
			function injectHtml( result ) {
				if ( result !== true ) {
					return Promise.resolve( false );
				}

				// Insert returned HTML
				try {

					/**
					 * @param {{id: string, item_id: string, title: string, author: string, barcode: string, reqnum: string, loandate: string, duedate: string, returned: string, publicationYear: string, rowNo: number, uniqueId: string, z36_item_id: string, z36_sub_library_code: string, formats: Array}} historyItem
					 * @param {number} index
					 * @todo All inline CSS should be moved into CSS files!
					 * @todo Loader should be hidden in chained promise and should act according to `result` (`loaderDiv.innerHTML = "<span class='label label-danger'>" + err.message + "</span>";`).
					 */
					function createHmlForItem( historyItem, index ) {
						var itemDiv = document.createElement( "div" );
						itemDiv.setAttribute( "id", "record" + historyItem.uniqueId );
						itemDiv.classList.add( "row", "well" );
						itemDiv.style.marginBottom = "2px";

						// Column with thumbnail
						var thumbDiv = document.createElement( "div" ),
							coverId = "#cover_" + historyItem.uniqueId;
						thumbDiv.classList.add( "col-sm-2", "text-center" );
						thumbDiv.appendChild( ( document.createElement( "string" ) ).appendChild( document.createTextNode( ( ( index + 1 ) + "." ) ) ) );

						var thumbInnerDiv = document.createElement( "div" );
						thumbInnerDiv.setAttribute( "id", "cover_" + historyItem.uniqueId );

						if ( typeof pageCache.covers[ coverId ] !== "undefined" ) {
							var cover = pageCache.covers[ coverId ];

							try {
								obalky.fetchImage( thumbInnerDiv, cover.bibInfo, cover.advert, "icon" );
							} catch ( error ) {
								if ( CPK.verbose === true ) {
									console.error( "Unable to get cover for the history item", historyItem, cover );
								}
							}
						}

						thumbDiv.appendChild( thumbInnerDiv );

						// Column with text
						var textDiv = document.createElement( "div" );
						textDiv.classList.add( "col-sm-9" );

						// Title
						var titleDiv = document.createElement( "div" ),
							titleAnchor = document.createElement( "a" );
						titleAnchor.classList.add( "title" );
						titleAnchor.setAttribute( "href", "/Record/" + encodeURIComponent( historyItem.id ) );
						titleAnchor.appendChild( document.createTextNode( historyItem.title ) );
						titleDiv.appendChild( titleAnchor );

						// Author
						var authorDiv = document.createElement( "div" ),
							authorAnchor = document.createElement( "a" );
						authorAnchor.classList.add( "author" );
						authorAnchor.setAttribute( "href", "/Home/?author=" + encodeURIComponent( historyItem.author ) );
						authorAnchor.appendChild( document.createTextNode( historyItem.author ) );
						authorDiv.appendChild( authorAnchor );

						// Volume
						var volumeDiv = document.createElement( "div" );

						// Formats
						historyItem.formats.forEach(
							/**
							 * @param {{ orig: string, format: string }} format
							 */
							function createHtmlForItemFormat( format ) {
								var formatDiv    = document.createElement( "div" ),
									formatItalic = document.createElement( "i" ),
									formatSpan   = document.createElement( "span" );

								formatItalic.classList.add( "small-format-icon", "pr-format-" + format.format );

								formatSpan.setAttribute( "data-orig", format.orig );
								formatSpan.classList.add( "format-text" )
								formatSpan.appendChild( document.createTextNode( VuFind.translate( format.orig ) ) );

								formatDiv.classList.add( "iconlabel" );
								formatDiv.style.color = "#777";
								formatDiv.appendChild( formatItalic );
								formatDiv.appendChild( formatSpan );

								textDiv.appendChild( formatDiv );
							}
						);

						// Renewed
						var renewedDiv = document.createElement( "div" );

						if ( typeof historyItem.renewed !== "undefined" ) {
							renewedDiv.appendChild( ( document.createElement( "strong" ) ).appendChild( document.createTextNode( historyItem.renewed ) ) );
						}

						// Finalize text column
						textDiv.appendChild( titleDiv );
						textDiv.appendChild( authorDiv );
						textDiv.appendChild( volumeDiv );
						textDiv.appendChild( renewedDiv );

						// Finalize it
						itemDiv.appendChild( thumbDiv );
						itemDiv.appendChild( textDiv );
						cont.append( itemDiv );
					}

					// Create HTML for all history items
					pageCache.items.forEach( createHmlForItem );

					// Hide loader
					loader.attr( "hidden", "hidden" );

					return Promise.resolve( true );
				} catch ( error ) {
					if ( CPK.verbose === true ) {
						console.warn( "Inserting of history page failed!", error );
					}

					return Promise.resolve( false );
				}
			}

			// Check cache and use it or make request
			if ( typeof pageCache !== "undefined" ) {
				return Promise.resolve( injectHtml( true ) );
			} else {

				// Prepare data for request
				var request = {
					type : "POST",
					url  : "/AJAX/JSON?method=getMyHistoryPage",
					data : {
						cat_username : username,
						page         : idx,
						perPage      : CPK.history.perPage
					},
					dataType: "JSON"
				};

				// Send request and process the response
				return Promise
					.resolve( $.ajax( request ) )
					.then( onAjaxDone )
					.then( injectHtml );
			}
		}

		/**
		 * @returns {string}
		 */
		function getUsername() { return username; }

		/**
		 * @returns {string}
		 */
		function getSource() { return source; }

		// Public API
		/**
		 * @property {string} username
		 * @property {string} source
		 * @type {Object}
		 */
		var Source = Object.create( null );

		// Properties
		Object.defineProperty( Source, "username", { get: getUsername } );
		Object.defineProperty( Source, "source", { get: getSource } );

		// Methods
		Source.getPage = getHistoryPage();

		// Expose public API
		return Source;
	}

    /**
     * History service controller
     * @returns {Object}
     * @constructor
     */
    function CheckedOutHistoryController() {
        // Private
        var currentPage = 1,
            pagesCache = [],
			pagesCountDOM = {};

		/**
		 * @property {HTMLElement} parent
		 * @property {HistorySource[]} sources
		 * @type {Object}
		 */
		var domLinker = Object.create( null );
		domLinker.sources = [];

		/**
		 * Initializes the controller.
		 * @returns {Promise<boolean>}
		 */
		function init() {
			return Promise
				.resolve( initDom() )
				.then( initHistory );
		}

		/**
		 * Initializes DOM links for the controller.
		 * @returns {Promise<boolean>}
		 */
		function initDom() {
			var result = true;

			// Get DOM links
			domLinker.parent = document.getElementById( "checked-out-history-cont" );

			/**
			 * @param {number} idx
			 * @param {jQuery} elm
			 */
			function prepareHistorySource( idx, elm ) {
				domLinker.sources.push( new HistorySource( idx, elm ) );
			}

			// Initialize DOM for all institutions
			$( ".checked-out-history-item-cont", domLinker.parent ).each( prepareHistorySource );

			/**
			 * @param {string} elmName
			 */
			function checkElm( elmName ) {
				try {
					/**
					 * @type {HTMLElement}
					 */
					var elm = domLinker[ elmName ];

					if ( elm.nodeType !== 1 ) {
						result = false;
					}
				} catch ( e ) {
					result = false;
				}
			}

			// Check if we found all DOM elements we need
			[ "parent" ].forEach( checkElm );

			// Resolve whole job
			return Promise.resolve( result );
		}

		/**
		 * Initializes available {@see HistorySource}s.
		 * @param {boolean} result
		 * @returns {Promise<boolean>}
		 */
		function initHistory( result ) {
			if ( result === false ) {
				if ( CPK.verbose === true ) {
					console.info( "Can not initialize history because of missing DOM links.", domLinker );
				}

				return Promise.resolve( false );
			}

			/**
			 * @param {HistorySource} source
			 */
			function initHistoryForSource( source ) {
				console.log( source );
			}

			// Go through `domLinker.sources` and initialize history for each institution
			domLinker.sources.forEach( initHistoryForSource );

			// Resolves as TRUE
			return Promise.resolve( true );
		}

		// Public API
		var Controller = Object.create( null );

		// Properties
		Controller.perPage        = 10;

		// Methods
		Controller.initialize     = init;
		//Controller.pageSelected   = pageSelected;
		//Controller.perPageUpdated = perPageUpdated;

		return Controller;
    }

    /**
     * @type {CheckedOutHistoryController}
     */
    CPK.history = new CheckedOutHistoryController();

}( jQuery ));