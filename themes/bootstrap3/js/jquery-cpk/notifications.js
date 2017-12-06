/**
 * New implementation of notifications. Is based on jQuery but is based
 * previous Angular-based code.
 *
 * @author Jiří Kozlovský, original Angular solution
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 *
 * @todo První notifikace (v notifications.phtml):
 * @todo data-repeat='notification in notifCtrl.notifications["noAPI"]["user"]'
 * @todo div.addEventHandler( 'click', ( event ) => { notifClicked( notification, "user", event ); }, true )
 *
 * @todo Druhé notifikace:
 * @todo data-repeat='notification in notifCtrl.notifications["<?= $libraryCard['cat_username'] ?>"]'
 * @todo div.addEventHandler( 'click', ( event ) => { notifClicked( notification, source, event ); }, true )
 */

(function() {
	"use strict";

	if ( CPK.verbose === true ) {
		console.log("jquery-cpk/notifications.js");
	}

	/**
	 * Notifications controller.
	 * @constructor
	 * @returns {NotificationsController}
	 */
	function NotificationsController() {
		var unreadNotifsCount = 0,
			notificationsCache = Object.create( null );

		notificationsCache.noApi = Object.create( null );

		/**
		 * Holds array of linked HTML elements.
		 * @property {HTMLElement} dropDown
		 * @property {HTMLElement} dropDownUl
		 * @property {HTMLElement} listDiv
		 * @property {HTMLElement} syncNotifs
		 * @property {HTMLElement} loader
		 * @property {HTMLElement} unread
		 * @property {HTMLElement} icon
		 * @property {array} institutionListDivs
		 * @type {Object}
		 */
		var domLinker = Object.create( null );

		/**
		 * Holds DOM elements of "Loading..." for each institution user
		 * is connected with.
		 * @type {Object}
		 */
		var institutionNotificationsLoaderHolder = Object.create( null );

		/**
		 * Simple object for library card.
		 * @param {string} institution
		 * @param {string} source
		 * @param {string} userName
		 * @property {string} institution
		 * @property {string} source
		 * @property {string} userName
		 * @constructor
		 */
		function LibraryCard( institution, source, userName ) {
			/**
			 * @type {Array}
			 */
			var notifications = [];

			/**
			 * @param {Object} notification
			 */
			function addNotification( notification ) {
				notifications.push( notification );
			}

			/**
			 * @returns {Array}
			 */
			function getNotifications() {
				return notifications;
			}

			// Public API

			// Properties
			this.institution  = institution;
			this.source       = source;
			this.userName     = userName;

			// Methods
			this.addNotification  = addNotification;
			this.getNotifications = getNotifications;
		}

		/**
		 * Initializes notifications (just like linkers before for Angular app).
		 * @param {Event} event
		 * @return {Promise}
		 */
		function initialize( event ) {
			return Promise
				.resolve( initDom() )
				.then( resolveInitDom )
				.then( initEventHandlers )
				.then( resolveInitEventHandlers )
				.then( initRestOfAll )
				.then( resolveInitRestOfAll )
				.then( finishInit );
		}

		/**
		 * @private Initializes DOM links required by the constructor.
		 * @returns {Promise<boolean>}
		 */
		function initDom() {
			var result = true;

			domLinker.dropDown    = document.getElementById( "notificationsDropdown" );
			domLinker.dropDownUl  = document.getElementById( "notificationsList" );
			domLinker.listDiv     = document.getElementById( "notificationsListDiv" );
			domLinker.syncNotifs  = document.getElementById( "notif_synchronous_notifications" );
			domLinker.loader      = document.getElementById( "notif_loader" );
			domLinker.unread      = document.getElementById( "notif_unread_count" );
			domLinker.icon        = document.getElementById( "notif_icon" );
			// Get `listDiv`s for all institutions to which current user belongs
			domLinker.institutionListDivs = jQuery( ".institution-notif-list-div", domLinker.dropDownUl );

			/**
			 * @param {string} key
			 */
			function checkElm( key ) {
				try {
					/**
					 * @type {HTMLElement}
					 */
					var elm = domLinker[key];

					if ( elm.nodeType !== 1 ) {
						result = false;
					}
				} catch ( e ) {
					result = false;
				}
			}

			// Check if we found all DOM elements we need
			[
				"dropDown", "dropDownUl", "listDiv", "syncNotifs", "loader",
				"unread", "icon"
			].forEach( checkElm );

			return Promise.resolve( result );
		}

		/**
		 * @private Resolves initialization of DOM.
		 * @param {boolean} result
		 * @returns {Promise<boolean>}
		 */
		function resolveInitDom( result ) {
			if ( CPK.verbose === true ) {
				console.info( result === true
					? "DOM links for NotificationsController were initialized."
					: "DOM links for NotificationsController were not initialized." );
			}

			return Promise.resolve( result );
		}

		/**
		 * @private Initializes basic event handlers.
		 * @param {boolean} result
		 * @returns {Promise<boolean>}
		 */
		function initEventHandlers( result ) {
			if ( result === false ) {
				return Promise.resolve( false );
			}

			// TODO Finish this...
			// TODO Handler for `notifCtrl.notifClicked(notification,user)`
			// TODO Handler for `notifCtrl.notifClicked(notification,source)`

			return Promise.resolve( true ); // TODO Just for now!!!!!!!
		}

		/**
		 * @private Resolves initialization of basic event handlers.
		 * @param {boolean} result
		 * @returns {Promise<boolean>}
		 */
		function resolveInitEventHandlers( result ) {
			if ( CPK.verbose === true ) {
				console.info( result === true
					? "Event handlers for NotificationsController were initialized."
					: "Event handlers for NotificationsController were not initialized." );
			}

			return Promise.resolve( result );
		}

		/**
		 * @private Initializes rest of all what's needed using parallel jobs.
		 * @param {boolean} result
		 * @returns {Promise<boolean>}
		 */
		function initRestOfAll( result ) {
			if ( result === false ) {
				return Promise.resolve( false );
			}

			/**
			 * @type {function[]} Array of functions that returns Promise resolved to boolean.
			 */
			var jobs = [ initNotificationsForUser, initNotificationsForLibrary ];

			/**
			 * @param {function} job
			 * @returns {Promise<boolean>}
			 */
			function executeJob( job ) {
				return Promise.resolve( job.call() ).then( catchExecuteJob );
			}

			/**
			 * @param error
			 * @returns {Promise<boolean>}
			 */
			function catchExecuteJob( error ) {
				if ( CPK.verbose === true ) {
					console.error( error );
				}

				return Promise.resolve( true );
			}

			// Execute all jobs (job = chain of promises)
			jobs.forEach( executeJob );

			// TODO After all notifications are fetched and used we need to update unread count
			//Promise.all( jobs ).then( updateUnreadCount ).then( resolveUpdateUnreadCount );
		}

		/**
		 * @private Resolves initialization of the rest of all.
		 * @param {boolean} result
		 * @returns {Promise<boolean>}
		 */
		function resolveInitRestOfAll( result ) {
			if ( CPK.verbose === true ) {
				console.info( "Rest of NotificationsController was initialized." );
			}

			return Promise.resolve( result );
		}

		/**
		 * @private Finalizes initialization of NotificationsController.
		 * @param {boolean} result
		 * @returns {Promise<boolean>} Always resolved with TRUE.
		 */
		function finishInit( result ) {
			if ( CPK.verbose === true ) {
				console.info( "Initialization of NotificationsController was resolved with this result:", result );
			}

			return Promise.resolve( true );
		}

		/**
		 * @private Initializes notifications for current user.
		 * @returns {Promise<boolean>}
		 */
		function initNotificationsForUser() {
			if ( CPK.verbose === true ) {
				console.info( "NotificationsController->fetchNotificationsForUser" );
			}

			/**
			 * @returns {Promise<array>}
			 */
			function getNotificationsPromise() {
				if ( CPK.verbose === true ) {
					console.info( "NotificationsController", ">", "fetchNotificationsForUser", ">", "getNotificationsPromise" );
				}

				/**
				 * @param {Object} response
				 * @returns {Promise<array>}
				 */
				function onAjaxDone( response ) {
					if ( CPK.verbose === true ) {
						console.info( "NotificationsController", ">", "fetchNotificationsForUser", ">", "getNotificationsPromise", ">", "onAjaxDone", response );
					}

					return Promise.resolve(
						( response.data.notifications !== undefined )
							? response.data.notifications
							: []
					);
				}

				/**
				 * @param error
				 * @returns {Promise<array>}
				 */
				function onAjaxFail( error ) {
					if ( CPK.verbose === true ) {
						console.info( "NotificationsController", ">", "fetchNotificationsForUser", ">", "getNotificationsPromise", ">", "onAjaxFail", error );
					}

					return Promise.resolve( [] );
				}

				return Promise
					.resolve( jQuery.get( "/AJAX/JSON?method=getMyNotificationsForUser", null, null, "json" ) )
					.then( onAjaxDone )
					.catch( onAjaxFail );
			}

			/**
			 * @param {array} notifications
			 * @returns {Promise<Number>}
			 */
			function useNotificationsPromise( notifications ) {
				if ( CPK.verbose === true ) {
					console.info( "NotificationsController", ">", "fetchNotificationsForUser", ">", "useNotificationsPromise", notifications );
				}

				if ( ! ( notifications instanceof Array ) ) {
					return Promise.resolve( 0 );
				}

				notifications.forEach(function( notification ) {
					if ( notification.clazz.match( /unread/ ) ) {
						unreadNotifsCount += 1;
					}
				});

				notificationsCache.noApi.user = notifications;
				return Promise.resolve( unreadNotifsCount );
			}

			return Promise
				.resolve( getNotificationsPromise() )
				.then( useNotificationsPromise )
				.then( unreadCountPromise )
				.then( warningIconPromise );
		}

		/**
		 * @private Fetches notifications for source and username.
		 * @returns {Promise<boolean>}
		 */
		function initNotificationsForLibrary() {
			if ( CPK.verbose === true ) {
				console.info( "NotificationsController", ">", "initNotificationsForLibrary" );
			}

			/**
			 * @returns {Promise<LibraryCard[]>}
			 */
			function getLibraryCards() {
				if ( CPK.verbose === true ) {
					console.info( "NotificationsController", ">", "initNotificationsForLibrary", ">", "getLibraryCards" );
				}

				var result = [];

				/**
				 * @param {Number} idx
				 * @param {HTMLElement} elm
				 */
				function processCard( idx, elm ) {
					try {
						result.push( new LibraryCard(
							elm.getAttribute( "data-institution" ),
							elm.getAttribute( "data-source" ),
							elm.getAttribute( "data-username" )
						) );
					} catch ( error ) {
						if ( CPK.verbose === true ) {
							console.error( error );
						}
					}
				}

				jQuery( "li.institutionNotificationsLi", domLinker.dropDown ).each( processCard );

				return Promise.resolve( result );
			}

			/**
			 * @param {LibraryCards[]} libraryCards
			 * @returns {Promise<LibraryCards[]>}
			 */
			function getNotifications( libraryCards ) {
				if ( CPK.verbose === true ) {
					console.info( "NotificationsController", ">", "initNotificationsForLibrary", ">", "getNotifications", libraryCards );
				}

				/**
				 * @type {Promise<boolean>[]}
				 */
				var promises = [];

				/**
				 * @param {LibraryCard} card
				 * @param {Number} index
				 */
				function createPromise( card, index ) {
					if ( CPK.verbose === true ) {
						console.info( "NotificationsController", ">", "initNotificationsForLibrary", ">", "getNotifications", ">", "createPromise", card, index );
					}

					/**
					 * @param {Object} response
					 * @returns {Promise<array>}
					 */
					function onAjaxDone( response ) {
						if ( CPK.verbose === true ) {
							console.info( "NotificationsController", ">", "initNotificationsForLibrary", ">", "getNotificationsPromise", ">", "onAjaxDone", response );
						}

						/**
						 * @param {Object} notification
						 */
						function processNotification( notification ) {
							libraryCards[ index ].addNotification( notification );
						}

						if ( typeof response.data.notifications !== "undefined" ) {
							response.data.notifications.forEach( processNotification );
						}

						return Promise.resolve( true );
					}

					/**
					 * @param error
					 * @returns {Promise<array>}
					 */
					function onAjaxFail( error ) {
						if ( CPK.verbose === true ) {
							console.info( "NotificationsController", ">", "initNotificationsForLibrary", ">", "getNotificationsPromise", ">", "onAjaxFail", error );
						}

						return Promise.resolve( false );
					}

					var data = { cat_username: card.userName },
						opts = {
							headers: { "Content-Type": "application/x-www-form-urlencoded" }
						},
						promise = Promise
							.resolve( jQuery.post( "/AJAX/JSON?method=getMyNotificationsForUserCard", data, opts, "json" ) )
							.then( onAjaxDone )
							.catch( onAjaxFail );

					promises.push( promise );
				}

				// Create promises for all libraryCards
				libraryCards.forEach( createPromise );

				/**
				 * @returns {Promise<LibraryCards[]>}
				 */
				function finalizeJob( result ) {
					return Promise.resolve( libraryCards );
				}

				return Promise.all( promises ).then( finalizeJob );
			}

			/**
			 * @param {LibraryCards[]} libraryCards
			 * @returns {Promise<Number>}
			 */
			function useNotifications( libraryCards ) {
				if ( CPK.verbose === true ) {
					console.info( "NotificationsController", ">", "initNotificationsForLibrary", ">", "useNotifications", libraryCards );
				}

				/**
				 * @type {HTMLElement}
				 */
				var currentParent;

				/**
				 * @param {Object} notification
				 */
				function processNotification( notification ) {
					if ( notification.clazz.match( /unread/ ) ) {
						unreadNotifsCount += 1;
					}

					try {
						currentParent.innerHTML +=
							"<div class'notif-" + notification.clazz + "'>" + notification.message + "</div>";
					} catch ( error ) {
						if ( CPK.verbose === true ) {
							console.error( "ProcessNotificationError", error );
						}
					}
				}

				/**
				 * @param {LibraryCard} card
				 */
				function processCardNotifications( card ) {
					var notifications = card.getNotifications();

					currentParent = document.getElementById( "notificationsListDiv_" + card.userName );
					console.log( "*", "*", "*", currentParent );

					hideLoader( document.getElementById( "notificationsListLoader_" + card.userName ) );

					if ( notifications.length <= 0 ) {
						try {
							var msg = VuFind.translate( "without_notifications" ),
								elm = document.getElementById( card.source );

							elm.innerHTML = "<div class='notif-default'>" + msg + "</div>";
						} catch ( error ) {
							if ( CPK.verbose === true ) {
								console.log( error );
							}
						}
					}

					notifications.forEach( processNotification );
				}

				// Process all notifications
				libraryCards.forEach( processCardNotifications );

				// Returns resolved promise with count of new notifications
				return Promise.resolve( unreadNotifsCount );
			}

			return Promise
				.resolve( getLibraryCards() )
				.then( getNotifications )
				.then( useNotifications )
				.then( unreadCountPromise )
				.then( warningIconPromise );
		}

		/**
		 * @private Used when notifications are initialized.
		 * @param {Number} unreadCount
		 * @returns {Promise<boolean>}
		 */
		function unreadCountPromise( unreadCount ) {
			if ( CPK.verbose === true ) {
				console.info( "NotificationsController", ">", "unreadCountPromise", unreadCount );
			}

			try {
				var currentCount = parseInt( domLinker.unread.textContent );
				domLinker.unread.textContent = currentCount + parseInt( unreadCount );

				return Promise.resolve( true );
			} catch ( error ) {
				if ( CPK.verbose === true ) {
					console.error( error );
				}

				return Promise.resolve( false );
			}
		}

		/**
		 * @private Used after `unreadCountPromise`.
		 * @param {boolean} result
		 * @returns {Promise<boolean>}
		 */
		function warningIconPromise( result ) {
			if ( CPK.verbose === true ) {
				console.info( "NotificationsController", ">", "warningIconPromise", result );
			}

			if ( result === true ) {
				CPK.notifications.showWarningIcon();
			} else {
				CPK.notifications.hideWarningIcon();
			}

			return Promise.resolve( true );
		}

		/**
		 * A notification has been clicked .. follow the href if any.
		 * @param {Object} notification
		 * @param {String} source
		 */
		function onNotificationClick(notification, source) {
			var clazz = notification.clazz,
				href  = notification.href,
				type  = notification.type;

			if (clazz.match(/unread/)) {
				--unreadNotifsCount;
				updateUnreadNotificationsCount();
				notification.clazz = clazz.replace(/[^\s]*unread/, "");
			}

			if (typeof href !== "undefined") {
				function followLocation() {
					if (source === "user") {
						window.location.url(href);
					} else {
						window.location.href = href;
					}
					/**
					 * @todo Finish this!!!
					 */
					window.$broadcast("notificationClicked");
				}

				var data = {
					notificationType: type,
					source: source
				};

				/**
				 * @todo Test if this working properly!!!
				 */
				jQuery.post("/AJAX/JSON?method=notificationRead", data).done(followLocation);
			}
		}

		/**
		 * Hides a loader for an institution. It hides a loader associated
		 * with portal notifications if no source provided.
		 * @param {HTMLElement} elm
		 */
		function hideLoader( elm ) {
			CPK.global.hideDOM( typeof source === "undefined" ? domLinker.loader : elm );
		}

		/**
		 * Shows up a previously hidden loader for an institution. It shows up
		 * a loader associated with portal notifications if no source provided.
		 * @param {HTMLElement} elm
		 */
		function showLoader( elm ) {
			CPK.global.showDOM( typeof elm === "undefined" ? domLinker.loader : elm );
		}

		/**
		 * Hides warning icon.
		 */
		function hideWarningIcon() {
			domLinker.icon.style.display = "none";
		}

		/**
		 * Shows warning icon by setting DOM element's style to nothing.
		 */
		function showWarningIcon() {
			domLinker.icon.style.display = "";// XXX inline-block
		}

		/**
		 * Hides up the global notification section.
		 */
		function hideGlobalNotifications() {
			CPK.global.hideDOM( domLinker.dropDown );
		}

		/**
		 * Shows up the global notification section.
		 */
		function showGlobalNotifications() {
			CPK.global.showDOM( domLinker.dropDown );
		}

		/**
		 * Checks if are there currently any global notifications.
		 * @returns {boolean}
		 */
		function hasGlobalNotifications() {
			throw new Error( "hasGlobalNotifications" );
			var hasSynchronousGlobalNotifications = domLinker.syncNotifs.children.length !== 0,
				hasApiNonrelevantNotifications    = typeof notificationsCache.noAPI.user === "object" && notificationsCache.noAPI.user.length !== 0;

			return hasSynchronousGlobalNotifications || hasApiNonrelevantNotifications;
		}

		// Public API
		var Controller = Object.create( null );
		// Properties
		Controller.notifications   = Object.create( null );
		Controller.LibraryCard     = LibraryCard;
		Controller.initialize      = initialize;
		Controller.hideWarningIcon = hideWarningIcon;
		Controller.showWarningIcon = showWarningIcon;
		Controller.hasGlobalNotifications  = hasGlobalNotifications;
		Controller.hideGlobalNotifications = hideGlobalNotifications;
		Controller.showGlobalNotifications = showGlobalNotifications;

		return Controller;
	}

	/**
	 * @type {NotificationsController}
	 */
	CPK.notifications = new NotificationsController();

}());