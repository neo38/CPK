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
			var jobs = [ fetchNotificationsForUser/* TODO , fetchNotificationsForUserCard */];

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
				console.info( result === true
					? "Rest of NotificationsController was initialized."
					: "Rest of NotificationsController was not initialized." );
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
		 * @private Fetches notifications for current user asynchronously.
		 * @returns {Promise}
		 */
		function fetchNotificationsForUser() {
			if ( CPK.verbose === true ) {
				console.info( "NotificationsController->fetchNotificationsForUser" );
			}

			/**
			 * @returns {Promise<array>}
			 */
			function fetchNotificationsForUserPromise() {
				jQuery.get( "/AJAX/JSON?method=getMyNotificationsForUser", null, null, "json" )
					.done(function( response ) {
						if ( CPK.verbose === true ) {
							console.log( response );
						}

						return Promise.resolve(
							( response.data.notifications !== undefined )
								? response.data.notifications
								: []
						);
					})
					.fail(function( error ) {
						if ( CPK.verbose === true ) {
							console.error( "Request 'getMyNotificationsForUser' failed!", error );
						}

						return Promise.resolve( [] );
					});
			}

			return Promise
				.resolve( fetchNotificationsForUserPromise() )
				.then( useNotificationsForUser )
				.then( updateUnreadCount );
		}

		/**
		 * @private Use notifications for current user asynchronously.
		 * @param {Array} notifications
		 * @returns {Promise<Number>}
		 */
		function useNotificationsForUser( notifications ) {
			if ( CPK.verbose === true ) {
				console.info( "NotificationsController->useNotificationsForUser", notifications );
			}

			/**
			 * @returns {Promise<Number>}
			 */
			function useNotificationsForUserPromise() {
				if ( ! ( notifications instanceof Array ) ) {
					return Promise.resolve( 0 );
				}

				notifications.forEach(function( notification ) {
					if ( notification.clazz.match( /unread/ ) ) {
						unreadNotifsCount += 1;
					}
				});

				if ( typeof notificationsCache.noApi !== "object" ) {
					notificationsCache.noApi = Object.create( null );
				}

				notificationsCache.noApi.user = notifications;
				return Promise.resolve( unreadNotifsCount );
			}

			return Promise.resolve( useNotificationsForUserPromise() );
		}

		/**
		 * @private Updates count of unread notifications
		 * @param {Number} unreadCount
		 * @returns {Promise<boolean>}
		 */
		function updateUnreadCount( unreadCount ) {
			if ( CPK.verbose === true ) {
				console.info( "NotificationsController->updateUnreadCount", unreadCount );
			}

			try {
				domLinker.unread.textContent = unreadNotifsCount;
				showWarningIcon();

				return Promise.resolve( true );
			} catch ( error ) {
				if ( CPK.verbose === true ) {
					console.error( error );
				}

				return Promise.resolve( false );
			}
		}

		//========================================================================

		/**
		 * @private Fetches notifications for source and username.
		 * @param {String} source
		 * @param {String} username
		 * @returns Promise
		 */
		function fetchNotificationsForUserCard( source, username ) {
			if ( CPK.verbose === true ) {
				console.info( "NotificationsController->fetchNotificationsForUserCard", source, username );
			}

			/*var source = undefined,
				username = undefined;

			return Promise.resolve( fetchNotificationsForUserCard( source, username ) );*/

			return new Promise(function( resolve, reject ) {
				var data = { cat_username: username };

				jQuery.post( "/AJAX/JSON?method=getMyNotificationsForUserCard", data )
					.done(function( response ) {
						console.log( response );
						response = response.data.data;

						if ( typeof response.notifications !== "undefined" ) {
							resolve( response.notifications, source, username );

							if ( response.notifications.length === 0 ) {
								var msg = VuFind.translate( "without_notifications" );

								jQuery( "#" + response.source, "#notificationsList" ).append(
									"<div class='notif-default'>" + msg + "</div>"
								);
							}
						} else {
							resolve( response.notifications, source, username );
						}
					})
					.fail(function( error ) {
						reject( "XHR request failed!", error );
					});
			});
		}

		/**
		 * @param {Object} notifications
		 * @param {String} source
		 * @param {String} username
		 * @returns {Promise}
		 * @private
		 */
		function resolveFetchNotificationsForUserCard( notifications, source, username ) {
			if ( CPK.verbose === true ) {
				console.info( "NotificationsController->resolveFetchNotificationsForUserCard", notifications, source, username );
			}

			return Promise.resolve( useNotificationsForUserCard( notifications, source, username ) );
		}

		/**
		 * Process the notifications on user_card scale after we got them.
		 * @param {Array} notifications
		 * @param {String} source
		 * @param {String} username
		 * @returns {Promise}
		 */
		function useNotificationsForUserCard( notifications, source, username ) {
			if ( CPK.verbose === true ) {
				console.info( "NotificationsController->useNotificationsForUserCard", notifications, source, username );
			}

			return new Promise(function( resolve ) {
				if (!(notifications instanceof Array)) {
					resolve( false );
				}

				notificationsCache[ username ] = notifications;

				if ( notifications.length !== 0 ) {
					notifications.forEach(function( notification ) {
						if ( notification.clazz.match( /unread/ ) ) {
							unreadNotifsCount += 1;
						}
					});

					// XXX updateUnreadNotificationsCount();
					// XXX showWarningIcon();
				} else {
					CPK.global.hideDOM( institutionNotifLoaderHolder[ source + ".parent" ] );
				}

				hideLoader(source);

				resolve( true );
			});
		}

		/**
		 * @param {boolean} result
		 * @returns {Promise}
		 * @private
		 */
		function resolveUseNotificationsForUserCard( result ) {
			if ( CPK.verbose === true ) {
				console.info( "NotificationsController->resolveUseNotificationsForUserCard", result );
			}

			throw new Error( "Not implemented yet!" );
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
		 * @param {String} source
		 */
		function hideLoader( source ) {
			CPK.global.hideDOM( typeof source === "undefined"
				? domLinker.loader
				: institutionNotificationsLoaderHolder[source] );

			if ( hasGlobalNotifications() !== true ) {
				hideGlobalNotifications();
			}
		}

		/**
		 * Shows up a previously hidden loader for an institution. It shows up
		 * a loader associated with portal notifications if no source provided.
		 * @param {String} source
		 */
		function showLoader( source ) {
			CPK.global.showDOM( typeof source === "undefined"
				? domLinker.loader
				: institutionNotificationsLoaderHolder[source] );

			if ( hasGlobalNotifications() === true ) {
				showGlobalNotifications();
			}
		}

		/**
		 * Hides warning icon.
		 */
		function hideWarningIcon() {
			if ( unreadNotifsCount === 0 ) {
				globalNotifHolder.warningIcon.style.display = "none";
			}
		}

		/**
		 * Shows warning icon by setting DOM element's style to nothing.
		 * @todo Shouldn't be "block" instead of empty string?!
		 */
		function showWarningIcon() {
			if ( unreadNotifsCount > 0 ) {
				globalNotifHolder.warningIcon.style.display = "";
			}
		}

		/**
		 * Hides up the global notification section.
		 */
		function hideGlobalNotifications() {
			CPK.global.hideDOM( globalNotifHolder.parent );
		}

		/**
		 * Shows up the global notification section.
		 */
		function showGlobalNotifications() {
			CPK.global.showDOM( globalNotifHolder.parent );
		}

		/**
		 * Checks if are there currently any global notifications.
		 * @returns {boolean}
		 */
		function hasGlobalNotifications() {
			var hasSynchronousGlobalNotifications = domLinker.syncNotifs.children.length !== 0,
				hasApiNonrelevantNotifications    = typeof Controller.notifications.noAPI.user === "object" && Controller.notifications.noAPI.user.length !== 0;

			return hasSynchronousGlobalNotifications || hasApiNonrelevantNotifications;
		}

		/**
		 * Creates <div> with presentation of given notification.
		 * @param {Object} notification
		 * @returns {HTMLDivElement}
		 */
		function createNotificationDiv( notification ) {
			var div = document.createElement( "div" );

			div.classList.add( "notif-" + notification.clazz );
			div.appendChild( document.createTextNode( notification.message ) );

			return div;
		}

		// Public API
		var Controller = Object.create( null );
		// Properties
		Controller.notifications   = Object.create( null );
		// Init
		Controller.initialize      = initialize;
		// UI
		Controller.hideLoader      = hideLoader;
		Controller.showLoader      = showLoader;
		Controller.hideWarningIcon = hideWarningIcon;
		Controller.showWarningIcon = showWarningIcon;
		Controller.createNotificationDiv   = createNotificationDiv;
		// Global notifications
		Controller.hideGlobalNotifications = hideGlobalNotifications;
		Controller.showGlobalNotifications = showGlobalNotifications;
		Controller.hasGlobalNotifications  = hasGlobalNotifications;

		return Controller;
	}

	/**
	 * @type {NotificationsController}
	 */
	CPK.notifications = new NotificationsController();

}());