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
	 * Notifications service for favorites.
	 * @returns {Object}
	 * @constructor
	 * @todo What is "__notif"?! (taken from angular version)
	 */
	function FavoritesNotifications() {
		var addedSomethingAlready   = false,
			removedSomethingAlready = false,
			notificationsEnabled    = true;// typeof __notif !== "undefined";
		                                   // CPK.global.areNotificationsAvailable

		/**
		 * Notification about favorite was added.
		 */
		function favAdded() {
			if ( notificationsEnabled === true ) {
				if ( addedSomethingAlready === false ) {
					addedSomethingAlready = true;
					createNotificationWarning();
				}
			}
		}

		/**
		 * Notification about favorite was removed.
		 */
		function favRemoved() {
			if ( notificationsEnabled === true ) {
				if ( removedSomethingAlready === false ) {
					removedSomethingAlready = true;
					createNotificationWarning();
				}
			}
		}

		/**
		 * Notification about all favorites were removed.
		 */
		function allFavsRemoved() {
			if (notificationsEnabled === true) {
				// Remove the notification
				__notif.helper.pointers.global.children(".notif-favs").remove();

				// Remove the warning icon if there is no more notifications
				if (__notif.sourcesRead.unreadCount === 0) {
					addedSomethingAlready = false;

					// Hide warning icon...
					__notif.warning.hide();
					__notif.helper.pointers.global.children().first().show();
				}
			}
		}

		/**
		 * @private Creates notification warning.
		 */
		function createNotificationWarning() {
			var msg = VuFind.translate( "you_have_unsaved_favorites" );
			__notif.addNotification( translatedMessage, "favs" );
		}

		// Public API
		var Notifications                 = Object.create( null );
		Notifications.favoriteAdded       = favAdded;
		Notifications.favoriteRemoved     = favRemoved;
		Notifications.allFavoritesRemoved = allFavsRemoved;
		return Notifications;
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
				if ( CPK.storage.isStorage( CPK.localStorage ) ) {
					reject( "Storage is not available" );
				}

				var favs = CPK.localStorage.getItem( "_favs" );

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
			console.log( item );
			if ( ! ( item instanceof Favorite ) ) {
				return Promise.reject( "Invalid favorite provided (not an instance of Favorite class)!" );
			}

			return Promise
				.resolve( loadFavorites() )
				.then(( favs ) => {
					return Promise.resolve( saveFavorites( favs.push( item ) ) );
				});
		}

		/**
		 * Removes favorite with given identifier.
		 * @param {Number} id
		 * @returns {Promise}
		 */
		function remove( id ) {
			if ( typeof id === "undefined" ) {
				return Promise.reject( "No ID provided!" );
			}

			return Promise
				.resolve( loadFavorites() )
				.then(( favs ) => {
					var regexp = new RegExp( "\/" + id.replace( /\./,"\\." ) );
					var found = favs.findIndex(( fav ) => {
						return !!fav.title.link.match( regexp );
					});

					console.log( found );

					return Promise.resolve( favs.splice( found, 1 ) );
				})
				.then(( favs ) => {
					return Promise
						.resolve( saveFavorites( favs ) )
						.then(() => {
							CPK.favorites.notifications.favoriteRemoved();
						});
				});
		}

		/**
		 * Removes all favorites.
		 * @returns {Promise}
		 */
		function removeAll() {
			return Promise
				.resolve( saveFavorites( [] ) )
				.then(( favs ) => {
					CPK.favorites.notifications.allFavoritesRemoved();

					return Promise.resolve();
				});
		}

		/**
		 * Checks if favorite with given identifier exist.
		 * @param {Number} id
		 * @returns {Promise}
		 */
		function has( id ) {
			return Promise
				.resolve( loadFavorites() )
				.then(( favs ) => {
					var regexp = new RegExp( "\/" + id.replace( /\./,"\\." ) );
					var found = favs.find(( fav ) => {
						return !!fav.title.link.match( regexp );
					});

					if ( typeof found === "undefined" ) {
						return Promise.reject( false );
					} else {
						var fav = new CPK.favorites.Favorite().fromObject( found );

						return Promise.resolve( fav );
					}
				});
		}

		/**
		 * Get favorite by its identifier.
		 * @param {Number} id
		 * @returns {Promise}
		 */
		function get( id ) {
			return Promise
				.resolve( loadFavorites() )
				.then(( favs ) => {
					if ( id in favs ) {
						var fav = new CPK.favorites.Favorite().fromObject( favs.id );

						return Promise.resolve( fav );
					} else {
						return Promise.reject( false );
					}
				});
		}

		/**
		 * Get all saved favorites.
		 * @returns {Promise}
		 */
		function getAll() {
			return Promise
				.resolve( loadFavorites() )
				.then(( favs ) => {
					return Promise.resolve( favs.map(( fav ) => {
						return new CPK.favorites.Favorite().fromObject( fav );
					}) );
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
				} else {
					CPK.storage.setItem( "_favs", JSON.stringify( favs ) );
					resolve( true );
				}
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
	 * @property {string} title
	 * @property {string} titleLink
	 * @property {string} author
	 * @property {string} authorLink
	 * @property {string} published
	 * @property {string} format
	 * @property {string} formatIconClass
	 * @property {string} image
	 * @property {string} icon
	 * @property {string} iconStyle
	 * @property {string} created
	 * @returns {Favorite}
	 * @constructor
	 */
	function Favorite() {
		var $searchItems = undefined;

		/**
		 * Updates "stored" search items.
		 * @private
		 */
		var updateSearchItems = function() {
			$searchItems = jQuery( "div#result-list-placeholder" ).children();
		};

		/**
		 * @private
		 * @type {Object} $vars Represents single favorite item
		 */
		var $vars = {
			title: undefined,
			titleLink: undefined,
			author: undefined,
			authorLink: undefined,
			published: undefined,
			format: undefined,
			formatIconClass: undefined,
			image: undefined,
			icon: undefined,
			iconStyle: undefined,
			created: ( new Date() ).getTime()
		};

		// Create getter/setters according to $vars
		Object.getOwnPropertyNames( $vars ).forEach(( prop ) => {
			if ( prop === "created" ) {
				Object.defineProperty(this, prop, {
					get: function() { return $vars.prop; }
				});
			} else {
				Object.defineProperty(this, prop, {
					get: function() { return $vars.prop; },
					set: function( v ) { $vars.prop = v; }
				});
			}
		});

		/**
		 * Creates Favorite from given object.
		 * @param {Object} obj
		 */
		this.fromObject = function( obj ) {
			if ( typeof obj !== "object" && CPK.verbose === true ) {
				console.error( "Trying to create Favorite from object, but no object was passed!" );
			} else if ( ! obj.hasOwnProperty( "created" ) && CPK.verbose === true ) {
				console.error( "Missing timestamp property in the passed object!" );
			} else {
				$vars = obj;
			}
		};

		/**
		 * Creates Favorite from record's detail.
		 */
		this.fromRecordDetail = function() {
			parseRecordDetail().then(
				/**
				 * @param {Favorite} fav
				 */
				function( fav ) { $vars = fav.toObject(); },
				/**
				 * @param {string} msg
				 */
				function( msg ) {
					if ( CPK.verbose === true) {
						console.error( msg );
					}
				}
			);
		};

		/**
		 * Creates record from search record.
		 * @param {Number} rank
		 */
		this.fromRecordSearch = function( rank ) {
			parseRecordSearch( rank ).then(
				/**
				 * @param {Favorite} fav
				 */
				function( fav ) { $vars = fav.toObject(); },
				/**
				 * @param {string} msg
				 */
				function( msg ) {
					if ( CPK.verbose === true ) {
						console.error( msg );
					}
				}
			);
		};

		/**
		 * @returns {Object}
		 */
		this.toObject = function() {
			return $vars;
		};

		/**
		 * @returns {string}
		 */
		this.toString = function() {
			return JSON.stringify( $vars );
		};

		/**
		 * @private Parses Favorite from record's detail page.
		 * @returns {Promise}
		 */
		function parseRecordDetail() {
			return new Promise(function( resolve, reject ) {
				var tablePointer = jQuery( "table[summary]" );

				if ( tablePointer.length === 0 ) {
					reject( "We are probably not on record detail page." );
				}

				var authorPointer = tablePointer.find( "tbody tr td[property=author] a" );

				if ( authorPointer.length === 0 ) {
					// Could also be a creator property
					authorPointer = tablePointer.find( "tbody tr td[property=creator] a" );

					if ( authorPointer.length === 0 ) {
						// Could also be an contributor
						authorPointer = tablePointer.find( "tbody tr td span[property=contributor] a" );
					}
				}

				var formatPointer = tablePointer.find( "tbody tr td div.iconlabel" );

				var fav = new Favorite();
				fav.titleLink = location.pathname;
				fav.title = (function() {
					var expectedSiblingHeader = tablePointer.siblings( "h2" );
					return ( expectedSiblingHeader.length > 0 )
						? expectedSiblingHeader.find( "strong" ).text()
						: CPK.verbose === true ? console.warn( "Parsing record title failed!" ) : null;
				})();
				fav.authorLink = (function() {
					var link = authorPointer.prop("href");
					return (typeof link === "string")
						? link
						: CPK.verbose === true ? console.warn( "Parsing author's link failed!" ) : null;
				})();
				fav.author = (function() {
					var author = authorPointer.text();
					return ( typeof author === "string" )
						? author
						: CPK.verbose === true ? console.warn( "Parsing author's name failed!" ) : null;
				})();
				fav.formatIconClass = (function() {
					var expectedIcon = formatPointer.children( "i" );
					return ( expectedIcon.length )
						? expectedIcon.attr( "class" )
						: CPK.verbose === true ? console.warn( "Parsing format icon class failed!" ) : null;
				})();
				fav.format = (function() {
					var expectedSpan = formatPointer.children( "span" );
					return ( expectedSpan.length )
						? expectedSpan.attr( "data-orig" )
						: CPK.verbose === true ? console.warn( "Parsing record format failed!" ) : null;
				})();
				fav.published = (function() {
					var expectedSpan = tablePointer.find( "tbody tr td span[property=publicationDate]" );
					return ( expectedSpan.length )
						? expectedSpan.text()
						: CPK.verbose === true ? console.warn( "Parsing publication year failed!" ) : null;
				})();
				fav.image = (function() {
					var expectedParentSiblingSmallDivision = tablePointer.parent().siblings( "div.col-sm-3" );
					if (expectedParentSiblingSmallDivision.length <= 0) {
						return CPK.verbose === true ? console.warn( "Parsing record image's parent div failed!" ) : null;
					}

					var expectedImg = expectedParentSiblingSmallDivision.find( "img" );
					if ( expectedImg.length ) {
						// We found image
						return expectedImg.attr( "src" );
					}

					// Parsing image has failed .. so try to parse an icon
					var expectedIcon = expectedParentSiblingSmallDivision.find( "i[class][style]" );
					if ( expectedIcon.length <= 0 ) {
						return CPK.verbose === true ? console.warn( "Parsing record image source or icon failed!" ) : null;
					}

					// Set at least the icon to the object
					fav.icon = expectedIcon.attr("class");
					fav.iconStyle = expectedIcon.attr("style");
					// And image is undefined ..
					return undefined;
				})();

				resolve( fav );
			});
		}

		/**
		 * @private Parses Favorite from search record.
		 * @param {Number} rank
		 * @returns {Promise}
		 */
		function parseRecordSearch( rank ) {
			return new Promise(function( resolve, reject ) {
				if ( typeof rank === "undefined" ) {
					reject( "Can not parse from current search with unknown rank!" );
				}

				rank = parseInt( rank );

				if ( rank < 0 ) {
					reject( "Invalid rank provided for parsing current search!" );
				}

				if ( typeof $searchItems === "undefined" ) {
					window.addEventListener( "searchResultsLoaded", updateSearchItems );
					updateSearchItems();
				}

				var record = $searchItems.get( rank );
				record = record.getElementsByClassName( "row" )[0];

				var fav = new Favorite();
				fav.title = (function() {
					var anchor = record.querySelector( "a.title" );

					if ( anchor ) {
						this.titleLink = anchor.getAttribute( "href" );
						return anchor.textContent.trim();
					}

					if ( CPK.verbose === true ) {
						console.warn( "Parsing search record title and titleLink failed!" );
					}
				})();
				fav.author = (function() {
					var anchor = record.querySelector( "a.author-info" );

					if ( anchor ) {
						this.authorLink = anchor.getAttribute( "href" );
						return anchor.textContent.trim();
					}

					if ( CPK.verbose === true ) {
						console.warn( "Parsing search record author and authorLink failed!" );
					}
				})();
				fav.format = (function() {
					var iconDiv = record.querySelector( "div.format-list div.iconlabel" );

					if ( iconDiv ) {
						fav.formatIconClass( iconDiv.getElementsByTagName( "i" )[0].getAttribute( "class" ));
						return iconDiv.getElementsByTagName( "span" )[0].getAttribute( "data-orig" );
					}

					if ( CPK.verbose === true ) {
						console.warn( "Parsing format icon class failed!" );
						console.warn( "Parsing record format failed!" );
					}
				})();
				fav.published = (function() {
					var span = record.querySelector( "span.summDate" );

					if ( span ) {
						return span.textContent.trim();
					}

					if ( CPK.verbose === true ) {
						console.warn( "Parsing date of publishing failed!" );
					}
				})();
				fav.image = (function() {
					var errorMsg = "Parsing image or icon failed!";
					try {
						var thumb = record.getElementsByClassName( "coverThumbnail" )[0];
						var image = thumb.getElementsByTagName( "img" )[0];

						if ( typeof image !== "undefined" ) {
							return image.getAttribute( "src" );
						}

						var icon = thumb.getElementsByTagName( "i" )[0];

						if ( typeof icon !== "undefined" ) {
							fav.icon( icon.getAttribute( "class" ) );
							fav.iconStyle( icon.getAttribute( "style" ) );
							// Icon is set but image self is undefined
							return undefined;
						}

						if ( CPK.verbose === true ) {
							console.log( errorMsg );
						}
					} catch ( error ) {
						console.error( errorMsg, error );
					}
				})();

				resolve( fav );
			});
		};
	}

	/**
	 * Broadcaster for the favorites.
	 * @returns {Object}
	 * @constructor
	 */
	function FavoritesBroadcaster() {
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
		 *
		 * @param {Event} event
		 * @returns {Promise}
		 */
		function init( event ) {
			return new Promise(function( resolve, reject ) {
				if ( isNewTab() ) {
					handleNewTab();
				} else {
					handleOldTab();
				}

				window.addEventListener( "storage", handleStorageEvent, true );
				sendFavoritesIfNecessary();

				reject( "Not implemented yet!" );
			});
		}


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
		 * @param {Number} favoriteId
		 */
		function broadcastRemoved(favoriteId) {
			broadcast("favoriteRemoved", favoriteId);
		}

		// Private

		/**
		 * Just broadcast a message using localStorage's event
		 * @param {String} key
		 * @param {Number} val
		 */
		function broadcast(key, val) {
			localStorage.setItem(key, val);
			localStorage.removeItem(key);

			if (CPK.verbose) {
				console.debug("Emitted broadcast with key & value", key, val);
			}
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
		 * (if it was told it to do so or it decided itself by reaching the
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
			broadcast("purgeAllTabs", 0);
			CPK.favorites.storage.removeAll();
		}

		// Public API
		var Broadcaster              = Object.create( null );
		Broadcaster.broadcastAdded   = broadcastAdded;
		Broadcaster.broadcastRemoved = broadcastRemoved;
		Broadcaster.initialize       = init;
		return Broadcaster;
	}

	/**
	 * @type {FavoritesNotifications}
	 */
	CPK.favorites.notifications = new FavoritesNotifications();

	/**
	 * @type {FavoritesStorage}
	 */
	CPK.favorites.storage = new FavoritesStorage();

	/**
	 * @type {Favorite}
	 */
	CPK.favorites.Favorite = Favorite;

	/**
	 * @type {Object}
	 */
	CPK.favorites.broadcaster = new FavoritesBroadcaster();

}());
