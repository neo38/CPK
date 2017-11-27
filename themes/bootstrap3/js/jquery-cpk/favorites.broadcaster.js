/**
 * Favorites - broadcaster.
 *
 * Rules of handling inter-tab "sessionStorage" with respect to the security
 * (yes, user's favorites does have a need to be handled securely).
 *
 * There are broadcast these events: "favoriteAdded" and "favoriteRemoved"
 *
 * Also there exists one master tab which always returns desired favorites on
 * prompt.
 *
 * Note that although this service is called broadcaster, it is also supposed
 * to handle the backend of listening to emitted event. The "broadcaster" name
 * is intended to simplify the implementation within controllers.
 *
 * @author Jiří Kozlovský, original Angular solution
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 */

(function($) {
    if (CPK.verbose === true) {
        console.log("jquery-cpk/favorites.broadcaster.js");
    }

    /**
     * @returns {Object}
     */
    function FavoritesBroadcaster() {
        /**
         * @type {Object}
         */
        var service = {
            broadcastAdded : broadcastAdded,
            broadcastRemoved : broadcastRemoved
        };

        /**
         * ID of current tab to identify requests & responses
         * @type {Number} tabId
         */
        var tabId;

        /**
         * ID of last tab which placed a request
         * @type {Number} tabId
         */
        var lastKnownTabId;

        init();

        return service;

        /**
         * Broadcasts event called "favoriteAdded" across all tabs listening
         * on storage event so they can update themselves.
         * @param {Favorite} favorite
         */
        function broadcastAdded(favorite) {
            var favObj = favorite.toObject();
            broadcast("favoriteAdded", JSON.stringify(favObj));
        }

        /**
         * Broadcasts event called 'favRemoved' across all tabs listening on
         * storage event so they can update themselves.
         * @param {String} favoriteId
         */
        function broadcastRemoved(favoriteId) {
            broadcast("favoriteRemoved", favoriteId);
        }

        // Private

        /**
         * Just broadcast a message using localStorage's event
         * @param {String} key
         * @param {String} val
         */
        function broadcast(key, val) {
            localStorage.setItem(key, val);
            localStorage.removeItem(key);

            if (CPK.verbose) {
                console.debug("Emitted broadcast with key & value", key, val);
            }
        }

        /**
         * Create localStorage event listener to have ability of fetching data
         * from another tab.
         *
         * Also prompt for newest sessionStorage data if this is new tab
         * created.
         *
         * Also share current sessionStorage with another tabs if is this master
         * tab. Note that only master tab can share current sessionStorage to
         * prevent spamming from many tabs opened willing to share their
         * sessionStorage
         */
        function init() {
            if (isNewTab()) {
                handleNewTab();
            } else {
                handleOldTab();
            }

            window.addEventListener("storage", handleStorageEvent);
            sendFavoritesIfNecessary();
        }

        /**
         * Handler for "storage" event.
         * @param {Event} event
         */
        function handleStorageEvent(event) {
            if (CPK.verbose) {
                console.debug("Received an broadcast: ", event);
            }

            // New masterTab ?
            if (event.key === "favoritesMasterTab") {
                // Should this tab be masterTab ?
                if (parseInt(event.newValue) === tabId || event.newValue === "rand") {
                    becomeMaster();
                }
            } else if (event.key === "favAdded" && event.newValue) {
                handleFavoriteAdded(event);
            } else if (event.key === "favRemoved" && event.newValue) {
                handleFavoriteRemoved(event);
            } else if (event.key === "purgeAllTabs" && event.newValue) {
                storage.removeAllFavorites();
            }
        }

        /**
         * Handler for "favoriteAdded" event.
         * @param {Event} event
         */
        function handleFavoriteAdded(event) {
            var favObj = JSON.parse(event.newValue);
            var newFav = new Favorite().fromObject(favObj);

            CPK.favorites.storage.add(newFav).then(function() {
                // Tell the controllers ..
                if (typeof window.__favChanged === "function") {
                    if (CPK.verbose) {
                        console.debug("Calling 'window.__favChanged' with ", newFav);
                    }

                    window.__favChanged(true, newFav);
                }
            });
        }

        /**
         * Handler for "favoriteRemoved" event.
         * @param {Event} event
         */
        function handleFavoriteRemoved(event) {
            var favObj = JSON.parse(event.newValue);
            var oldFav = new Favorite().fromObject(favObj);

            CPK.favorites.storage.remove(oldFav.created).then(function() {
                // Tell the controllers ..
                if (typeof window.__favChanged === "function") {
                    if (CPK.verbose) {
                        console.debug("Calling 'window.__favChanged' with ", oldFav);
                    }

                    window.__favChanged(false, oldFav);
                }
            });
        }

        /**
         * Returns boolean whether is this tab a new tab or not.
         */
        function isNewTab() {
            return typeof sessionStorage.tabId === 'undefined';
        }

        /**
         * Handles the logic right after we found out this is brand new tab
         * without any useful sessionStorage data.
         *
         * It basically prompts another tabs for existing favorites & stores
         * them inside sessionStorage.
         */
        function handleNewTab() {
            // Generate tabId ..
            tabId = Date.now();
            sessionStorage.tabId = tabId;

            /**
             * Handler for "storage" event.
             * @param {Event} event
             */
            function onGotFavorites(event) {
                if (parseInt(event.key) === tabId) {
                    if (event.newValue === "null") {
                        sessionStorage.setItem(storage.name, "[]");
                        return;
                    }

                    // We got response, so there is already a master tab
                    window.clearTimeout(mastershipRetrieval);

                    // Set the sessionStorage
                    sessionStorage.setItem(storage.name, event.newValue);

                    // Let the controller know ..
                    if (typeof window.__favChanged === "function") {
                        var _favorites = JSON.parse(event.newValue);
                        var favorites = _favorites.map(function(fav) {
                            return new CPK.favorites.Favorite().fromObject(fav);
                        });

                        favorites.forEach(function(favorite) {
                            window.__favChanged(true, favorite);
                        });

                        if (_favorites.length) {
                            favsNotifications.favAdded();
                        }
                    }

                    // Remove this listener
                    window.removeEventListener("storage", onGotFavorites);
                }
            }

            // Attach event listener
            window.addEventListener("storage", onGotFavorites);

            /**
             * Wait 1500 ms for response, then suppose this is the first tab.
             * @type {Number} mastershipRetrieval
             * @todo This should be made without the stupid timeout!
             */
            var mastershipRetrieval = window.setTimeout(function() {
                window.removeEventListener("storage", onGotFavorites);
                sessionStorage.setItem(storage.name, "[]");
                becomeMaster(true);
            }, 1500);

            // Ask other tabs for favorites ..
            broadcast("giveMeFavorites", tabId);
        }

        /**
         * Handles the logic right after we found out this is an old tab.
         *
         * It basically prompts reassigns important persistent variables.
         */
        function handleOldTab() {
            // Assign the tabId the first tabId generated by this tab
            tabId = sessionStorage.tabId;

            var masterTabId = localStorage.favoritesMasterTab;

            if (masterTabId === tabId || masterTabId === "rand") {
                becomeMaster(true);
            } else if (CPK.verbose === true) {
                console.debug("Being a slaveTab is nice!");
            }
        }

        /**
         * Becoming master tab
         *
         * @param {Boolean} active
         *
         * Determines if this tab is becoming master tab actively or passively
         * (if it was told it to do so, or it decied itself by reaching the
         * timeout when no master returns response on init request)
         */
        function becomeMaster(active) {
            if (CPK.verbose) {
                (typeof active === "undefined")
                    ? console.debug("Passively becoming masterTab!")
                    : console.debug("Actively becoming masterTab!");
            }

            // Overwrite it to inform other tabs about becoming masterTab..
            localStorage.setItem("favoritesMasterTab", tabId);

            /**
             * Give up mastership when tab is closed.
             */
            window.onbeforeunload = function() {
                giveUpMastership();
            };

            // Create event listener to play master role
            window.addEventListener("storage", masterJob);

            /**
             * Giving up the mastership
             */
            function giveUpMastership() {
                window.removeEventListener("storage", masterJob);

                var newMaster = lastKnownTabId ? lastKnownTabId : "rand";

                // Create persistent info
                localStorage.setItem("favoritesMasterTab", newMaster);
            }

            /**
             * Playing master role.
             * @param {Event} event
             */
            function masterJob(event) {
                if (CPK.verbose === true) {
                    console.log("FavoritesBroadcaster -> becomeMaster -> masterJob",
                        event.key, event.key === "giveMeFavorites", event);
                }
                if (event.key === "giveMeFavorites" && event.newValue) {
                    // Some tab asked for the sessionStorage -> send it
                    lastKnownTabId = event.newValue;
                    broadcast(event.newValue, sessionStorage.getItem(storage.name));
                }
            }
        }

        /**
         * If VuFind detected user have just logged in, it'll create
         * 'sendMeFavorites' function returning true.
         *
         * The point is to send sessionStorage's contents into the PHP app so
         * that it stores the data in more persistent way.
         *
         * The broadcaster also broadcasts an event to clear favorites stored
         * within all tabs inside sessionStorage to prevent them being present
         * after logout.
         */
        function sendFavoritesIfNecessary() {
            if (typeof sendMeFavorites !== "function" || sendMeFavorites() !== true) {
                return;
            }

            CPK.favorites.storage.getAll().then(function(favorites) {
                if (favorites.length === 0) {
                    return;
                }

                var data = {
                    favs : favorites.map(function(fav) { return fav.toObject(); })
                };

                if (CPK.verbose) {
                    console.debug("Pushing favorites on prompt ...", data);
                }

                /**
                 * @todo Don't reload whole page but just the menu...
                 */
                $.post("/AJAX/JSON?method=pushFavorites", data).always(function() {
                    // Broadcast all tabs removal
                    purgeAllTabs();

                    // Reload the page to see newly created favorites list
                    location.reload();
                });
            });
        }

        /**
         * Sends an broadcast to purge all favorites
         */
        function purgeAllTabs() {
            broadcast("purgeAllTabs");
            CPK.favorites.storage.removeAll();
        }
    }

    /**
     * @type {Object}
     */
    CPK.favorites.broadcaster = FavoritesBroadcaster();

}(jQuery));