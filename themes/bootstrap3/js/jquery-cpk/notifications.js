/**
 * Notifications module.
 *
 * @author Jiří Kozlovský, original Angular solution
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 */

(function() {
	"use strict";

	/**
	 * Notifications controller.
	 * @constructor
	 * @returns {NotificationsController}
	 */
	function NotificationsController() {
		var hasNotifications    = false,
			notificationsCache  = Object.create( null );
		notificationsCache.user = Object.create( null );

		/**
		 * Holds array of linked HTML elements.
		 * @property {HTMLElement} dropDown
		 * @property {HTMLElement} dropDownUl
		 * @property {HTMLElement} listDiv
		 * @property {HTMLElement} syncNotifs
		 * @property {HTMLElement} loader
		 * @property {HTMLElement} icon
		 * @property {array} institutionListDivs
		 * @type {Object}
		 */
		var domLinker = Object.create( null );

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
		function init( event ) {
			return Promise
				.resolve( initDom() )
				.then( initNotifications );
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
				"dropDown", "dropDownUl", "listDiv", "syncNotifs", "loader", "icon"
			].forEach( checkElm );

			return Promise.resolve( result );
		}

		/**
		 * @private Initializes rest of all what's needed using parallel jobs.
		 * @param {boolean} result
		 * @returns {Promise<boolean>}
		 */
		function initNotifications( result ) {
			if ( result === false ) {
				return Promise.resolve( false );
			}

			// Jobs to execute
			var jobs = [ initNotificationsForUser, initNotificationsForLibrary ];

			/**
			 * @param {function} job
			 * @returns {Promise<boolean>}
			 */
			function executeJob( job ) {
				return Promise.resolve( job.call( this ) ).catch( catchExecuteJob );
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

			/**
			 * @returns {Promise<boolean>} Always resolved with TRUE.
			 */
			function finishAll() {
				return Promise.resolve( true );
			}

			// Execute all jobs (job = chain of promises)
			jobs.forEach( executeJob );

			// Resolve all promises
			return Promise.all( jobs ).then( finishAll );
		}

		/**
		 * @private Initializes notifications for current user.
		 * @returns {Promise<boolean>}
		 */
		function initNotificationsForUser() {

			/**
			 * @returns {Promise<array>}
			 */
			function getNotificationsPromise() {

				/**
				 * @param {Object} response
				 * @returns {Promise<array>}
				 */
				function onAjaxDone( response ) {
					if ( response.data.hasOwnProperty( "php_errors" ) ) {
						if ( CPK.verbose === true ) {
							console.log( response.data.php_errors );
						}

						return Promise.resolve( [] );
					}

					return Promise.resolve(
						( response.data.hasOwnProperty( "notifications" ) )
							? response.data.notifications
							: []
					);
				}

				// Query about notifications and resolve them
				return Promise
					.resolve( jQuery.get( "/AJAX/JSON?method=getMyNotificationsForUser", null, null, "json" ) )
					.then( onAjaxDone );
			}

			/**
			 * @param {array} notifications
			 * @returns {Promise<boolean>}
			 */
			function useNotificationsPromise( notifications ) {
				if ( ! ( notifications instanceof Array ) ) {
					return Promise.resolve( false );
				}

				hasNotifications = true;

				/**
				 * @param {Object} notification
				 */
				function processNotification( notification ) {
					try {
						// Create notification's <div>
						var div = document.createElement( "div" );
						div.setAttribute( "class", "notif-" + notification.clazz );
						div.setAttribute( "data-source", "user" );
						div.setAttribute( "data-clazz", notification.clazz );
						div.setAttribute( "data-href", notification.href );
						div.setAttribute( "data-type", notification.type );
						div.innerHTML = notification.message;
						div.addEventListener( "click", onNotificationClick, true );

						// And put it into <div id="notificationsListDiv">
						domLinker.listDiv.append( div );
					} catch ( error ) {
						if ( CPK.verbose === true ) {
							console.error( "ProcessNotificationError", error, notification );
						}
					}
				}

				// Process all notifications
				notifications.forEach( processNotification );

				// Cache notifications
				notificationsCache.user = notifications;

				// Resolve promise
				return Promise.resolve( true );
			}

			// Initialize notifications for user
			return Promise
				.resolve( getNotificationsPromise() )
				.then( useNotificationsPromise )
				.then( warningIconPromise );
		}

		/**
		 * @private Fetches notifications for source and username.
		 * @returns {Promise<boolean>}
		 */
		function initNotificationsForLibrary() {

			/**
			 * @returns {Promise<LibraryCard[]>}
			 */
			function getLibraryCards() {
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
				var promises = [];

				/**
				 * @param {LibraryCard} card
				 * @param {Number} index
				 */
				function createPromise( card, index ) {

					/**
					 * @param {Object} response
					 * @returns {Promise<array>}
					 */
					function onAjaxDone( response ) {

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

					var data = { cat_username: card.userName },
						opts = { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
						promise = Promise
							.resolve( jQuery.post( "/AJAX/JSON?method=getMyNotificationsForUserCard", data, opts, "json" ) )
							.then( onAjaxDone );

					promises.push( promise );
				}

				// Create promises for all libraryCards
				libraryCards.forEach( createPromise );

				/**
				 * @returns {Promise<LibraryCards[]>}
				 */
				function finishAll( /*result*/ ) {
					return Promise.resolve( libraryCards );
				}

				return Promise.all( promises ).then( finishAll );
			}

			/**
			 * @param {LibraryCards[]} libraryCards
			 * @returns {Promise<boolean>}
			 */
			function useNotifications( libraryCards ) {
				var currentParent,
				    currentCard;

				/**
				 * @param {Object} notification
				 */
				function processNotification( notification ) {
					try {
						// Create notification's <div>
						var div = document.createElement( "div" );
						div.setAttribute( "class", "notif-" + notification.clazz.replace( " notif-unread", "" ) );
						div.setAttribute( "data-source", currentCard.source );
						div.setAttribute( "data-clazz", notification.clazz );
						div.setAttribute( "data-href", notification.href );
						div.setAttribute( "data-type", notification.type );
						div.addEventListener( "click", onNotificationClick, true );
						div.innerHTML = notification.message;

						// And put it into `currentParent` <div>
						currentParent.append( div );
					} catch ( error ) {
						if ( CPK.verbose === true ) {
							console.error( "ProcessNotificationError", error, notification );
						}
					}
				}

				/**
				 * @param {LibraryCard} card
				 */
				function processCardNotifications( card ) {
					var notifications = card.getNotifications();

					// Sets currently processed card and getslink to parent element
					currentCard   = card;
					currentParent = document.getElementById( "notificationsListDiv_" + card.userName );

					// Hides loader
					hideLoader( document.getElementById( "notificationsListLoader_" + card.userName ) );

					// Show "No notifications" message
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
					} else {
						hasNotifications = true;
					}

					// Process all notifications
					notifications.forEach( processNotification );
				}

				// Process all notifications
				libraryCards.forEach( processCardNotifications );

				// Returns resolved promise with count of new notifications
				return Promise.resolve( true );
			}

			// Initialize notifications for library
			return Promise
				.resolve( getLibraryCards() )
				.then( getNotifications )
				.then( useNotifications )
				.then( warningIconPromise );
		}

		/**
		 * @private Shows warning icon if it should be visible.
		 * @param {boolean} result
		 * @returns {Promise<boolean>}
		 */
		function warningIconPromise( result ) {
			if ( result === true || hasNotifications === true ) {
				showIcon();
			} else {
				hideIcon();
			}

			return Promise.resolve( true );
		}

		/**
		 * @private Handles click on notification event.
		 * @param {Event} event
		 */
		function onNotificationClick( event ) {
			event.preventDefault();
			event.stopPropagation();

			try {
				// Collect all necessary data
				var targetElm   = event.target,
					source      = targetElm.getAttribute( "data-source" ),
					href        = targetElm.getAttribute( "data-href" );

				// There is no href attribute
				if ( typeof href === "undefined" || href.length === 0 ) {
					return;
				}

				// Redirect to see about what the notification is
				if ( source === "user" ) {
					window.location.url( href );
				} else {
					window.location.href = href;
				}
			} catch ( error ) {
				if ( CPK.verbose === true ) {
					console.log( error );
				}
			}
		}

		/**
		 * @private Hides a loader (for global notifications or for institution if `elm` is passed.
		 * @param {HTMLElement} elm (Optional.)
		 */
		function hideLoader( elm ) {
			CPK.global.hideDOM( typeof elm === "undefined" ? domLinker.loader : elm );
		}

		/**
		 * Hides warning icon.
		 */
		function hideIcon() {
			domLinker.icon.style.display = "none";
		}

		/**
		 * Shows warning icon by setting DOM element's style to nothing.
		 */
		function showIcon() {
			domLinker.icon.style.display = "";// XXX inline-block
		}

		// Public API
		var Controller = Object.create( null );
		// Properties
		Controller.notifications   = Object.create( null );
		Controller.LibraryCard     = LibraryCard;
		Controller.initialize      = init;
		Controller.hideWarningIcon = hideIcon;
		Controller.showWarningIcon = showIcon;

		return Controller;
	}

	/**
	 * @type {NotificationsController}
	 */
	CPK.notifications = new NotificationsController();

}());