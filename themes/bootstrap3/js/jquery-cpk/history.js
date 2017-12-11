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
	 * @param {Object} data
	 * @property {Array} items
	 * @property {Object} covers
	 * @property {number} pages
	 * @constructor
	 */
    function HistoryItemDataPrototype( data ) {
    	this.items  = data.historyPage;
    	this.covers = data.obalky;
    	this.pages  = data.totalPages;
	}

	/**
	 * @param {number} idx
	 * @param {jQuery) elm
	 * @constructor
	 */
	function HistoryItemPrototype( idx, elm ) {
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
		 * @var {HistoryItemDataPrototype} pageCache
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
				console.log( "HistoryItemPrototype", ">", "getHistoryPage", ">", "onAjaxDone", response );

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
				console.log( data );

				// Check if data are correct
				if ( typeof data.historyPage === undefined || typeof data.obalky === "undefined" ) {
					if ( CPK.verbose === true ) {
						console.warn( "Returned history page data are not correct!", response, data );
					}

					return Promise.resolve( false );
				}

				// Save page into the cache
				pageCache = new HistoryItemDataPrototype( data );

				return Promise.resolve( true );
			}

			/**
			 *
			 * @type
			 */
			var t = { id: "", item_id: "", title: "", author: "", barcode: "", reqnum: "", loandate: "", duedate: "", returned: "", publicationYear: ""}

			/**
			 * @private Injects HTML from the `pagesCache[ cacheIndex ]`.
			 * @param {boolean} result
			 * @returns {Promise<boolean>}
			 */
			function injectHtml( result ) {
				console.log( "HistoryItemPrototype", ">", "getHistoryPage", ">", "injectHtml", result );

				if ( result !== true ) {
					return Promise.resolve( false );
				}

				// Insert returned HTML
				try {

					/**
					 *
					 * @param {{id: string, item_id: string, title: string, author: string, barcode: string, reqnum: string, loandate: string, duedate: string, returned: string, publicationYear: string, rowNo: number, uniqueId: string, z36_item_id: string, z36_sub_library_code: string, formats: Array}} historyItem
					 * @param {number} index
					 */
					function createHmlForItem( historyItem, index ) {
						var itemDiv = document.createElement( "div" );

						var thumbDiv = document.createElement( "div" );

						thumbDiv.appendChild( ( document.createElement( "string" ) ).appendChild( document.createTextNode( ( ( index + 1 ) + "." ) ) ) );

						var thumbInnerDiv = document.createElement( "div" );
						thumbInnerDiv.setAttribute( "id", "cover_" + historyItem.uniqueId );
						// XXX Append thumbnail!

						thumbDiv.appendChild( thumbInnerDiv );

						// ...

						itemDiv.appendChild( thumbDiv );
						cont.append( itemDiv );
						loader.attr( "hidden", "hidden" );
					}


					pageCache.items.forEach( createHmlForItem );



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
				console.log( request );

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
		var HistoryItem = Object.create( null );

		// Properties
		Object.defineProperty( HistoryItem, "username", { get: getUsername } );
		Object.defineProperty( HistoryItem, "source", { get: getSource } );

		// Methods
		HistoryItem.getPage = getHistoryPage();

		// Expose public API
		return HistoryItem;
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
		 * @property {HistoryItemPrototype[]} items
		 * @type {Object}
		 */
		var domLinker = Object.create( null );
		domLinker.items = [];

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
			function prepareHistoryItemDom( idx, elm ) {
				domLinker.items.push( new HistoryItemPrototype( idx, elm ) );
			}

			// Initialize DOM for all institutions
			$( ".checked-out-history-item-cont", domLinker.parent ).each( prepareHistoryItemDom );

			console.log( $( domLinker ) );

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
		 * Initializes event handlers for the controller.
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

			function initHistoryForItem( elm ) {
				console.log( elm );
			}

			// XXX Go through all `domLinker.items`
			domLinker.items.forEach( initHistoryForItem );

			return Promise.resolve( true );
		}

        /**
         * Handler for selected page event.
         * @param {number} page
         */
        function pageSelected(page) {
            // Show loader
            CPK.global.showDOM(loaderDiv);

            // Clear the page
            vm.historyPage = [];

            currentPage = page;

            updatePaginatorActivePage();

            $q.resolve(getMyHistoryPage())
                .then(onGotMyHistoryPage)
                .catch(function(err) {
                    if (CPK.verbose === true) {
                        console.error(err);
                    }
                });

            /**
             * @todo What is "$scope.$applyAsync"!
             */
            function onGotMyHistoryPage(result) {
                var historyPage = result.historyPage;

                // We need to refresh the view with async job .. use Promise
                new Promise(function(resolve) {
                    loaderDiv.setAttribute("hidden", "hidden");
                    vm.historyPage = historyPage;
                    return resolve();
                }).then($scope.$applyAsync).then(function() {
                    downloadCovers(result["obalky"])
                });
            }
        }

        /**
         * Is called when an perPage limit is chosen
         * @todo What is "$scope.paginator" and "$scope.$applyAsync"!
         */
        function perPageUpdated() {
            // Behave like we just reloaded the page
            new Promise(function(resolve) {
                // Hide paginator
                $scope.paginator.lastPage = 1;
                // Reset currentPage
                currentPage = 1;
                // Hide previous results
                vm.historyPage = [];
                // Show loader
                loaderDiv.removeAttribute("hidden");
                // Apply the view before prompting for new data
                resolve();
            }).then($scope.$applyAsync);

            // Clear the cache
            pagesCache = [];

            onHistoryUsernameDirectiveLinked(loaderDiv, username);
        }

        // Private

        /**
         * Handles the call of an improvised "onload" event when script links
         * the loader div with the username in it.
         * @param {HTMLElement} domElement
         * @param {String} parsedUsername
         */
        function onHistoryUsernameDirectiveLinked(domElement, parsedUsername) {
            loaderDiv = domElement;

            // Store the username value
            username = parsedUsername;

            // Execute non-blocking Q
            $q.resolve(getMyHistoryPage()).then(onGotMyHistoryPage).catch(function(err) {
                loaderDiv.innerHTML = "<span class='label label-danger'>" + err.message + "</span>";
            });

            /**
             * Resolves history page that matches our username.
             * @param {Object} result
             * @todo What is "$scope.$applyAsync"!
             */
            function onGotMyHistoryPage(result) {
                var historyPage = result.historyPage;
                var totalPages = result.totalPages;

                if (totalPages > 0) {
                    pagesCountDOM[username].className = pagesCountDOM[username].className.replace("hidden", "");
                }

                // Initialize the cache length
                pagesCache = new Array(totalPages);

                // Cache this result as it was removed from the cache in previous command
                pagesCache[0] = result;

                initializePaginator();

                // We need to refresh the view with async job .. use Promise
                new Promise(function(resolve) {
                    loaderDiv.setAttribute("hidden", "hidden");
                    vm.historyPage = historyPage;
                    resolve();
                }).then($scope.$applyAsync).then(function() {
                    downloadCovers(result["obalky"]);
                });
            }
        }

        /**
         * Downloads book covers.
         * @param {Object} covers
         */
        function downloadCovers(covers) {
            if (CPK.verbose === true) {
                console.log(covers);
            }

            if (typeof covers !== "undefined") {
                return;
            }

            for (var id in covers) {
                if (covers.hasOwnProperty(id)) {
                    obalky.fetchImage(id, covers[id].bibInfo, covers[id].advert, "icon");
                }
            }
        }

        /**
         * This function initializes paginator for history by setting totalPages
         * to the paginator object within a $scope and sets the active page.
         * @todo Here is "$scope" again!
         */
        function initializePaginator() {
            var visiblePagesList = [],
                pagesList = [],
                totalPages = pagesCache.length;

            // Initialize pagesList
            for (var i = 0; i < totalPages;) {
                pagesList[i++] = {
                    number : i,
                    clazz  : (i === 1) ? "active" : ""
                };

                if (i <= 5) {
                    visiblePagesList[i - 1] = pagesList[i - 1];
                }
            }

            // Now create the paginator object within the scope
            $scope.paginator = {
                lastPage : totalPages,
                visiblePages : visiblePagesList,
                pages : pagesList,
                activePage : 1,
                showFirst : false,
                showLast : totalPages > 5,
                goToPage : pageSelected
            };
        }

        /**
         * Updates paginator active page
         * @todo Here is "$scope" again!
         */
        function updatePaginatorActivePage() {
            new Promise(function(resolve) {
                var lastActivePage = $scope.paginator.activePage,
                    newPages = $scope.paginator.pages;

                // Update active element
                newPages[lastActivePage - 1].clazz = "";
                newPages[currentPage - 1].clazz = "active";

                var lastPage        = $scope.paginator.lastPage,
                    willShowFirst   = currentPage > 3,
                    willShowLast    = currentPage < ( lastPage - 2 ),
                    newVisiblePages = [],
                    maxPage         = currentPage + 2,
                    tolerance       = 3;

                if (maxPage > lastPage) {
                    tolerance = maxPage - lastPage + tolerance;
                    maxPage = lastPage;
                }

                for (var i = currentPage - tolerance, j = 0; i < maxPage; ++j, ++i) {
                    if (i < 0) {
                        maxPage = maxPage - i;

                        if (maxPage > lastPage) {
                            maxPage = lastPage;
                        }

                        i = 0;
                    }

                    var showThisPage = !((willShowLast && i === (lastPage - 1)) || (willShowFirst && i === 0));

                    if (showThisPage) {
                        newVisiblePages[j] = newPages[i];
                    } else {
                        --j;
                    }
                }

                $scope.paginator = {
                    lastPage : lastPage,
                    visiblePages : newVisiblePages,
                    pages : newPages,
                    activePage : currentPage,
                    showFirst : willShowFirst,
                    showLast : willShowLast,
                    goToPage : pageSelected
                };

                resolve();
            }).then($scope.$applyAsync);
        }

		// Public API
		var Controller = Object.create( null );

		// Properties
		Controller.historyPage    = [];
		Controller.perPage        = 10;

		// Methods
		Controller.initialize     = init;
		Controller.pageSelected   = pageSelected;
		Controller.perPageUpdated = perPageUpdated;

		return Controller;
    }

    /**
     * @type {CheckedOutHistoryController}
     */
    CPK.history = new CheckedOutHistoryController();

}( jQuery ));