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
	 * @property {number} current
	 * @constructor
	 */
    function HistorySourceData( data ) {
		this.items   = data.historyPage;
		this.covers  = data.obalky;
		this.pages   = data.totalPages;
		this.current = data.current;
	}

	/**
	 * Prototype for single history source (institution).
	 * @param {number} idx
	 * @param {jQuery) elm
	 * @constructor
	 */
	function HistorySource( idx, elm ) {

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

		/**
		 * @property {jQuery} cont
		 * @property {jQuery} loader
		 * @property {jQuery} pagination
		 * @type {Object} domLinker
		 */
		var domLinker        = Object.create( null );
		domLinker.cont       = $( ".history-item-list-cont", elm );
		domLinker.loader     = $( ".history-item-list-loader", elm );
		domLinker.pagination = $( ".history-item-list-pagination", elm );

		/**
		 * TRUE if we are currently running a request.
		 * @type {boolean} isLoading
		 */
		var isLoading = false;

		/**
		 * Index of currently requested history page.
		 * @type {number} requestedPageIndex
		 */
		var requestedPageIndex = 1;

		/**
		 * Holds TRUE if source has no history items.
		 * @type {boolean} noHistoryItems
		 */
		var noHistoryItems = false;

		/**
		 * Gets page with history of borrows.
		 * @param {number} pageIndex (Optional.)
		 * @returns {Promise<boolean>}
		 */
		function getHistoryPage( pageIndex ) {

			if ( pageIndex === undefined ) {
				pageIndex = 1;
			}

			// Set properties
			isLoading = true;
			requestedPageIndex = pageIndex;

			// Check cache and use it or make request
			/*if ( typeof pageCache !== "undefined" ) {
				return Promise.resolve( processHistorySources( true ) );
			}*/

			// Prepare data for request
			var request = {
				type : "POST",
				url  : "/AJAX/JSON?method=getMyHistoryPage",
				data : {
					cat_username : username,
					page         : requestedPageIndex,
					perPage      : CPK.history.perPage
				},
				dataType: "JSON"
			};

			// Send request and process the response
			return Promise
				.resolve( $.ajax( request ) )
				.then( onHistorySourcesAjaxDone )
				.then( processHistorySources )
				.then( finishInit );
		}

		/**
		 * Returns user name.
		 * @returns {string}
		 */
		function getUsername() { return username; }

		/**
		 * Returns identifier of the history source.
		 * @returns {string}
		 */
		function getSource() { return source; }


		function showRequestFailedMessage() {
			var msgSpan = document.createElement( "span" ),
				msgText = VuFind.translate( "Loading of history items failed!" );

			msgSpan.classList.add( "label", "label-danger" );
			msgSpan.appendChild( document.createTextNode( msgText ) );
			domLinker.loader.empty().append( msgSpan );
		}


		/**
		 * @private Handles response for history source.
		 * @param {Object} response
		 * @returns {Promise<boolean>}
		 * @todo Loader should be hidden in chained promise and should act according to `result` (`loaderDiv.innerHTML = "<span class='label label-danger'>" + err.message + "</span>";`).
		 */
		function onHistorySourcesAjaxDone( response ) {
			if ( response.status === "ERROR" ) {
				if ( typeof response.data.message === "string" ) {
					console.error( "Error returned when asking for history page of '" + username + "'.", response.data.message );
				} else {
					console.error( "Error returned when asking for history page of '" + username + "'." );
				}

				return Promise.resolve( false );
			} else if ( CPK.verbose === true ) {
				console.info( "Response for history page of '" + username + "' received.", response );
			}

			/**
			 * @var {{ historyPage: Array, obalky: Object, totalPages: number, html: string }} data
			 */
			var data = response.data;

			// Check data
			if ( response.status === "OK" && typeof data.html !== "undefined" ) {

				// There are no checked out items in history
				domLinker.loader.attr( "hidden", "hidden" );
				domLinker.loader.after( data.html );
				domLinker.pagination.hide();
				noHistoryItems = true;

				return Promise.resolve( true );
			} else if ( $.isArray( data.historyPage ) !== true || typeof data.obalky !== "object" ) {

				// Returned data are not correct
				if ( CPK.verbose === true ) {
					console.warn( "Returned history page data are not correct!", response, data );
				}


				return Promise.resolve( false );
			}

			noHistoryItems = false;

			// Set index of current page
			$.extend( data, { current: requestedPageIndex } );

			// Save page into the cache
			pageCache = new HistorySourceData( data );

			return Promise.resolve( true );
		}

		/**
		 * @private Injects HTML from the `pagesCache[ cacheIndex ]`.
		 * @param {boolean} result
		 * @returns {Promise<boolean>}
		 */
		function processHistorySources( result ) {
			if ( result !== true ) {
				return Promise.resolve( false );
			}

			if ( result === true && noHistoryItems === true ) {
				return Promise.resolve( true );
			}

			// Process history source
			try {

				// Clear cont
				domLinker.cont.empty();

				// Create history items list
				pageCache.items.forEach( createHmlForHistoryItem );

				// Hide loader
				domLinker.loader.attr( "hidden", "hidden" );

				// Initialize pagination
				createPaginationForHistorySource( pageCache );

				return Promise.resolve( true );
			} catch ( error ) {
				if ( CPK.verbose === true ) {
					console.warn( "Inserting of history page failed!", error );
				}

				return Promise.resolve( false );
			}
		}

		/**
		 * @private Finalizes history initialization.
		 * @param {boolean} result
		 * @returns {Promise<boolean>}
		 */
		function finishInit( result ) {

			// Firstly finalize loading
			isLoading = false;

			if ( result === false) {

				// Hide loader and show error message
				showRequestFailedMessage();

				if ( CPK.verbose === true ) {
					console.info( "Loading of history of '" + source + "' was not finished successfully!" );
				}
			} else if ( CPK.verbose === true ) {
				console.info( "Loading of history of '" + source + "' finished successfully!" );
			}

			return Promise.resolve( true );
		}

		/**
		 * @private Creates HTML for single history item.
		 * @param {{id: string, item_id: string, title: string, author: string, barcode: string, reqnum: string, loandate: string, duedate: string, returned: string, publicationYear: string, rowNo: number, uniqueId: string, z36_item_id: string, z36_sub_library_code: string, formats: Array, renewed: string, volume: string }} historyItem
		 * @param {number} index
		 * @todo All inline CSS should be moved into CSS files!
		 */
		function createHmlForHistoryItem( historyItem, index ) {
			var itemDiv = document.createElement( "div" );

			itemDiv.setAttribute( "id", "record" + historyItem.uniqueId );
			itemDiv.classList.add( "row", "well" );
			itemDiv.style.marginBottom = "2px";

			// Column with thumbnail
			var thumbDiv  = document.createElement( "div" ),
				idxStrong = document.createElement( "strong" ),
				coverId   = "#cover_" + historyItem.uniqueId,
				itemIndex = index + 1;

			if ( pageCache.current > 1 ) {
				itemIndex = ( pageCache.current * CPK.history.perPage ) + itemIndex;
			}

			idxStrong.classList.add( "pull-left" );
			idxStrong.appendChild( document.createTextNode( itemIndex.toString() + "." ) );
			thumbDiv.classList.add( "col-sm-2", "text-center" );
			thumbDiv.appendChild( idxStrong );

			var thumbInnerDiv = document.createElement( "div" );

			thumbInnerDiv.setAttribute( "id", "cover_" + historyItem.uniqueId );

			if ( pageCache.covers[ coverId ] !== undefined ) {
				/**
				 * @type {{ bibInfo: string, advert: string }}
				 */
				var cover = pageCache.covers[ coverId ];

				try {
					$( thumbInnerDiv ).cover( "fetchImage", "icon", { bibinfo: cover.bibInfo, advert: cover.advert });
				} catch ( error ) {
					if ( CPK.verbose === true ) {
						console.error( "Unable to get cover for the history item", historyItem, cover, error );
					}
				}
			}

			thumbDiv.appendChild( thumbInnerDiv );

			// Column with text
			var textDiv = document.createElement( "div" );
			textDiv.classList.add( "col-sm-9" );

			// Title
			var titleDiv    = document.createElement( "div" ),
				titleAnchor = document.createElement( "a" ),
				titleUrl    = "/Record/" + encodeURIComponent( historyItem.id );

			titleAnchor.classList.add( "title" );
			titleAnchor.setAttribute( "href", titleUrl );
			titleAnchor.appendChild( document.createTextNode( historyItem.title ) );
			titleDiv.appendChild( titleAnchor );
			textDiv.appendChild( titleDiv );

			// Author
			var authorDiv    = document.createElement( "div" ),
				authorAnchor = document.createElement( "a" ),
				authorUrl    = "/Home/?author=" + encodeURIComponent( historyItem.author ),
				authorText   = document.createTextNode( VuFind.translate( "by" ) );

			authorAnchor.classList.add( "author" );
			authorAnchor.setAttribute( "href", authorUrl );
			authorAnchor.appendChild( document.createTextNode( historyItem.author ) );
			authorDiv.appendChild( authorText );
			authorDiv.appendChild( document.createTextNode( ": " ) );
			authorDiv.appendChild( authorAnchor );
			textDiv.appendChild( authorDiv );

			// Volume
			if ( historyItem.volume !== undefined ) {
				var volumeDiv    = document.createElement( "div" ),
					volumeStrong = document.createElement( "strong" ),
					volumeText   = document.createTextNode( VuFind.translate( "Volume" ) ),
					volumeBr     = document.createElement( "br" );

				volumeStrong.appendChild( volumeText );
				volumeDiv.appendChild( volumeStrong );
				volumeDiv.appendChild( document.createTextNode( historyItem.volume ) );
				volumeDiv.appendChild( volumeBr );

				textDiv.appendChild( volumeDiv );
			}

			// Formats
			if ( $.isArray( historyItem.formats ) ) {
				historyItem.formats.forEach(
					/**
					 * @param {{ orig: string, format: string }} format
					 */
					function createHtmlForItemFormat( format ) {
						var formatDiv    = document.createElement( "div" ),
							formatItalic = document.createElement( "i" ),
							formatSpan   = document.createElement( "span" ),
							formatText   = document.createTextNode( VuFind.translate( format.orig ) );

						formatItalic.classList.add( "small-format-icon", "pr-format-" + format.format );

						formatSpan.setAttribute( "data-orig", format.orig );
						formatSpan.classList.add( "format-text" );
						formatSpan.appendChild( formatText );

						formatDiv.classList.add( "iconlabel" );
						formatDiv.style.color = "#777";
						formatDiv.appendChild( formatItalic );
						formatDiv.appendChild( formatSpan );

						textDiv.appendChild( formatDiv );
					}
				);
			}

			// Renewed
			if ( historyItem.renewed !== undefined ) {
				var renewedDiv    = document.createElement( "div" ),
					renewedStrong = document.createElement( "strong" ),
					renewedText   = document.createTextNode( historyItem.renewed );

				renewedStrong.appendChild( renewedText );
				renewedDiv.appendChild( renewedStrong );
				textDiv.appendChild( renewedDiv );
			}

			// Due date
			var dueDateDiv    = document.createElement( "div" ),
				dueDateStrong = document.createElement( "strong" ),
				dueDateText   = document.createTextNode( VuFind.translate( "Due Date" ) );

			dueDateStrong.appendChild( dueDateText );
			dueDateDiv.appendChild( dueDateStrong );
			dueDateDiv.appendChild( document.createTextNode( ": " ) );
			dueDateDiv.appendChild( document.createTextNode( historyItem.duedate ) );
			textDiv.appendChild( dueDateDiv );

			// Finalize it
			itemDiv.appendChild( thumbDiv );
			itemDiv.appendChild( textDiv );
			domLinker.cont.append( itemDiv );
		}

		/**
		 * @private Creates pagination for history source.
		 * @param {{ items: Array, covers: Object, pages: number, current: number }} historySource
		 * @todo All inline CSS should be moved into CSS files!
		 */
		function createPaginationForHistorySource( historySource ) {

			// Check if pagination is needed
			if (historySource.pages <= 1 ) {
				return;
			}

			var firstDiv  = document.createElement( "div" ),
				secondDiv = document.createElement( "div" ),
				lastDiv   = document.createElement( "div" ),
				firstUl   = document.createElement( "ul" ),
				firstLi   = document.createElement( "li" ),
				pagesUl   = document.createElement( "ul" ),
				lastUl    = document.createElement( "ul" ),
				lastLi   = document.createElement( "li" );

			firstDiv.classList.add( "col-md-2" );
			secondDiv.classList.add( "col-md-8" );
			secondDiv.style.textAlign = "center";
			lastDiv.classList.add( "col-md-2" );
			firstUl.classList.add( "pagination" );
			lastUl.style.cssFloat = "left";
			pagesUl.classList.add( "pagination" );
			pagesUl.setAttribute( "align", "center" );
			lastUl.classList.add( "pagination" );
			lastUl.style.cssFloat = "right";

			// Previous link
			if ( historySource.current > 1 ) {
				var prevAnchor = document.createElement( "a" ),
					prevText   = document.createTextNode( VuFind.translate( "Prev" ) ),
				    prevIcon   = document.createElement( "i" ),
				    prevIndex  = historySource.current - 1;

				prevIcon.classList.add( "fa", "fa-long-arrow-left", "fa-2x" );
				prevIcon.style.position = "relative";
				prevIcon.style.top = "5px";
				prevIcon.style.right = "5px";

				prevAnchor.setAttribute( "href", "#" + source );
				prevAnchor.setAttribute( "data-page", prevIndex.toString() );
				prevAnchor.setAttribute( "rel", "nofollow" );
				prevAnchor.setAttribute( "title", VuFind.translate( "Prev" ) );
				prevAnchor.style.position = "relative";
				prevAnchor.style.top = "-5px";
				//prevAnchor.appendChild( prevText );
				prevAnchor.appendChild( prevIcon );
				prevAnchor.addEventListener( "click", onHistorySourcePaginationClick, true );

				firstLi.appendChild( prevAnchor );
			}

			firstUl.appendChild( firstLi );
			firstDiv.appendChild( firstUl );

			// Pages links
			for ( var i = 0; i < historySource.pages; i++ ) {
				var pageLi     = document.createElement( "li" ),
					pageAnchor = document.createElement( "a" ),
					pageIndex  = i + 1,
				    pageText   = document.createTextNode( pageIndex.toString() );

				if ( pageIndex === historySource.current ) {
					pageLi.classList.add( "active" );
				}

				pageAnchor.appendChild( pageText );
				pageAnchor.setAttribute( "href", "#" + source );
				pageAnchor.setAttribute( "data-page", pageIndex.toString() );
				pageAnchor.setAttribute( "rel", "nofollow" );
				pageAnchor.addEventListener( "click", onHistorySourcePaginationClick, true );

				pageLi.appendChild( pageAnchor );

				pagesUl.appendChild( pageLi );
			}

			secondDiv.appendChild( pagesUl );

			// Next link
			if ( historySource.current < historySource.pages ) {
				var lastAnchor = document.createElement( "a" ),
				    lastText   = document.createTextNode( VuFind.translate( "Next" ) ),
					lastIcon   = document.createElement( "i" ),
					nextIndex  = historySource.current + 1;

				lastIcon.classList.add( "fa", "fa-long-arrow-right", "fa-2x" );
				lastIcon.style.position = "relative";
				lastIcon.style.top = "5px";
				lastIcon.style.left = "5px";

				lastAnchor.setAttribute( "href", "#" + source );
				lastAnchor.setAttribute( "data-page", nextIndex.toString() );
				lastAnchor.setAttribute( "rel", "nofollow" );
				lastAnchor.setAttribute( "title", VuFind.translate( "Next" ) );
				lastAnchor.style.position = "relative";
				lastAnchor.style.top = "-5px";
				//lastAnchor.appendChild( lastText );
				lastAnchor.appendChild( lastIcon );
				lastAnchor.addEventListener( "click", onHistorySourcePaginationClick, true );

				lastLi.appendChild( lastAnchor );
			}

			lastUl.appendChild( lastLi );
			lastDiv.appendChild( lastUl );

			// Finish it
			domLinker.pagination.empty().append( firstDiv, [ secondDiv, lastDiv ] );
		}

		/**
		 * @private Event handler for
		 * @param {Event} event
		 */
		function onHistorySourcePaginationClick( event ) {
			// Stop propagation and prevent default action
			event.stopPropagation();
			event.preventDefault();

			// Check if there is any Ajax ongoing
			if ( isLoading === true ) {
				console.log( "There is still running other Ajax request... Exiting..." );
				return;
			}

			// Get index of requested page
			var pageIndex = $( this ).data( "page" );

			// Check if any action is needed
			if ( pageIndex === pageCache.current ) {
				return;
			}

			// Make request for new data
			Promise.resolve( getHistoryPage( pageIndex ) );
		}

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
		 * Just finalize initialization process.
		 * @param {boolean} result
		 * @returns {Promise<boolean>}
		 */
		function initHistory( result ) {
			if ( result === false ) {
				if ( CPK.verbose === true ) {
					console.warn( "Initialization of history of checked-out items failed!", domLinker );
				}

				return Promise.resolve( false );
			} else if ( CPK.verbose === true ) {
				console.info( "Initialization of history of checked-out items succeeded!" );
			}

			// Resolves as TRUE
			return Promise.resolve( true );
		}

		// Public API
		var Controller = Object.create( null );

		// Properties
		Controller.perPage        = 10;

		// Methods
		Controller.initialize     = init;

		return Controller;
    }

    /**
     * @type {CheckedOutHistoryController}
     */
    CPK.history = new CheckedOutHistoryController();

}( jQuery ));