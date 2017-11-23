/**
 * Favorites - storage.
 *
 * Storage contains also fake storage which is used for clients that don't
 * support normal (as modern browsers) local storage. This fake storage
 * isn't really useful but it allow to use same code for all clients without
 * any unnecessary conditions.
 *
 * @author Jiří Kozlovský, original Angular solution
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 */

(function($) {
    if (CPK.verbose === true) {
        console.log("jquery-cpk/favorites.storage.js");
    }

    var $usedStorageType = "localStorage";

    /**
     * @private Returns TRUE if storage is supported.
     * @param {String} storageType
     * @returns {boolean}
     */
    function isSupported(storageType) {
        try {
            var storage = window[storageType],
                x = "__storage_test__";
            storage.setItem(x, x);
            storage.removeItem(x);
            return true;
        } catch(e) {
            return false;
        }
    }

    if (!isSupported($usedStorageType)) {
        console.log("Storage '" + $usedStorageType + "' is not available. We will use fake storage...");

        /**
         * @private Initializes fake storage.
         * @param {String} storageType
         * @link https://developer.mozilla.org/en-US/docs/Web/API/Storage/LocalStorage - there is described face localStorage using cookies (with all their limits)
         */
        function initStorage(storageType) {
            var store = {
                /**
                 * Sets item.
                 * @param {String} id
                 * @param {String} val
                 * @returns {String}
                 */
                setItem : function (id, val) {
                    return store[id] = String(val);
                },
                /**
                 * Gets item's value.
                 * @param {String} id
                 * @returns {String}
                 */
                getItem: function (id) {
                    return store.hasOwnProperty(id) ? String(store[id]) : undefined;
                },
                /**
                 * Removes item with given id.
                 * @param {String} id
                 * @returns {boolean}
                 */
                removeItem: function (id) {
                    return delete store[id];
                },
                /**
                 * Clears the storage.
                 */
                clear: function () {
                    initStorage(storageType);
                }
            };
            window[storageType] = store;
        }

        initStorage($usedStorageType);
    }

    /**
     * Prototype for favorites storage.
     * @param {String} storageType
     * @returns {FavoritesStorage}
     * @constructor
     */
    var FavoritesStorage = function(storageType) {
        console.log("Initializing FavoritesStorage with " + storageType + ".");

        var $storage = window[storageType],
            $favorites = [],
            $initializer = {
                done: false,
                buffer: []
            };

        // Ensure that storage has name set
        if (!($storage.hasOwnProperty("name") && $storage.name !== "undefined")) {
            console.log("Storage has no name - setting one...");
            Object.defineProperty($storage, "name", { get: function() { return "_favs"; } });
        }

        /**
         * Adds new favorite into the storage.
         * @param {Favorite} item
         * @returns {Promise}
         */
        this.add = function(item) {
            return new Promise(function(resolve, reject) {
                if (!(item instanceof Favorite)) {
                    reject("Invalid favorite provided (not an instance of Favorite class)!");
                }

                var job = function() {
                    save(item).then(resolve).catch(reject);
                };

                call(job);
                favorites.notifications.favAdded();
            });
        };

        /**
         * Removes favorite with given identifier.
         * @param {string} id
         * @returns {Promise}
         */
        this.remove = function(id) {
            return new Promise(function(resolve, reject) {
                if (typeof id !== "number") {
                    reject("Invalid Favorite ID provided!");
                    return;
                }

                var job = function() {
                    var count = $favorites.length,
                        tmp = [],
                        removed = false;

                    for (var i=0; i < count; ++i) {
                        if ($favorites[i].created === id) {
                            removed = true;
                        } else {
                            tmp.push($favorites[i]);
                        }
                    }

                    if (removed === false) {
                        reject("Invalid Favorite ID provided (no items were found)!");
                        return;
                    }

                    $favorites = tmp;

                    saveFavorites().then(resolve).catch(reject);

                    if ($favorites.length === 0) {
                        CPK.favorites.notifications.allFavsRemoved();
                    }
                };

                call(job);
            });
        };

        /**
         * Removes all favorites.
         * @returns {Promise}
         */
        this.removeAll = function() {
            return new Promise(function(resolve, reject) {
                $favorites = [];
                CPK.favorites.notifications.allFavsRemoved();
                saveFavorites().then(resolve).catch(reject);
            });
        };

        /**
         * Checks if favorite with given identifier exist.
         * @param {string} id
         * @returns {Promise}
         */
        this.has = function(id) {
            return new Promise(function(resolve, reject) {
                var job = function () {
                    var regexp = new RegExp("\/" + id.replace(/\./,"\\."));

                    if (!$favorites) {
                        reject();
                        return;
                    }

                    var found = favorites.find(function(fav) {
                        return !!fav.title.link.match(regexp);
                    });

                    if (typeof found === "undefined") {
                        reject();
                    } else {
                        resolve(new Favorite().fromObject(found));
                    }
                };

                call(job);
            });
        };

        /**
         * Get favorite by its identifier.
         * @param {string} id
         * @returns {Promise}
         */
        this.get = function(id) {
            return new Promise(function(resolve, reject) {
                if (typeof id !== "number" || id <= 0) {
                    reject("Can not get Favorite without an identifier.");
                }

                var job = function () {
                    /**
                     * @todo Tohle `favorite` se asi vytváří při parsování výsledků vyhledávání...
                     */
                    var favObj = favorite[id];

                    favorites.notifications.favAdded();

                    resolve(new favorites.Favorite().fromObject(favObj));
                };

                call(job);
            });
        };

        /**
         * Get all saved favorites.
         * @returns {Promise}
         */
        this.getAll = function() {
            return new Promise(function(resolve, reject) {
                var job = function() {
                    resolve($favorites.map(function(fav) {
                        favorites.notifications.favAdded();

                        return new Favorite().fromObject(fav);
                    }));
                };

                call(job);
            });
        };

        /**
         * @private Save Favorite into the storage.
         * @param {Favorite} item
         * @returns {Promise}
         */
        function save(item) {
            return new Promise(function(resolve, reject) {
                $favorites.push(item.toObject());
                saveFavorites().then(resolve).catch(reject);
            });
        }

        /**
         * @private Save all favorites.
         * @returns {Promise}
         */
        function saveFavorites() {
            return new Promise(function(resolve, reject) {
                var job = function() {
                    var retVal = undefined;

                    if ($favorites.length) {
                        retVal = $storage.setItem($storage.name, JSON.stringify($favorites));
                    } else {
                        $storage.removeItem($storage.name);
                    }

                    resolve(retVal);
                };

                // create async call
                setTimeout(job, 0)
            });
        }

        /**
         * @private Helper function for calling jobs.
         * @param {Function} func
         */
        function call(func) {
            if (typeof func === "function") {
                if ($initializer.done) {
                    /**
                     * @todo Tady předtím bylo jen "func.call()" ... je toto správně?
                     */
                    func.call(this);
                }
            } else {
                $initializer.buffer.push(func);
            }
        }

        return this;
    };

    /**
     * @type {FavoritesStorage}
     */
    CPK.favorites.storage = new FavoritesStorage($usedStorageType);

}(jQuery));