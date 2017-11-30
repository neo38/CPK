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
	 * Holds DOM elements of global notifications section
	 * @type {Object}
	 * @see themes/bootstrap3/templates/notifications.phtml
	 */
	var globalNotifHolder = {
		loader: undefined,
		parent: undefined,
		synchronousNotifications: undefined,
		warningIcon: undefined,
		unreadNotifsCount: undefined
	};

	/**
	 * Holds DOM elements of "Loading..." for each institution user
	 * is connected with.
	 * @type {Object}
	 */
	var institutionNotifLoaderHolder = Object.create( null );

	/**
	 * Notifications controller.
	 * @constructor
	 * @returns {NotificationsController}
	 */
	function NotificationsController() {
		var apiNonrelevantJobDoneFlag = false,
			onApiNonrelevantJobDone,
			unreadNotifsCount = 0,
			notificationsCache = Object.create( null );

		/**
		 * Initializes notifications (just like linkers before for Angular app).
		 * @param {Event} event
		 * @return {Promise}
		 */
		function initialize( event ) {
			return Promise
				.resolve( initGlobalNotificationsHolder() )
				.then( resolveInitGlobalNotificationsHolder )
				.then( resolveFetchNotificationsForUser )
				.then( resolveUseNotificationsForUser )
				.then( resolveUpdateUnreadCount )
				.then( resolveFetchNotificationsForUserCard )
				.then( resolveUseNotificationsForUserCard )
				//.then( resolveUpdateUnreadCount )
				.then(function( result ) {
					if ( CPK.verbose === true ) {
						console.log( result );
					}

					// XXX apiNonrelevantJobDone();

					return Promise.resolve( true );
				});
		}

		/**
		 * Initializes {@see globalNotifHolder}.
		 * @returns {Promise}
		 */
		function initGlobalNotificationsHolder() {
			if ( CPK.verbose === true ) {
				console.info( "NotificationsController->initGlobalNotificationsHolder" );
			}

			return new Promise(function( resolve, reject ) {
				// If elements for `globalNotifHolder` are not found it means
				// that there is no logged user...

				// Initialize "globalNotifHolder"
				globalNotifHolder.loader = document.getElementById( "notif_loader" );
				globalNotifHolder.parent = document.getElementById( "notificationsList" );

				if (globalNotifHolder.parent !== null) {
					globalNotifHolder.parent = globalNotifHolder.parent.getElementsByTagName( "li" ).item( 0 );
				}

				globalNotifHolder.synchronousNotifications = document.getElementById( "notif_synchronous_notifications" );
				globalNotifHolder.warningIcon = document.getElementById( "notif_icon" );
				globalNotifHolder.unreadNotifsCount = document.getElementById( "notif_unread_count" );

				// Check if DOM bindings are initialized
				var res = true;
				Object.getOwnPropertyNames( globalNotifHolder ).forEach(function( prop ) {
					if ( globalNotifHolder[prop] !== null ) {
						if ( globalNotifHolder[prop].nodeType !== 1 ) {
							res = false;
						}
					}
				});

				if ( res !== true ) {
					if ( CPK.verbose === true ) {
						console.log( "globalNotifHolder is not loaded -> probably no user is logged in..." );
					}

					reject( false );
				} else {
					resolve( true );
				}

				// Initialize API non relevant notifications for user card (initApiNonrelevantNotifications)
				//initApiNonrelevantNotifications();


				// 6) Initialize API relevant notifications for user card (initApiRelevantNotificationsForUserCard)
				// 7) Attach handler for "notifCtrl.notifClicked(notification,"user")"
				// 8) Attach handler for "notifCtrl.notifClicked(notification,"<?=$source ?>")"

				// If everything is OK we can now check how to set up the UI
				/*if (!hasGlobalNotifications()) {
					if (apiNonrelevantJobDoneFlag) {
						hideGlobalNotifications();
					} else {
						onApiNonrelevantJobDone()
					}
				} else {
					showWarningIcon();
				}*/
			});
		}

		/**
		 * @param {boolean} result
		 * @returns {Promise}
		 * @private
		 */
		function resolveInitGlobalNotificationsHolder( result ) {
			if ( CPK.verbose === true ) {
				console.info( "NotificationsController->resolveInitGlobalNotificationsHolder", result );
			}

			return Promise.resolve( fetchNotificationsForUser() );
		}

		/**
		 * @private Fetches notifications for current user asynchronously.
		 * @returns {Promise}
		 */
		function fetchNotificationsForUser() {
			if ( CPK.verbose === true ) {
				console.info( "NotificationsController->fetchNotificationsForUser" );
			}

			return new Promise(function( resolve, reject ) {
				jQuery.get( "/AJAX/JSON?method=getMyNotificationsForUser", null, null, "json" )
					.done(function( response ) {
						if ( CPK.verbose === true ) {
							console.log( response );
						}

						resolve( response.data.notifications !== undefined
							? response.data.notifications
							: [] );
					})
					.fail(function( e ) {
						reject( e );
					});
			});
		}

		/**
		 * @param {Array} notifications
		 * @returns {Promise}
		 * @private
		 */
		function resolveFetchNotificationsForUser( notifications ) {
			if ( CPK.verbose === true ) {
				console.info( "NotificationsController->resolveFetchNotificationsForUser", notifications );
			}

			return Promise.resolve( useNotificationsForUser( notifications ) );
		}

		/**
		 * @private Use notifications for current user asynchronously.
		 * @param {Array} notifications
		 * @returns {Promise}
		 */
		function useNotificationsForUser( notifications ) {
			if ( CPK.verbose === true ) {
				console.info( "NotificationsController->useNotificationsForUser", notifications );
			}

			return new Promise(function( resolve ) {
				if ( ! ( notifications instanceof Array ) ) {
					resolve( [] );
				}

				notifications.forEach(notification => {
					if ( notification.clazz.match( /unread/ ) ) {
						unreadNotifsCount += 1;
					}
				});

				if ( typeof notificationsCache.noApi !== "object" ) {
					notificationsCache.noApi = Object.create( null );
				}

				notificationsCache.noApi.user = notifications;
				resolve( unreadNotifsCount );
			});
		}

		/**
		 * @param {Number} unreadCount
		 * @returns {Promise}
		 * @private
		 */
		function resolveUseNotificationsForUser( unreadCount ) {
			if ( CPK.verbose === true ) {
				console.info( "NotificationsController->resolveUseNotificationsForUser", unreadCount );
			}

			return Promise.resolve( updateUnreadCount( unreadCount ) );
		}

		/**
		 * @private Updates count of unread notifications
		 * @param {Number} unreadCount
		 * @returns {Promise}
		 */
		function updateUnreadCount( unreadCount ) {
			if ( CPK.verbose === true ) {
				console.info( "NotificationsController->updateUnreadCount", unreadCount );
			}

			return new Promise(function( resolve ) {
				globalNotifHolder.unreadNotifsCount.textContent = parseInt( unreadNotifsCount );

				showWarningIcon();
				resolve( true );
			});
		}

		/**
		 * @param {boolean} result
		 * @returns {Promise}
		 * @private
		 * @todo Get "source" and "username"!
		 */
		function resolveUpdateUnreadCount( result ) {
			if ( CPK.verbose === true ) {
				console.info( "NotificationsController->resolveUpdateUnreadCount", result );
			}

			var source = undefined,
				username = undefined;

			return Promise.resolve( fetchNotificationsForUserCard( source, username ) );
		}

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

		// Private

		/**
		 * Hides a loader for an institution. It hides a loader associated
		 * with portal notifications if no source provided.
		 * @param {String} source
		 */
		function hideLoader( source ) {
			CPK.global.hideDOM( typeof source === "undefined"
				? globalNotifHolder.loader
				: institutionNotifLoaderHolder[source] );

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
				? globalNotifHolder.loader
				: institutionNotifLoaderHolder[source] );

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
			var hasSynchronousGlobalNotifications = globalNotifHolder.synchronousNotifications.children.length !== 0,
				hasApiNonrelevantNotifications = typeof vm.notifications.noAPI.user === "object" && vm.notifications.noAPI.user.length !== 0;

			return hasSynchronousGlobalNotifications || hasApiNonrelevantNotifications;
		}

		/**
		 * Called when API non-relevant job is done.
		 */
		function apiNonrelevantJobDone() {
			apiNonrelevantJobDoneFlag = true;

			if ( typeof onApiNonrelevantJobDone === "function" ) {
				onApiNonrelevantJobDone.call();
			}
		}

		/**
		 * @private Creates <div> with presentation of given notification.
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
		var Notifications = Object.create( null );
		Notifications.notifications = {};
		// Note (ondrejd): I think we don't need to expose those but I will
		// delete it later... in fact at the end we should have only one
		// public method - "onReady" called from initialization part of
		// file "common.js".
		//Notifications.initApiRelevantNotificationsForUserCard = initApiRelevantNotificationsForUserCard;
		//Notifications.initApiNonrelevantNotifications = initApiNonrelevantNotifications;
		Notifications.initialize = initialize;
		Notifications.hideWarningIcon = hideWarningIcon;
		Notifications.showWarningIcon = showWarningIcon;
		Notifications.onNotificationClick = onNotificationClick;

		return Notifications;
	}

	/**
	 * @type {NotificationsController}
	 */
	CPK.notifications = new NotificationsController();

}());