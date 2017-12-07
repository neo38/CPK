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
	 */
	function FavoritesNotifications() {
		var addedSomethingAlready   = false,
			removedSomethingAlready = false;

		/**
		 * Notification about favorite was added.
		 */
		function favAdded() {
			if ( addedSomethingAlready === false ) {
				addedSomethingAlready = true;

				createNotificationWarning();
			}
		}

		/**
		 * Notification about favorite was removed.
		 */
		function favRemoved() {
			if ( removedSomethingAlready === false ) {
				removedSomethingAlready = true;

				createNotificationWarning();
			}
		}

		/**
		 * Notification about all favorites were removed.
		 */
		function allFavsRemoved() {
			// Remove the notification
			__notif.helper.pointers.global.children( ".notif-favs" ).remove();

			// Remove the warning icon if there is no more notifications
			if (__notif.sourcesRead.unreadCount === 0) {
				addedSomethingAlready = false;

				// TODO Hide warning icon...
				//__notif.warning.hide();
				//__notif.helper.pointers.global.children().first().show();
			}
		}

		/**
		 * @private Creates notification warning.
		 */
		function createNotificationWarning() {
			var msg = VuFind.translate( "you_have_unsaved_favorites" );

			__notif.addNotification( msg, "favs" );
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
	 * @todo There are some possible optimalizations (several "filterIndex"es etc.)...
	 */
	function FavoritesStorage() {
		var favoritesCache = [];

		/**
		 * @private Loads favorites from the storage.
		 * @returns {Promise<boolean>}
		 */
		function loadFavorites() {
			if ( CPK.storage.isStorage( CPK.localStorage ) !== true ) {
				if ( CPK.verbose === true ) {
					console.info( "Unable to initialize favorites because CPK.localStorage is not available." );
				}

				return Promise.resolve( true );
			}

			/**
			 * @returns {Promise<boolean>}
			 */
			function loadFavoritesPromise() {
				var favoritesStr = CPK.localStorage.getItem( "__favs" );

				if ( typeof favoritesStr === "string" ) {
					try {
						favoritesCache = JSON.parse( favoritesStr );
					} catch ( error ) {
						if ( CPK.verbose === true ) {
							console.error( error );
						}

						favoritesCache = [];
					}
				}

				return Promise.resolve( true );
			}

			// Try to load favorites
			return Promise.resolve( loadFavoritesPromise() );
		}

		/**
		 * Adds new favorite into the storage.
		 * @param {Favorite} item
		 * @returns {Promise<boolean>}
		 * @todo Add final "finishJob" which sends notification in case of success.
		 */
		function add( item ) {
			if ( typeof item !== "object" ) {
				return Promise.reject( "Invalid favorite provided (not an anonymous object or an instance of Favorite class)!" );
			}

			if ( item instanceof Favorite ) {
				item = item.toObject();
			}

			/**
			 * @param {boolean} result
			 * @returns {Promise<boolean>}
			 */
			function resolveLoadFavorites( result ) {
				if ( result === false ) {
					return Promise.resolve( result );
				}

				favoritesCache.push( item );

				return Promise.resolve( saveFavorites() );
			}

			/**
			 * @param {boolean} result
			 * @returns {Promise<boolean>}
			 */
			function finishJob( result ) {
				if ( result === true ) {
					CPK.favorites.notifications.favoriteAdded();
				}

				return Promise.resolve( result );
			}

			// Load favorites -> add item -> save favorites -> sent notification and resolve
			return Promise
				.resolve( loadFavorites() )
				.then( resolveLoadFavorites )
				.then( finishJob );
		}

		/**
		 * Removes favorite with given identifier.
		 * @param {string} id
		 * @returns {Promise<boolean>}
		 */
		function remove( id ) {
			if ( typeof id === "undefined" ) {
				if ( CPK.verbose === true ) {
					console.log( "No ID provided!");
				}

				return Promise.resolve( "No ID provided!" );
			}

			/**
			 * @param {Object} favorite
			 * @returns {boolean}
			 */
			function findFavoriteIndex( favorite ) {
				var regexp = new RegExp( "\/" + id.replace( /\./,"\\." ) );

				return !! favorite.title.link.match( regexp );
			}

			/**
			 * @param {boolean} result
			 * @returns {Promise<boolean>}
			 */
			function removeFavorite( result ) {
				if ( result !== true ) {
					return Promise.resolve( false );
				}

				/**
				 * @type {number} Index of found item or -1.
				 */
				var found = favoritesCache.findIndex( findFavoriteIndex );

				// And remove it if was found
				if ( found !== -1 ) {
					favoritesCache.splice( found, 1 );
				}

				return Promise.resolve( true );
			}

			/**
			 * @param {boolean} result
			 * @returns {Promise<boolean>}
			 */
			function resolveRemoveFavorite( result ) {
				if ( result === false ) {
					return Promise.resolve( false );
				}

				return Promise.resolve( saveFavorites() );
			}

			/**
			 * @param {boolean} result
			 * @returns {Promise<boolean>}
			 */
			function finishJob( result ) {
				if ( result === true ) {
					CPK.favorites.notifications.favoriteRemoved();
				}

				return Promise.resolve( result );
			}

			// Load favorites -> find & remove item -> save favorites -> sent notification and resolve
			return Promise
				.resolve( loadFavorites() )
				.then( removeFavorite )
				.then( resolveRemoveFavorite )
				.then( saveFavorites )
				.then( finishJob );
		}

		/**
		 * Removes all favorites.
		 * @returns {Promise<boolean>}
		 */
		function removeAll() {
			favoritesCache = [];

			/**
			 * @param {boolean} result
			 * @returns {Promise<boolean>}
			 */
			function finishJob( result ) {
				if ( result === true ) {
					CPK.favorites.notifications.allFavoritesRemoved();
				}

				return Promise.resolve( result );
			}

			// Empty & save `favoritesCache` -> sent notification and resolve
			return Promise
				.resolve( saveFavorites )
				.then( finishJob );
		}

		/**
		 * Checks if favorite with given identifier exist.
		 * @param {number} id
		 * @returns {Promise<boolean>}
		 */
		function has( id ) {
			if ( typeof id === "undefined" ) {
				if ( CPK.verbose === true ) {
					console.log( "No ID provided!");
				}

				return Promise.resolve( "No ID provided!" );
			}

			/**
			 * @param {Object} favorite
			 * @returns {boolean}
			 */
			function findFavoriteIndex( favorite ) {
				var regexp = new RegExp( "\/" + id.replace( /\./,"\\." ) );

				return !! favorite.title.link.match( regexp );
			}

			/**
			 * @param {boolean} result
			 * @returns {Promise<boolean>}
			 */
			function findFavorite( result ) {
				if ( result !== true ) {
					return Promise.resolve( false );
				}

				return Promise
					.resolve( favoritesCache.find( findFavoriteIndex ) === -1 );
			}

			// Load favorites -> find favorite -> resolve it
			return Promise
				.resolve( loadFavorites() )
				.then( findFavorite );
		}

		/**
		 * Get favorite by its identifier.
		 * @param {number} id
		 * @returns {Promise<Favorite|boolean>}
		 */
		function get( id ) {
			if ( typeof id === "undefined" ) {
				if ( CPK.verbose === true ) {
					console.log( "No ID provided!");
				}

				return Promise.resolve( "No ID provided!" );
			}

			/**
			 * @param {Object} favorite
			 * @returns {boolean}
			 */
			function findFavoriteIndex( favorite ) {
				var regexp = new RegExp( "\/" + id.replace( /\./,"\\." ) );

				return !! favorite.title.link.match( regexp );
			}

			/**
			 * @param {boolean} result
			 * @returns {Promise<boolean>}
			 */
			function findFavorite( result ) {
				if ( result !== true ) {
					return Promise.resolve( false );
				}

				/**
				 * @type {number} Index of found item or -1.
				 */
				var found = favoritesCache.find( findFavoriteIndex );

				if ( found === -1 ) {
					return Promise.resolve( false );
				}

				return Promise.resolve( favoritesCache[ found ] );
			}

			// Load favorites -> Find favorite -> Resolve it
			return Promise
				.resolve( loadFavorites )
				.then( findFavorite );
		}

		/**
		 * Get all saved favorites.
		 * @returns {Promise<Array>}
		 */
		function getAll() {

			/**
			 * @param {boolean} result
			 * @returns {Promise<Array>}
			 */
			function resolveLoadFavorites( result ) {
				if ( result !== true ) {
					return Promise.resolve( [] );
				}

				/**
				 * @param {Object} favorite
				 */
				function mapFavoriteObj( favorite ) {
					favs.push( ( new Favorite() ).fromObject( favorite ) );
				}

				/**
				 * @type {Array} Favorites to return.
				 */
				var favorites = [];

				// Ensure that all favorites are instances of {@see Favorite} object
				favoritesCache.forEach( mapFavoriteObj );

				// Return them
				return Promise.resolve( favorites );
			}

			// Load favorites -> Parse & Return favorites
			return Promise
				.resolve( loadFavorites() )
				.then( resolveLoadFavorites );
		}

		/**
		 * @private Save favorites into the storage (aka `CPK.localStorage`).
		 * @returns {Promise<boolean>}
		 */
		function saveFavorites() {

			/**
			 * @returns {Promise<boolean>}
			 */
			function saveFavoritesPromises() {
				if ( CPK.storage.isStorage( CPK.localStorage ) !== true ) {
					if ( CPK.verbose === true ) {
						console.log( "Storage is not available!" );
					}

					return Promise.resolve( false );
				}

				CPK.localStorage.setItem( "__favs", JSON.stringify( favoritesCache ) );

				return Promise.resolve( true );
			}

			// Try to save favoritesCache
			return Promise.resolve( saveFavoritesPromises() );
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
	 * Prototype object for single favorite.
	 * @returns {Favorite}
	 * @constructor
	 */
	function Favorite() {
		var searchItems,
			props = {
			title      : undefined,
			titleLink  : undefined,
			author     : undefined,
			authorLink : undefined,
			published  : undefined,
			format     : undefined,
			formatIcon : undefined,
			image      : undefined,
			icon       : undefined,
			iconStyle  : undefined,
			created    : ( new Date() ).getTime()
		};

		/**
		 * @private Updates "stored" search items.
		 */
		function updateSearchItems() {
			var elm = document.getElementById( "result-list-placeholder" );

			searchItems = jQuery( elm ).children();
		}

		/**
		 * Creates Favorite from given object.
		 * @param {Object} obj
		 */
		function fromObj( obj ) {
			if ( typeof obj !== "object" && CPK.verbose === true ) {
				console.error( "Trying to create Favorite from object, but no object was passed!" );
			} else if ( ! obj.hasOwnProperty( "created" ) && CPK.verbose === true ) {
				console.error( "Missing timestamp property in the passed object!" );
			} else {
				props = obj;
			}
		}

		/**
		 * Creates Favorite from record's detail.
		 */
		function fromRecord() {

			/**
			 * @param {Favorite|boolean} favorite
			 */
			function resolveParseDetail( favorite ) {
				if ( favorite !== false && ( favorite instanceof Favorite ) ) {
					props = favorite.toObject();
				}
			}

			parseRecordDetail().then( resolveParseDetail );
		}

		/**
		 * Creates record from search record.
		 * @param {number} rank
		 */
		function fromSearch( rank ) {

			/**
			 * @param {Favorite|boolean} favorite
			 */
			function resolveParseSearch( favorite ) {
				if ( favorite !== false && ( favorite instanceof Favorite ) ) {
					props = favorite.toObject();
				}
			}

			parseRecordSearch( rank ).then( resolveParseSearch );
		}

		/**
		 * @private Parses Favorite from record's detail page.
		 * @returns {Promise<Favorite,null>}
		 */
		function parseRecordDetail() {

			/**
			 * @returns {Promise<Favorite|null>}
			 */
			function parseRecordDetailPromise() {
				var tablePointer = jQuery( "table.table-with-summary" );

				if ( tablePointer.length === 0 ) {
					// We are probably not on record detail page...
					return Promise.resolve ( false );
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

				var formatPointer = tablePointer.find( "tbody tr td div.iconlabel" ),
				    fav = new Favorite();

				fav.setTitleLink( location.pathname );

				fav.setTitle((function() {
					var expectedSiblingHeader = tablePointer.siblings( "h2" );

					return ( expectedSiblingHeader.length > 0 )
						? expectedSiblingHeader.find( "strong" ).text()
						: CPK.verbose === true ? console.warn( "Parsing record title failed!" ) : null;
				})());

				fav.setAuthorLink((function() {
					var link = authorPointer.prop("href");

					return (typeof link === "string")
						? link
						: CPK.verbose === true ? console.warn( "Parsing author's link failed!" ) : null;
				})());

				fav.setAuthor((function() {
					var author = authorPointer.text();

					return ( typeof author === "string" )
						? author
						: CPK.verbose === true ? console.warn( "Parsing author's name failed!" ) : null;
				})());

				fav.setFormatIcon((function() {
					var expectedIcon = formatPointer.children( "i" );

					return ( expectedIcon.length )
						? expectedIcon.attr( "class" )
						: CPK.verbose === true ? console.warn( "Parsing format icon class failed!" ) : null;
				})());

				fav.setFormat((function() {
					var expectedSpan = formatPointer.children( "span" );

					return ( expectedSpan.length )
						? expectedSpan.attr( "data-orig" )
						: CPK.verbose === true ? console.warn( "Parsing record format failed!" ) : null;
				})());

				fav.setPublished((function() {
					var expectedSpan = tablePointer.find( "tbody tr td span[property=publicationDate]" );

					return ( expectedSpan.length )
						? expectedSpan.text()
						: CPK.verbose === true ? console.warn( "Parsing publication year failed!" ) : null;
				})());

				fav.setImage((function() {
					var expectedParentSiblingSmallDivision = tablePointer.parent().siblings( "div.col-sm-3" );

					if (expectedParentSiblingSmallDivision.length <= 0) {
						return CPK.verbose === true ? console.warn( "Parsing record image's parent div failed!" ) : null;
					}

					var expectedImg = expectedParentSiblingSmallDivision.find( "img" );

					if ( expectedImg.length ) {
						return expectedImg.attr( "src" ); // We found image
					}

					// Parsing image has failed .. so try to parse an icon
					var expectedIcon = expectedParentSiblingSmallDivision.find( "i[class][style]" );

					if ( expectedIcon.length <= 0 ) {
						return CPK.verbose === true ? console.warn( "Parsing record image source or icon failed!" ) : null;
					}

					// Set at least the icon to the object
					fav.setIcon( expectedIcon.attr( "class" ) );
					fav.setIconStyle( expectedIcon.attr( "style" ) );

					// And image is undefined ..
					return undefined;
				})());

				return Promise.resolve( fav );
			}

			// Parse record's detail
			return Promise.resolve( parseRecordDetailPromise() )
				// TODO Remove block below!
				.then(function( result ) {
					console.log( result );
					return Promise.resolve( true );
				});
		}

		/**
		 * @private Parses Favorite from search record.
		 * @param {number} rank
		 * @returns {Promise}
		 */
		function parseRecordSearch( rank ) {

			/**
			 * @returns {Promise<>}
			 */
			function parseRecordSearchPromise() {
				if ( typeof rank === "undefined" ) {
					if ( CPK.verbose === true ) {
						console.error( "Can not parse from current search with unknown rank!" );
					}

					return Promise.resolve( false );
				}

				rank = parseInt( rank );

				if ( rank < 0 ) {
					if ( CPK.verbose === true ) {
						console.error( "Invalid rank provided for parsing current search!" );
					}

					return Promise.resolve( false );
				}

				if ( typeof searchItems === "undefined" ) {
					window.addEventListener( "searchResultsLoaded", updateSearchItems );

					updateSearchItems();
				}

				var record = searchItems.get( rank );
				record = record.getElementsByClassName( "row" )[0];

				var fav = new Favorite();

				fav.setTitle((function() {
					var anchor = record.querySelector( "a.title" );

					if ( anchor ) {
						this.titleLink = anchor.getAttribute( "href" );
						return anchor.textContent.trim();
					}

					if ( CPK.verbose === true ) {
						console.warn( "Parsing search record title and titleLink failed!" );
					}
				})());

				fav.setAuthor((function() {
					var anchor = record.querySelector( "a.author-info" );

					if ( anchor ) {
						this.authorLink = anchor.getAttribute( "href" );
						return anchor.textContent.trim();
					}

					if ( CPK.verbose === true ) {
						console.warn( "Parsing search record author and authorLink failed!" );
					}
				})());

				fav.setFormat((function() {
					var iconDiv = record.querySelector( "div.format-list div.iconlabel" );

					if ( iconDiv ) {
						fav.setFormatIcon( iconDiv.getElementsByTagName( "i" )[0].getAttribute( "class" ));
						return iconDiv.getElementsByTagName( "span" )[0].getAttribute( "data-orig" );
					}

					if ( CPK.verbose === true ) {
						console.warn( "Parsing format icon class failed!" );
						console.warn( "Parsing record format failed!" );
					}
				})());

				fav.setPublished((function() {
					var span = record.querySelector( "span.summDate" );

					if ( span ) {
						return span.textContent.trim();
					}

					if ( CPK.verbose === true ) {
						console.warn( "Parsing date of publishing failed!" );
					}
				})());

				fav.setImage((function() {
					var errorMsg = "Parsing image or icon failed!";
					try {
						var thumb = record.getElementsByClassName( "coverThumbnail" )[0];
						var image = thumb.getElementsByTagName( "img" )[0];

						if ( typeof image !== "undefined" ) {
							return image.getAttribute( "src" );
						}

						var icon = thumb.getElementsByTagName( "i" )[0];

						if ( typeof icon !== "undefined" ) {
							fav.setIcon( icon.getAttribute( "class" ) );
							fav.setIconStyle( icon.getAttribute( "style" ) );
							// Icon is set but image self is undefined
							return undefined;
						}

						if ( CPK.verbose === true ) {
							console.log( errorMsg );
						}
					} catch ( error ) {
						console.error( errorMsg, error );
					}
				})());

				return Promise.resolve( fav );
			}

			return Promise.resolve( parseRecordSearchPromise() )
				// TODO Remove block below!
				.then(function( result ) {
					console.log( result );
					return Promise.resolve( true );
				})
		}

		// Public API
		var FavItem = Object.create( null );

		// Getters/Setters
		FavItem.getTitle      = function fav_getTitle() { return props.title; };
		FavItem.setTitle      = function fav_setTitle( v ) { props.title = v; };
		FavItem.getTitleLink  = function fav_getTitleLink() { return props.titleLink; };
		FavItem.setTitleLink  = function fav_setTitleLink( v ) { props.titleLink = v; };
		FavItem.getAuthor     = function fav_getAuthor() { return props.author; };
		FavItem.setAuthor     = function fav_setAuthor( v ) { props.author = v; };
		FavItem.getAuthorLink = function fav_getAuthorLink() { return props.authorLink; };
		FavItem.setAuthorLink = function fav_setAuthorLink( v ) { props.authorLink = v; };
		FavItem.getPublished  = function fav_getPublished() { return props.published; };
		FavItem.setPublished  = function fav_setPublished( v ) { props.published = v; };
		FavItem.getFormat     = function fav_getFormat() { return props.format; };
		FavItem.setFormat     = function fav_setFormat( v ) { props.format = v; };
		FavItem.getFormatIcon = function fav_getFormatIconClass() { return props.formatIcon; };
		FavItem.setFormatIcon = function fav_setFormatIconClass( v ) { props.formatIcon = v; };
		FavItem.getImage      = function fav_getImage() { return props.image; };
		FavItem.setImage      = function fav_setImage( v ) { props.image = v; };
		FavItem.getIcon       = function fav_getIcon() { return props.icon; };
		FavItem.setIcon       = function fav_setIcon( v ) { props.icon = v; };
		FavItem.getIconStyle  = function fav_getIconStyle() { return props.iconStyle; };
		FavItem.setIconStyle  = function fav_setIconStyle( v ) { props.iconStyle = v; };
		FavItem.getCreated    = function fav_setCreated( v ) { props.created = v; };
		// Initialization methods
		FavItem.fromObject    = fromObj;
		FavItem.fromRecord    = fromRecord;
		FavItem.fromSearch    = fromSearch;
		// Export methods
		FavItem.toObject      = function fav_toObject() { return props; };
		FavItem.toString      = function fav_toString() { return JSON.stringify( props ); };

		return FavItem;
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
		 * @returns {Promise}
		 */
		function init() {
			return Promise
				.resolve( isNewTab() ? handleNewTab() : handleOldTab() )
				.then( resolveHandleTab )
				.then( resolveStorageHandler );
		}

		/**
		 * Returns boolean whether is this tab a new tab or not.
		 */
		function isNewTab() {
			return CPK.favorites.storage.has( "tabId");
			//return CPK.localStorage.hasItem( "tabId" );
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
				CPK.favorites.storage.tabId = tabId;

				// Try to get favorites for this tab

				// Attach event listener
				window.addEventListener( "storage", onGotFavorites );

				// Wait 1500 ms for response, then suppose this is the first tab.
				mastershipRetrieval = window.setTimeout( function() {
					window.removeEventListener( "storage", onGotFavorites );
					CPK.localStorage.setItem( "__favsStorage", "[]" );
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
				CPK.localStorage.setItem( "__favsStorage", "[]" );
				return;
			}

			// We got response, so there is already a master tab
			window.clearTimeout( mastershipRetrieval );

			// Set the sessionStorage
			CPK.localStorage.setItem( "__favsStorage", event.newValue );

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
	 * @type {FavoritesBroadcaster}
	 */
	CPK.favorites.broadcaster = new FavoritesBroadcaster();

}());
