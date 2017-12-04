/**
 * New implementation of history of checked-out items.
 *
 * @author Jiří Kozlovský, original Angular solution
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 */

(function($) {
    if (CPK.verbose === true) {
        console.log("jquery-cpk/history.js");
    }

    var onHistoryUsernameLinked = function() {},
        pagesCountDOM = {};

    /**
     * History service controller
     * @param {Object} $q
     * @returns {CheckedOutHistoryController}
     * @constructor
     * @todo Resolve "$q"!
     */
    function CheckedOutHistoryController($q) {
        // Private
        var username = undefined,
            loaderDiv = undefined,
            currentPage = 1,
            pagesCache = [];

        onHistoryUsernameLinked = onHistoryUsernameDirectiveLinked;

        var vm = this;
        vm.historyPage = [];
        vm.pageSelected = pageSelected;
        vm.perPage = 10;
        vm.perPageUpdated = perPageUpdated;

        return vm;

        // Public

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
         * Method for fetching the history page specified by currentPage variable.
         * @returns {Promise}
         */
        function getMyHistoryPage() {
            return new Promise(function(resolve, reject) {
                var cacheIndex = currentPage - 1;

                // Search cache for existing page
                if (typeof pagesCache[cacheIndex] !== "undefined") {
                    return resolve(pagesCache[cacheIndex]);
                }

                var data = {
                    cat_username : username,
                    page : currentPage,
                    perPage : vm.perPage
                };

                $.post("/AJAX/JSON?method=getMyHistoryPage", data).done(
                    function(response) {
                        response = response.data;

                        if (typeof response.php_errors !== "undefined") {
                            $log.error(response.php_errors);
                        }

                        if (response.status === "OK") {
                            // Cache the answer ..
                            pagesCache[cacheIndex] = response.data;

                            if (typeof response.data.html !== "undefined" && typeof response.data.source !== "undefined") {
                                $("div#" + response.data.source).html(response.data.html);
                                return;
                            }

                            return resolve(response.data);
                        } else {
                            return reject(response.data);
                        }
                    }
                );
            });
        }

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
    }

    /**
     * @type {CheckedOutHistoryController}
     */
    CPK.history = new CheckedOutHistoryController(null);

}(jQuery));