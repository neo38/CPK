/**
 * Favorites service.
 *
 * For some unknown reasons favorites used (in old Angular app) `sessionStorage`
 * as a "safer" storage than `localStorage` - we switch to `CPK.localStorage`
 * because between `sessionStorage` and `localStorage` are no security
 * differencies.
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

				var favs = CPK.localStorage.getItem( "__favs" );

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
		 * @todo We need to call `CPK.favorites.notifications.favoriteAdded()`!
		 */
		function add( item ) {
			console.log( item ); // TODO Remove this line!

			if ( ! ( item instanceof Favorite ) ) {
				return Promise.reject( "Invalid favorite provided (not an instance of Favorite class)!" );
			}

			return Promise
				.resolve( loadFavorites() )
				.then(function( favorites ) {
					return Promise.resolve( saveFavorites( favorites.push( item ) ) );
				});
		}

		/**
		 * Removes favorite with given identifier.
		 * @param {number} id
		 * @returns {Promise}
		 */
		function remove( id ) {
			if ( typeof id === "undefined" ) {
				return Promise.reject( "No ID provided!" );
			}

			return Promise
				.resolve( loadFavorites() )
				.then(function( favorites ) {
					var regexp = new RegExp( "\/" + id.replace( /\./,"\\." ) );
					var found = favorites.findIndex(function( fav ) {
						return !!fav.title.link.match( regexp );
					});

					console.log( found );

					return Promise.resolve( favs.splice( found, 1 ) );
				})
				.then(function( favorites ) {
					return Promise
						.resolve( saveFavorites( favorites ) )
						.then(function() {
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
				.then(function( favs ) {
					CPK.favorites.notifications.allFavoritesRemoved();

					return Promise.resolve();
				});
		}

		/**
		 * Checks if favorite with given identifier exist.
		 * @param {number} id
		 * @returns {Promise}
		 */
		function has( id ) {
			return Promise
				.resolve( loadFavorites() )
				.then(function( favorites ) {
					var regexp = new RegExp( "\/" + id.replace( /\./,"\\." ) );
					var found = favorites.find(function( fav ) {
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
		 * @param {number} id
		 * @returns {Promise}
		 */
		function get( id ) {
			return Promise
				.resolve( loadFavorites() )
				.then(function( favorites ) {
					if ( id in favorites ) {
						var fav = new CPK.favorites.Favorite().fromObject( favorites.id );

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
				.then(function( favorites ) {
					return Promise.resolve( favorites.map(function( fav ) {
						return new CPK.favorites.Favorite().fromObject( fav );
					}) );
				});
		}

		/**
		 * @private Save favorites into the storage (aka `CPK.localStorage`).
		 * @param {Array} favorites
		 * @returns {Promise}
		 */
		function saveFavorites( favorites ) {
			return new Promise(function( resolve, reject ) {
				if ( CPK.storage.isStorage( CPK.localStorage ) !== true ) {
					reject( "Storage is not available!" );
				} else {
					CPK.storage.setItem( "__favs", JSON.stringify( favorites ) );
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
		Object.getOwnPropertyNames( $vars ).forEach(function( prop ) {
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
		 * @param {number} rank
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
		 * @param {number} rank
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
	 *
	 * Originally it was using `sessionStore` as a storage behind but
	 * I changed to the default `CPK.localStorage` but maybe in future
	 * will be better init storage by own here (and of course use
	 * `sessionStorage` as a default "engine").
	 *
	 * @returns {Object}
	 * @constructor
	 */
	function FavoritesBroadcaster() {
		/**
		 * @const {string}
		 */
		const STORAGE_KEY = "__favsStorage";

		/**
		 * ID of current tab to identify requests & responses
		 * @type {number} tabId
		 */
		var tabId = undefined;

		/**
		 * ID of last tab which placed a request
		 * @type {number} tabId
		 */
		var lastTabId = undefined;
		
		/**
		 * Holds timeout for checking mastership.
		 * @type {number} mastershipRetrieval
		 */
		var mastershipRetrieval = undefined;

		/**
		 * Create localStorage event listener to have ability of fetching data
		 * from another tab.
		 *
		 * @param {Event} event
		 * @returns {Promise}
		 */
		function init( event ) {
			return Promise
				.resolve( isNewTab() ? handleNewTab() : handleOldTab() )
				.then( resolveHandleTab )
				.then( resolveStorageHandler )
				.then( ( result ) => Promise.resolve( result ) );
		}

		/**
		 * Returns boolean whether is this tab a new tab or not.
		 */
		function isNewTab() {
			return CPK.localStorage.hasItem( "tabId" );
		}

		/**
		 * Handles the logic right after we found out this is a brand new tab
		 * without any useful data in storage.
		 *
		 * It basically prompts another tabs for existing favorites & stores
		 * them inside sessionStorage.
		 *
		 * @returns {Promise}
		 */
		function handleNewTab() {
			if ( CPK.verbose === true ) {
				console.log( "FavoritesBroadcaster->handleOldTab" );
			}

			return new Promise(function( resolve ) {
				// Generate tabId ..
				tabId = Date.now();
				sessionStorage.tabId = tabId;

				// Try to get favorites for this tab

				// Attach event listener
				window.addEventListener( "storage", onGotFavorites );

				// Wait 1500 ms for response, then suppose this is the first tab.
				mastershipRetrieval = window.setTimeout( function() {
					window.removeEventListener( "storage", onGotFavorites );
					CPK.localStorage.setItem( STORAGE_KEY, "[]" );
					becomeMaster( true );
				}, 1500 );

				// Ask other tabs for favorites ..
				broadcast( "giveMeFavorites", tabId );

				resolve( true );
			});
		}

		/**
		 * Handles the logic right after we found out this is an old tab.
		 *
		 * It basically prompts reassigns important persistent variables.
		 *
		 * @returns {Promise}
		 */
		function handleOldTab() {
			if ( CPK.verbose === true ) {
				console.log( "FavoritesBroadcaster->handleOldTab" );
			}

			return new Promise(function( resolve, reject ) {
				// Assign the tabId the first tabId generated by this tab
				tabId = sessionStorage.tabId;

				var masterTabId = CPK.localStorage.getItem( "favoritesMasterTab" );

				if ( masterTabId === tabId || masterTabId === "rand" ) {
					becomeMaster( true );
				} else if ( CPK.verbose === true ) {
					console.log( "Being a slaveTab is nice!" );
				}

				resolve( true );
			});
		}

		/**
		 *
		 * @param {Boolean} result
		 */
		function resolveHandleTab( result ) {
			if ( CPK.verbose === true ) {
				console.log( "FavoritesBroadcaster->resolveHandleTab" );
			}

			return Promise.resolve( initStorageHandler() );
		}

		/**
		 * Initializes handler for "storage" event.
		 * @returns {Promise}
		 */
		function initStorageHandler() {
			if ( CPK.verbose === true ) {
				console.log( "FavoritesBroadcaster->initStorageHandler" );
			}

			return new Promise(function( resolve ) {
				window.addEventListener( "storage", handleStorageEvent, true );
				resolve( true );
			});
		}

		/**
		 * @param {Boolean} result
		 */
		function resolveStorageHandler( result ) {
			if ( CPK.verbose === true ) {
				console.log( "FavoritesBroadcaster->resolveStorageHandler" );
			}

			return Promise.resolve( sendFavoritesIfNecessary() );
		}

		/**
		 * Broadcasts event called "favoriteAdded" across all tabs listening
		 * on storage event so they can update themselves.
		 * @param {Favorite} favorite
		 */
		function broadcastAdded( favorite ) {
			broadcast( "favoriteAdded", JSON.stringify( favorite.toObject() ) );
		}

		/**
		 * Broadcasts event called 'favRemoved' across all tabs listening on
		 * storage event so they can update themselves.
		 * @param {number} favoriteId
		 */
		function broadcastRemoved( favoriteId ) {
			broadcast( "favoriteRemoved", favoriteId );
		}

		// Private

		/**
		 * @private Handler for "storage" event.
		 * @param {Event} event
		 */
		function onGotFavorites( event ) {
			if ( parseInt( event.key ) === tabId ) {
				return;
			}

			if ( event.newValue === "null" ) {
				CPK.localStorage.setItem( STORAGE_KEY, "[]" );
				return;
			}

			// We got response, so there is already a master tab
			window.clearTimeout( mastershipRetrieval );

			// Set the sessionStorage
			CPK.localStorage.setItem( STORAGE_KEY, event.newValue );

			// Let the controller know ..
			if ( typeof window.__favChanged === "function" ) {
				var _favorites = JSON.parse( event.newValue );

				_favorites.forEach(function( favorite ) {
					var fav = CPK.favorites.Favorite().fromObject( favorite );
					window.__favChanged( true, favorite );
				});

				if ( _favorites.length > 0 ) {
					CPK.favorites.notifications.favoriteAdded();
				}
			}

			// Remove this listener
			window.removeEventListener( "storage", onGotFavorites );
		}

		/**
		 * @private Just broadcast a message using localStorage's event
		 * @param {string} key
		 * @param {number} val
		 * @todo Find another way how to do this.
		 */
		function broadcast( key, val ) {
			CPK.localStorage.setItem( key, val );
			CPK.localStorage.removeItem( key );

			if ( CPK.verbose === true ) {
				console.log( "Emitted broadcast with key & value", key, val );
			}
		}

		/**
		 * @private Handler for "storage" event.
		 * @param {Event} event
		 */
		function handleStorageEvent( event ) {
			if ( CPK.verbose === true ) {
				console.log( "Received an broadcast: ", event );
			}

			if ( event.key === "favoritesMasterTab" ) {
				// Should this tab be masterTab ?
				if ( parseInt(event.newValue) === tabId || event.newValue === "rand" ) {
					becomeMaster();
				}
			} else if ( event.key === "favAdded" && event.newValue ) {
				handleFavoriteAdded( event );
			} else if ( event.key === "favRemoved" && event.newValue ) {
				handleFavoriteRemoved( event );
			} else if ( event.key === "purgeAllTabs" && event.newValue ) {
				CPK.favorites.storage.removeAllFavorites();
			}
		}

		/**
		 * @private Handler for "favoriteAdded" event.
		 * @param {Event} event
		 */
		function handleFavoriteAdded( event ) {
			var favObj = JSON.parse( event.newValue );
			var newFav = new Favorite().fromObject( favObj );

			CPK.favorites.storage.add( newFav ).then(function() {
				// Tell the controllers ..
				if ( typeof window.__favChanged === "function" ) {
					if ( CPK.verbose === true ) {
						console.log( "Calling `window.__favChanged` with ", newFav );
					}

					window.__favChanged( true, newFav );
				}
			});
		}

		/**
		 * @private Handler for "favoriteRemoved" event.
		 * @param {Event} event
		 */
		function handleFavoriteRemoved( event ) {
			var favObj = JSON.parse( event.newValue );
			var oldFav = new Favorite().fromObject( favObj );

			CPK.favorites.storage.remove( oldFav.created ).then(function() {
				// Tell the controllers ..
				if ( typeof window.__favChanged === "function" ) {
					if ( CPK.verbose === true ) {
						console.log( "Calling `window.__favChanged` with ", oldFav );
					}

					window.__favChanged( false, oldFav );
				}
			});
		}

		/**
		 * @private Becomes master tab.
		 * @param {Boolean} active
		 *
		 * Determines if this tab is becoming to be master tab by its own
		 * or it was decided because of reaching the timeout when no master
		 * return response on initial request.
		 */
		function becomeMaster( active ) {
			if ( CPK.verbose === true ) {
				( typeof active === "undefined" )
					? console.log( "Passively becoming masterTab!" )
					: console.log( "Actively becoming masterTab!" );
			}

			// Overwrite it to inform other tabs about becoming masterTab..
			CPK.localStorage.setItem( "favoritesMasterTab", tabId );

			// Give up mastership when tab is closed.
			window.addEventListener( "beforeunload", giveUpMastership, true );

			// Create event listener to play master role
			window.addEventListener( "storage", masterJob );

			/**
			 * @private Gives up master role - removes event listener and sets new master.
			 */
			function giveUpMastership() {
				window.removeEventListener( "storage", masterJob );
				localStorage.setItem( "favoritesMasterTab", lastTabId ? lastTabId : "rand" );
			}

			/**
			 * @private Playing master role.
			 * @param {Event} event
			 */
			function masterJob( event ) {
				if ( CPK.verbose === true ) {
					console.log( "FavoritesBroadcaster->becomeMaster->masterJob", event );
				}

				if ( event.key === "giveMeFavorites" && event.newValue ) {
					lastTabId = event.newValue;

					// Some tab asked for the storage so send it
					broadcast( event.newValue, CPK.localStorage.getItem( storage.name ) );
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
			if ( typeof sendMeFavorites !== "function" || sendMeFavorites() !== true ) {
				return;
			}

			CPK.favorites.storage.getAll()
				.then(function( favorites ) {
					if ( favorites.length === 0 ) {
						return Promise.reject( "There are no favorites." );
					}

					var data = {
						favs: favorites.map( function ( fav ) {
							return fav.toObject();
						} )
					};

					if ( CPK.verbose === true ) {
						console.log( "Pushing favorites on prompt ...", data );
					}

					return Promise.resolve( data );
				})
				.then(function( favorites ) {
					/**
					 * @todo Don't reload whole page but just the menu...
					 */
					$.post( "/AJAX/JSON?method=pushFavorites", data ).always(function() {
						// Broadcast all tabs removal
						broadcast( "purgeAllTabs", 0 );

						// Clear the storage
						CPK.favorites.storage.removeAll();

						// Reload the page to see newly created favorites list
						window.location.reload();
					});
				})
				.catch(function( reason ) {
					if ( CPK.verbose === true ) {
						console.log( reason );
					}
				});
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
