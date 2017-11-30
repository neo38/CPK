/**
 * Favorites service.
 *
 * @author Jiří Kozlovský, original Angular solution
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 */

(function() {
    "use strict";

    if ( CPK.verbose === true ) {
        console.info( "jquery-cpk/favorites.js" );
    }

	/**
	 * Favorites storage.
	 * @returns {Object}
	 * @constructor
	 */
	function FavoritesStorage() {
		/**
		 * @type {Array}
		 */
		var favorites = [];

		/**
		 * @private Loads favorites from the storage.
		 * @returns {Promise}
		 */
		function loadFavorites() {
			return new Promise(function( resolve, reject ) {
				if ( CPK.global.isStorageAvailable !== true ) {
					reject( "Storage is not available" );
				}

				var favs = storage.getItem( "_favs" );

				if ( typeof favs === "string" ) {
					favorites = JSON.parse( favs );
				} else {
					favorites = [];
				}

				resolve( favorites );
			});
		}

		/**
		 * Adds new favorite into the storage.
		 * @param {Favorite} item
		 * @returns {Promise}
		 * @todo We need to call `favorites.notifications.favAdded()`!
		 */
		function add( item ) {
			if ( ! ( item instanceof Favorite ) ) {
				return Promise.reject( "Invalid favorite provided (not an instance of Favorite class)!" );
			}

			return Promise
				.resolve( loadFavorites() )
				.then(( favs ) => Promise.resolve( saveFavorites( favs.push( item ) ) ) );
		}

		/**
		 * Removes favorite with given identifier (`id` should be `Favorite.created`).
		 * @param {string} id
		 * @returns {Promise}
		 * @todo We need to call `CPK.favorites.notifications.allFavsRemoved()`!
		 * @todo We need to call `CPK.favorites.notifications.favRemoved()`!
		 */
		function remove( id ) {
			if ( typeof id === "undefined" ) {
				return Promise.reject( "No ID provided!" );
			}

			return Promise
				.resolve( loadFavorites )
				.then(( favs ) => {
					// XXX Filter `favs` to remove the one with given ID`
					//Promise.resolve( saveFavorites( favs );
				});
		}

		/**
		 * Removes all favorites.
		 * @returns {Promise}
		 */
		function removeAll() {
			return new Promise(function(resolve, reject) {
				$favorites = [];
				CPK.favorites.notifications.allFavsRemoved();
				saveFavorites().then(resolve).catch(reject);
			});
		}

		/**
		 * Checks if favorite with given identifier exist.
		 * @param {string} id
		 * @returns {Promise}
		 */
		function has( id ) {
			return new Promise(function(resolve, reject) {
				var job = function() {
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
		}

		/**
		 * Get favorite by its identifier.
		 * @param {string} id
		 * @returns {Promise}
		 */
		function get( id ) {
			return new Promise(function(resolve, reject) {
				if (typeof id !== "number" || id <= 0) {
					reject("Can not get Favorite without an identifier.");
				}

				var job = function() {
					/**
					 * @todo Tohle `favorite` se asi vytváří při parsování výsledků vyhledávání...
					 */
					var favObj = favorite[id];
					favorites.notifications.favAdded();
					resolve(new favorites.Favorite().fromObject(favObj));
				};

				call(job);
			});
		}

		/**
		 * Get all saved favorites.
		 * @returns {Promise}
		 */
		function getAll() {
			return new Promise(function(resolve, reject) {
				var job = function() {
					resolve($favorites.map(function(fav) {
						favorites.notifications.favAdded();
						return new Favorite().fromObject(fav);
					}));
				};

				call(job);
			});
		}

		/**
		 * @private Save favorites into the storage (aka `CPK.localStorage`).
		 * @param {Array} favs
		 * @returns {Promise}
		 */
		function saveFavorites( favs ) {
			return new Promise(function( resolve, reject ) {
				if ( CPK.storage.isStorage( CPK.localStorage ) !== true ) {
					reject( "Storage is not available!" );
				}

				resolve( CPK.storage.setItem( "_favs", JSON.stringify( favs ) ) );
			});
		}

		// Public API
		var Storage       = Object.create( null );
		Storage.add       = add;
		Storage.get       = get;
		Storage.getAll    = getAll;
		Storage.has       = has;
		Storage.remove    = remove;
		Storage.removeAll = removeAll;
		return Storage;
	}

	/**
	 * @type {FavoritesStorage}
	 */
	CPK.favorites.FavoritesStorage = new FavoritesStorage();

}());
