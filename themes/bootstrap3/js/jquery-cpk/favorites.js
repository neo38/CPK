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
		 * @param {string} id
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
		 * ID of last tab which sent a request
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
				.then( initStorageHandler )
				.then( sendFavoritesIfNecessary );
		}

		/**
		 * Returns boolean whether is this tab a new tab or not.
		 * @returns {boolean}
		 */
		function isNewTab() {
			return CPK.localStorage.getItem( "tabId" ) !== null;
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

			/**
			 * @returns {Promise<boolean>}
			 */
			function getFavoritesForTab() {
				if ( result === false ) {
					return Promise.resolve( false );
				}

				// TODO Try to get favorites for this tab...

				// Try to get favorites for this tab

				// Attach event listener
				//window.addEventListener( "storage", onGotFavorites );

				// Wait 1500 ms for response, then suppose this is the first tab.
				/*mastershipRetrieval = window.setTimeout( function() {
					window.removeEventListener( "storage", onGotFavorites );
					CPK.localStorage.setItem( "__favsStorage", "[]" );
					becomeMaster( true );
				}, 1500 );*/

				return Promise.resolve( true );
			}

			/**
			 * @param {boolean} result
			 * @returns {Promise<boolean>}
			 */
			function doBroadcast( result ) {
				if ( result === false ) {
					return Promise.resolve( false );
				}

				// Ask other tabs for favorites ..
				broadcast( "giveMeFavorites", tabId );

				return Promise.resolve( true );
			}

			// Generate tabId ..
			tabId = Date.now();
			CPK.localStorage.setItem( "tabId", tabId );

			return Promise
				.resolve( getFavoritesForTab() )
				.then( doBroadcast );
		}

		/**
		 * Handles the logic right after we found out this is an old tab.
		 * @returns {Promise<boolean>}
		 */
		function handleOldTab() {
			if ( CPK.verbose === true ) {
				console.log( "FavoritesBroadcaster->handleOldTab" );
			}

			tabId = CPK.localStorage.getItem( "tabId" );

			var masterTabId = CPK.localStorage.getItem( "favoritesMasterTab" );

			if ( masterTabId === tabId || masterTabId === "rand" ) {
				becomeMaster( true );
			} else if ( CPK.verbose === true ) {
				console.log( "Being a slaveTab is nice!" );
			}

			return Promise.resolve( true );
		}

		/**
		 * Initializes handler for "storage" event.
		 * @param {boolean} result
		 * @returns {Promise<boolean>}
		 */
		function initStorageHandler( result ) {
			if ( CPK.verbose === true ) {
				console.log( "FavoritesBroadcaster->initStorageHandler" );
			}

			window.addEventListener( "storage", handleStorageEvent, true );

			return Promise.resolve( true );
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
	 * Controller for the search page.
	 * @returns {Object}
	 * @constructor
	 * @todo Holds pointers to all created event handlers to proper removal of them.
	 */
	function SearchController() {

		/**
		 * Holds array of linked HTML elements.
		 * @type {Object}
		 */
		var domLinker = Object.create( null );

		/**
		 * @type {array} Holds array of HTML elements on which we were attached event handler.
		 */
		var targetElms = [];

		/**
		 * Initializes the controller.
		 * @returns {Promise<boolean>}
		 */
		function init() {
			/*rankedItems = document.querySelectorAll('div#result-list-placeholder div[id]');

			if (typeof directly === 'undefined')
				$compile(rankedItems)($scope);

			rankedItemsLength = rankedItems.length;
			for (var rank = 0; rank < rankedItemsLength; ++rank) {
				isFavorite(rank).then(function(result) {

					rank = result.rank;
					favorite = result.favorite;

					favs[rank] = favorite;

					switchAddRemoveSpanVisibility(rank);
				});
			}*/
			return Promise
				.resolve( initDom() )
				.then( initEventHandlers )
				.then( initAddRemoveLinks );
		}

		/**
		 * Resets controller.
		 */
		function resetController() {
			/*favs = [];
			recordIsFav = [];
			pubElements = [];
			pubElementsLinked = [];*/
			removeEventHandlers();
		}

		/**
		 * Initializes DOM required by the controller.
		 * @returns {Promise<boolean>}
		 */
		function initDom() {
			console.warn( "XXX Finish this!" );

			return Promise.resolve( true );
		}

		/**
		 * Initializes event handlers for "searchResults*" events.
		 * @param {boolean} result
		 * @returns {Promise<boolean>}
		 */
		function initEventHandlers( result ) {
			if ( result === false ) {
				return Promise.resolve( false );
			}

			window.addEventListener( "searchResultsLoaded", onSearchResultsLoaded, true );
			window.addEventListener( "searchResultsLoading", onSearchResultsLoading, true );
		}

		/**
		 * Initializes "Add/Remove favorite" links.
		 * @param {boolean} result
		 * @returns {Promise<boolean>}
		 */
		function initAddRemoveLinks( result ) {
			if ( result === false ) {
				return Promise.resolve( false );
			}

			console.warn( "XXX Finish this!" );

			return Promise.resolve( true );
		}

		/**
		 * @private Executed when search results are loaded.
		 * @param {Event} event
		 */
		function onSearchResultsLoaded( event ) {
			if ( CPK.verbose === true ) {
				console.log( "CPK.favorites.SearchController", "onSearchResultsLoaded", event );
			}

			event.preventDefault();
			event.stopPropagation();

			Promise.resolve( CPK.favorites.SearchController.initialize() );
		}

		/**
		 * @private Executed when search results are going to be loaded.
		 * @param {Event} event
		 */
		function onSearchResultsLoading( event ) {
			if ( CPK.verbose === true ) {
				console.log( "CPK.favorites.SearchController", "onSearchResultsLoading", event );
			}

			event.preventDefault();
			event.stopPropagation();

			CPK.favorites.SearchController.reset();
		}


		/**
		 * @private Removes all event handlers from "Add/Remove Favorite" links.
		 */
		function removeEventHandlers() {

			/**
			 * @param {HTMLElement} elm
			 */
			function removeClickEventHandler( elm ) {
				try {
					elm.removeEventListener( "click", addRemoveFavorite );
				} catch ( e ) { /*...*/ }
			}

			// Remove all event handlers
			targetElms.forEach( removeClickEventHandler );

			// Clear `targetElms`
			targetElms = [];
		}

		/**
		 * Dispatches the user's click based on the logic implemented ..
		 * @param {Event} event
		 * @returns {Promise<boolean>}
		 */
		function addRemoveFavorite( event ) {
			/**
			 * @type {string}
			 * @todo Resolve `rank`!
			 */
			var rank;

			/**
			 * @param {boolean} result
			 */
			function resolveIsFavorite( result ) {
				return Promise.resolve( ( result === true )
					? removeFavorite( rank )
					: addFavorite( rank ) );
			}

			// Check if is already favorite then either add or remove...
			Promise
				.resolve( isFavorite( rank ) )
				.then( resolveIsFavorite );
		}

		/**
		 * @private Prompts the storage to add the current record to the favorites.
		 * @param {string} rank
		 * @returns {Promise<boolean>}
		 */
		function addFavorite( rank ) {
			/**
			 * @type {Favorite}
			 */
			var favorite = new Favorite();
			favorite.fromSearch( rank );

			return Promise
				.resolve( CPK.favorites.storage.add( favorite ) )
				.then(function( result ) {
					//switchAddRemoveSpanVisibility( rank );
					//CPK.favorites.broadcaster.broadcastAdded( favorite );
					return Promise.resolve( true );
				});
		}

		/**
		 * @private Prompts the storage to remove the current favorite.
		 * @param {string} rank
		 * @returns {Promise<boolean>}
		 */
		function removeFavorite(rank) {
			/**
			 * @type {Favorite}
			 */
			var favorite = new Favorite();
			favorite.fromSearch( rank );

			return Promise
				.resolve( CPK.favorites.storage.remove( favorite.getCreated() ) )
				.then(function( result ) {
					//switchAddRemoveSpanVisibility( rank );
					//CPK.favorites.broadcaster.broadcastRemoved( favorite );
					return Promise.resolve( true );
				});
		}

		/**
		 * Prompts storage module to see if there already is favorite with
		 * current recordId ..
		 *
		 * It returns Promise, which will resolve the favorite as a Favorite
		 * class if found ..
		 *
		 * If it doesn't find anything, it fires the reject method only.
		 *
		 * @todo Finish review!!!
		 */
		function isFavorite(rank) {
			return new Promise(function(resolve, reject) {

				var recordId = getRecordId(undefined, rank);

				storage.hasFavorite(recordId).then(function(favorite) {
					resolve({
						rank: rank,
						favorite: favorite
					});
				}).catch(reject);
			});
		}

		/**
		 * Gets the RecordId from the specified element.
		 * @param {HTMLElement} elm
		 * @returns {string|boolean} Returns FALSE if element doesn't represent a record.
		 */
		function getRecordId( elm ) {
			try {
				var recordId = elm.querySelector( "a.title" ).getAttribute( "href" ).match(/^\/Record\/([^\?]*)/)[1];

				if ( typeof recordId === "string" ) {
					if ( recordId.trim().length > 0 ) {
						return recordId;
					}
				}
			} catch ( e ) {/*...*/}

			return false;
			//var fromWhat = (typeof fromThis === "undefined") ? location.pathname : fromThis;
			//return fromWhat.split('/')[2];
		}

		// Public API
		var Controller = Object.create( null );

		Controller.initialize        = init;
		Controller.reset             = resetController;
		Controller.addRemoveFavorite = addRemoveFavorite;
		Controller.isFavorite        = isFavorite;
		Controller.getRecordId       = getRecordId;

		return Controller;
	}

	/**
	 * Controller for the record's detail page.
	 * @returns {Object}
	 * @constructor
	 */
	function RecordController() {
		var pubElements = {
				remFavBtn : undefined,
				addFavBtn : undefined
			},
			fav = undefined,
			recordIsFav = false;

		/**
		 * Initializes the controller.
		 * @returns {Promise<boolean>}
		 */
		function init() {
			console.error( "Implement RecordController!" );
			return Promise.resolve( false );
		}

		/**
		 * Dispatches the user's click based on the logic implemented ..
		 */
		function addRemoveFavorite() {
			if (! recordIsFav) {
				addFavorite();
			} else {
				removeFavorite();
			}
		};

		/**
		 * @private Prompts the storage to add the current record to the favorites.
		 */
		function addFavorite() {

			fav = favoritesFactory.createFromCurrentRecord();

			storage.addFavorite(fav).then(function() {

				switchAddRemoveSpanVisibility();

				// Broadcast this event across all tabs
				favsBroadcaster.broadcastAdded(fav);

			}).catch(function(reason) {

				$log.error(reason);
			});
		};

		/**
		 * @private Prompts the storage to remove the current favorite.
		 */
		function removeFavorite() {

			var id = fav.created();

			storage.removeFavorite(id).then(function() {

				switchAddRemoveSpanVisibility();

				// Broadcast this event across all tabs
				favsBroadcaster.broadcastRemoved(fav);

			}).catch(function(reason) {

				$log.error(reason);
			});
		}

		/**
		 * Prompts storage module to see if there already is favorite with
		 * current recordId ..
		 *
		 * It returns Promise, which will resolve the favorite as a Favorite
		 * class if found ..
		 *
		 * If it doesn't find anything, it fires the reject method only.
		 */
		function isFavorite() {
			return new Promise(function(resolve, reject) {

				var recordId = getRecordId();

				storage.hasFavorite(recordId).then(function(favorite) {
					resolve(favorite);
				}).catch(reject);
			});
		}

		/**
		 * Gets the record id of current record page
		 */
		function getRecordId(fromThis) {

			var fromWhat = (typeof fromThis === "undefined") ? location.pathname : fromThis;

			var match = fromWhat.match(/^\/Record\/([^\?]*)/);

			return match ? match[1] : null;
		}

		/**
		 * It switches the visibility of two spans with "addRemove" attribute.
		 *
		 * It should be called with caution only when you're certain the
		 * visibility change is desired !
		 */
		function switchAddRemoveSpanVisibility() {

			// Switch their roles ..
			pubElements.remFavBtn.hidden = ! pubElements.remFavBtn.hidden;
			pubElements.addFavBtn.hidden = ! pubElements.addFavBtn.hidden;

			// record is favorite boolean is now being inverted ..
			recordIsFav = ! recordIsFav;
		}

		/*=============================================================================================================
		function RecordController($log, storage, favoritesFactory, Favorite, favsBroadcaster) {
			isFavorite().then(function(favorite) {
				fav = favorite;

				switchAddRemoveSpanVisibility();

			// Public function about to be called from the favsBroadcaster when an event
			// happens (meaning adding / removal of the favorite)
			window.__favChanged = function(isNew, newFav) {
				if (newFav instanceof Favorite)
					if (isNew === true) {
						// This ctrl doesnt know it & we are talking about current rec
						if (recordIsFav === false && getRecordId(newFav.titleLink()) === getRecordId()) {
							fav = newFav;
							switchAddRemoveSpanVisibility();
						}
					} else if (isNew === false) {
						//Was removed old & this ctrl doesnt know it & we are talking about current rec
						if (recordIsFav === true && newFav.created() === fav.created()) {
							fav = newFav;
							switchAddRemoveSpanVisibility();
						}
					}
			}
		}

		function RecordDirective() {
			return {
				restrict : 'A',
				link : linker
			};

			function linker(scope, elements, attrs) {
				var el = elements.context;
				var attr = el.getAttribute('data-add-remove-record');

				// Add favorite will be shown by default & remove hidden by def
				if (attr === "add") {

					// Store the pointer to this element
					pubElements.addFavBtn = el;

					// Set it to shown
					el.hidden = false;

				} else if (attr === "rem") {

					// Store the pointer to this element
					pubElements.remFavBtn = el;

					// Set it to hidden
					el.hidden = true;
				}
			};
		};
		==============================================================================================================*/

		// Public API
		var Controller = Object.create( null );

		Controller.initialize = init;
		Controller.addRemoveFavorite = addRemoveFavorite;
		Controller.isFavorite = isFavorite;

		return Controller;
	}

	/**
	 * Controller for myresearch/favorites (only for not-logged users!).
	 * @see themes/bootstrap3/templates/myresearch/mylist-notlogged.phtml
	 * @returns {Object}
	 * @constructor
	 */
	function ListController() {
		var divsAsFavs = {},
			listEmptyDiv = undefined,
			listNotEmptyDiv = undefined,
			activeSorting = "recent",
			modal = jQuery( document.getElementById( "modal" ) );

		/**
		 * Initializes the controller.
		 * @returns {Promise<boolean>}
		 */
		function init() {
			console.error( "Implement ListController!" );
			return Promise.resolve( false );
		}

		function onGetFavorites(favs) {

			// Default sorting is by most recent, so flip the order ..
			favs = favs.reverse();

			vm.favorites = favs;

			var length = favs.length;

			if (length) {
				changeVisibleDiv();

				vm.listLength = length;
			}
		}

		function removeFavorite(id) {

			// We need to refresh the view with async job .. use Promise
			new Promise(function(resolve, reject) {

				storage.removeFavorite(id).then(function() {

					var el = divsAsFavs[id];

					if (window.usesIE) {
						el.parentElement.removeChild(el);
					} else
						el.remove();

					delete divsAsFavs[id];

					--vm.listLength;

					if (Object.keys(divsAsFavs).length === 0)
						changeVisibleDiv();

					var idAsInt = parseInt(id);

					// Delete it from the vm.favorites list ..
					vm.favorites = vm.favorites.filter(function(favorite) {

						if (favorite.created() !== idAsInt)
							return true;


						// And also broadcast it's removal
						favsBroadcaster.broadcastRemoved(favorite);

						return false;
					});

				}).catch(function(reason) {

					$log.error(reason);
				});

				resolve();

				// Then refresh the scope
			}).then($scope.$applyAsync);
		}

		function removeSelected() {
			Object.keys(vm.favSelected).forEach(function(key) {
				if (vm.favSelected[key] === true) {

					removeFavorite(parseInt(key));

					delete vm.favSelected[key];
				}
			});
		}

		function exportSelected() {

			Lightbox.titleSet = false;

			useLightboxWithSelected('export');
		}

		function emailSelected(event) {

			modal.find('.modal-title').html(event.target.value);
			Lightbox.titleSet = true;

			useLightboxWithSelected('email');
		}

		/**
		 * Redirects user to /Records/Home action if selected something
		 */
		function printSelected() {

			var selectedIds = getSelectedIds();

			if (selectedIds.length === 0)
				return;

			var printLocation = '/Records/Home?print=1';

			selectedIds.forEach(function(selectedId){
				printLocation += '&id[]=Solr|' + selectedId;
			});

			// Open in new tab
			window.open(printLocation, '_blank').focus();
		}

		function selectAll() {
			vm.favorites.forEach(function(favorite) {
				vm.favSelected[favorite.created()] = vm.allSelected;
			});
		}

		/**
		 * Returns current sorting if no argument supplied.
		 *
		 * Else sets the sorting provided & updates the view.
		 */
		function sortVal(val) {
			return arguments.length ? setSorting(val) : getSorting();
		}

		// Private

		function addFavorite(favorite) {

			// We need to refresh the view with async job .. use Promise
			new Promise(function(resolve, reject) {

				if (! favorite instanceof Favorite) {
					reject();
					return;
				}

				vm.favorites.push(favorite);

				// Apply current sorting
				setSorting(getSorting());

				if (vm.favorites.length === 1) {
					changeVisibleDiv();

					vm.listLength = 1;
				}

				resolve();

			}).then($scope.$applyAsync);
		}

		function changeVisibleDiv() {
			listEmptyDiv.hidden = ! listEmptyDiv.hidden;
			listNotEmptyDiv.hidden = ! listNotEmptyDiv.hidden;
		}

		function getSelectedIds() {

			var selectedIds = [];

			Object.keys(vm.favSelected).forEach(function(key) {
				if (vm.favSelected[key] === true) {

					var id = getFavoriteId(key);

					selectedIds.push(id);
				}
			});

			return selectedIds;
		}

		function useLightboxWithSelected(type) {

			var selectedIds = getSelectedIds();

			if (selectedIds.length === 0)
				return;

			// Append "Solr|" string to all the ids selected
			for (var i = 0; i < selectedIds.length; ++i) {
				selectedIds[i] = 'Solr|' + selectedIds[i];
			}

			var data = {
				ids : selectedIds,
			};

			data[type] = true;

			var options = {
				headers : {
					'Content-Type' : 'application/x-www-form-urlencoded'
				}
			};

			function setModalContent(response) {
				Lightbox.changeContent(response.data);
			}

			$http.post('/AJAX/JSON?method=getLightbox&submodule=Cart&subaction=MyResearchBulk', $.param(data), options).then(setModalContent);

			modal.modal('show');
		}

		function setSorting(val) {

			// We need to refresh the view with async job .. use Promise
			new Promise(function(resolve, reject) {

				var validSorting = true;

				switch(val) {

					case 'alphabetical':

						vm.favorites.sort(function(a, b) {
							return a.title() > b.title();
						});
						break;

					case 'author':

						vm.favorites.sort(function(a, b) {
							return a.author() > b.author();
						});
						break;

					case 'recent':

						vm.favorites.sort(function(a, b) {
							return a.created() < b.created();
						});
						break;

					default:
						validSorting = false;
						$log.error('Invalid sorting provided');
				}

				if (validSorting)
					activeSorting = val;

			}).then($scope.$applyAsync);

		}

		function getSorting() {
			return activeSorting;
		}

		/**
		 * Returns Solr ID of favorite identified by timestamp created
		 *
		 * @param key
		 */
		function getFavoriteId(key) {
			var fav = vm.favorites.find(function(favorite) {
				return favorite.created() === parseInt(key);
			});

			if (typeof fav === 'undefined')
				return;

			return fav.titleLink().replace('/Record/', '');
		}

		/*==============================================================================================================
		function ListController($q, $http, $log, $scope, storage, favsBroadcaster, Favorite) {
			$q.resolve(storage.getFavorites()).then(onGetFavorites).catch(function(reason) {
				$log.error(reason);
			});

			// Public function about to be called from the favsBroadcaster when an
			// event happens (meaning adding / removal of the favorite)
			window.__favChanged = function(isNew, favorite) {
				if (favorite instanceof Favorite)
					if (isNew === true) { // being added ..
						addFavorite(favorite);
					} else if (isNew === false) { // being deleted ..
						// We need to refresh the view with async job .. use Promise
						new Promise(function(resolve, reject) {
							var id = favorite.created();
							var el = divsAsFavs[id];

							if (window.usesIE) {
								el.parentElement.removeChild(el);
							} else
								el.remove();

							delete divsAsFavs[id];

							--vm.listLength;

							if (Object.keys(divsAsFavs).length === 0)
								changeVisibleDiv();

							// Delete it from the vm.favorites list ..
							vm.favorites = vm.favorites.filter(function(fav) {
								return fav.created() !== favorite.created();
							});

							resolve();
						}).then($scope.$applyAsync);
					}
			};
		}

		function favoritesListDirective() {
			return {
				restrict : 'A',
				templateUrl : '/themes/bootstrap3/js/ng-cpk/favorites/list-item.html',
				link : linker
			};

			function linker(scope, elements, attrs) {
				// Assing the divs to an object with fav ID
				divsAsFavs[scope.fav.created()] = elements.context;
			}
		}

		function listNotEmptyDirective() {
			return {
				restrict : 'A',
				link : linker
			};

			function linker(scope, elements, attrs) {
				if (attrs.listNotEmpty === "true") {

					listNotEmptyDiv = elements.context;
					listNotEmptyDiv.hidden = true;
				} else if (attrs.listNotEmpty === "false") {

					listEmptyDiv = elements.context;
					listEmptyDiv.hidden = false;
				}
			}
		}
		==============================================================================================================*/

		// Public API
		var Controller = Object.create( null );

		// Properties
		Controller.favSelected = {};
		Controller.favorites   = [];
		Controller.sortVal     = sortVal;
		Controller.allSelected = false;
		Controller.listStart   = 1;
		Controller.listLength  = 1;

		// Methods
		Controller.initialize     = init;
		Controller.selectAll      = selectAll;
		Controller.removeFavorite = removeFavorite;
		Controller.removeSelected = removeSelected;
		Controller.emailSelected  = emailSelected;
		Controller.exportSelected = exportSelected;
		Controller.printSelected  = printSelected;

		return Controller;
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

	/**
	 * @type {SearchController}
	 */
	CPK.favorites.SearchController = new SearchController();

	/**
	 * @type {RecordController}
	 */
	CPK.favorites.RecordController = new RecordController();

	/**
	 * @type {ListController}
	 */
	CPK.favorites.ListController   = new ListController();

}());
