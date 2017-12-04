/**
 * XXX Měli by jsme se uživatele zeptat zda chce ukládat citlivé údaje
 *     do paměti svého počítače - nejen cookies ale i localStorage
 *
 * XXX Základní "FakeStorage" by měla být na základě `cookies` -> ale je to špaténka...
 *
 * XXX Musíme si rozmyslet, jak udělat testy pro JavaScript!
 *
 *
 *
 *
 * jQuery-based replacement for original Angular-based ng-cpk module.
 *
 * Application self is split into several modules:
 *
 * Favorites
 * =========
 *
 * CPK.favorites.Favorite        Object representing single favorite.
 * CPK.favorites.available       Available (possible) favorites on the current page.
 * CPK.favorites.notifications   Notifications for favorites.
 * CPK.favorites.storage         Storage for favorites.
 * CPK.favorites.broadcaster     Broadcaster for favorites service.
 *
 * Admin
 * =====
 *
 * CPK.admin.ApprovalController  Controller for configuration approval page.
 *
 * Notifications
 * =============
 *
 * CPK.notifications             Controller for notifications.
 *
 * History
 * =======
 *
 * CPK.history                   Controller for handling history of checked-out items.
 *
 * There is also special property "CPK.verbose" which if set on TRUE makes
 * scripts to print devel/debug messages.
 *
 * @author Jiří Kozlovský, original Angular solution
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 *
 * @todo We need to replace all that ng-linker shit and replace it by jQuery-based solution!
 * @todo Would be great to make tests :)
 * @todo Move all shared methods to "CPK.global"!
 * @todo Check code styling in all files of this module.
 * @todo Go through all TODOs and either fix them or remove.
 * @todo All code must be commented.
 * @todo We should also check help (for example here: https://cpk-front.mzk.cz/Portal/Page/napoveda#1.2)
 * @todo Reformat changed PHTML templates! --> all JS/PHTML files produced for this task should follow coding styles!
 * @todo Move comments above (about jquery-cpk) to the standalone README.md file
 *
 * @todo Notifications, "Add/Remove Favorite" and "Federative login" should be implemented as jQuery/jQuery UI/Bootstrap widgets (but in un-obstructive way)...
 */

if ( typeof CPK === "undefined" ) {
    /**
     * @type {Object}
     */
    var CPK = Object.create( null );
}

/**
 * Should be jquery-cpk package executed in verbose mode?
 * @type {Boolean}
 */
CPK.verbose = true;

/**
 * Holds instance of local storage (either window.localStorage or FakeStorage).
 * @type {Object}
 */
CPK.localStorage = Object.create( null );

/**
 * @type {Object}
 */
CPK.favorites = Object.create( null );

/**
 * @type {Object}
 */
CPK.admin = Object.create( null );

/**
 * @type {Object}
 */
CPK.global = {
	/**
	 * TRUE if notifications are available.
	 * @type {boolean}
	 * @deprecated
	 * @todo Remove this!
	 */
	areNotificationsAvailable: false,

	/**
	 * Removes "hidden" attribute from the given element.
	 * @param {HTMLElement} elm
	 */
	showDOM: function globalShowDOM( elm ) {
		"use strict";
		elm.removeAttribute( "hidden" );
	},

	/**
	 * Sets "hidden" attribute for the given element.
	 * @param {HTMLElement} elm
	 */
	hideDOM: function globalHideDOM( elm ) {
		"use strict";
		elm.setAttribute( "hidden", "hidden" );
	},

	/**
	 * Toggles "hidden" attribute on the given element.
	 * @param {HTMLElement} elm
	 */
	toggleDOM: function globalToggleDOM( elm ) {
		"use strict";
		if ( elm.hasAttribute( "hidden" ) ) {
			CPK.global.hideDOM( elm );
		} else {
			CPK.global.showDOM( elm );
		}
	},

	/**
	 * @type {GlobalController} controller
	 */
	controller: undefined
};


/**
 * @todo This should be the only document.onReady handler.
 */
jQuery( document ).ready(function() {
	"use strict";

	// Initialize storage
	CPK.storage.initStorage( "localStorage" )
		.then(function( result ) {
			if ( CPK.storage.isStorage( result ) !== true ) {
				return Promise.reject( "Not an instance of storage was returned!" );
			}

			CPK.localStorage = result;

			if ( CPK.verbose === true ) {
				console.info( "Storage was initialized.", result );
			}
		}).
		catch(function( error ) {
			if ( CPK.verbose === true ) {
				console.error( "Initialization of CPK.localStorage failed!", error );
			}
		});

	// Initialize login
	setTimeout(function() {
		CPK.login.initialize()
			.then(function( result ) {
				if ( CPK.verbose === true ) {
					console.info( "Login service was initialized.", result );
				}
			})
			.catch(function( error ) {
				if ( CPK.verbose === true ) {
					console.error( "Initialization of the login service was rejected.", error );
				}
			});
	});

	// Initialize notifications
	setTimeout(function() {
		CPK.notifications.initialize()
			.then(function( result ) {
				CPK.global.areNotificationsAvailable = ( result === true );

				if ( CPK.verbose === true ) {
					console.info( "Notifications were initialized.", result );
				}
			})
			.catch(function( error ) {
				if ( CPK.verbose === true ) {
					console.error( "Initialization of notifications was rejected.", error );
				}
			});
	});

	// Initialize history


	// Initialize favorites broadcaster
	setTimeout(function() {
		CPK.favorites.broadcaster.initialize()
			.then(function( result ) {
				if ( CPK.verbose === true ) {
					console.info( "Favorites broadcaster was initialized.", result );
				}
			})
			.catch(function( error ) {
				if ( CPK.verbose === true ) {
					console.error( "Initialization of favorites broadcaster was rejected.", error );
				}
			});
	});

	// Initialize global controller
	/**
	 * @type {Object} jQueryModal
	 */
	var jQueryModal = undefined;

	/**
	 * Global controller
	 * @todo Find what is injected `$location` object!
	 * @todo Initialize requested modal!
	 */
	function GlobalController() {
		// We need to initialize requested modal
		var currentUrl = new URL( document.location );

		if ( currentUrl.hasOwnProperty( "searchParams" ) ) {
			// This is for modern browsers
			var viewModal = currentUrl.searchParams.get( "viewModal" );
		} else {
			// This is for older browsers
			var params = currentUrl.search;
		}


		//if ( typeof vm.getParams['viewModal'] !== 'undefined' ) {
		//	viewModal( vm.getParams['viewModal'] );
		//}
		//$rootScope.$on( 'notificationClicked', notificationClicked );

		/**
		 * Handles click on notification.
		 */
		function notificationClicked() {
			var oldModal = CPK.global.controller.getParams[ 'viewModal' ];

			vm.getParams = $location.search();

			if (typeof vm.getParams['viewModal'] !== 'undefined') {

				viewModal(vm.getParams['viewModal'], $log, $http);
			}
		}

		/*
		 * Private
		 */

		/**
		 * @param {string} portalPageId
		 * @private Shows modal (with `portalPageId`).
		 * @returns {Promise}
		 * @todo Finish this!
		 */
		function viewModal( portalPageId ) {
			/**
			 * @returns {Promise}
			 */
			var handleShowModal = function() {
				return new Promise(function( resolve, reject ) {
					// TODO Before this starts with `onLinkedModal( 'global', showTheModal );`

					// TODO var header = linkedObjects.modal.global.header;
					// TODO var body = linkedObjects.modal.global.body;

					jQuery.get( "/AJAX/JSON?method=getPortalPage&prettyUrl=" + portalPageId )
						.done(function( response ) {
							var portalPage = response.data.data;

							// TODO header.textContent = portalPage.title;
							// TODO body.innerHTML = portalPage.content;
						})
						.fail(function( error ) {
							if ( CPK.verbose === true ) {
								console.error( error );
							}
						});

					resolve( true );
				});
			};

			return Promise
				.resolve( handleShowModal() )
				.then(function( /*result*/ ) { modal( true ); });
		}

		/**
		 * @param {boolean} show
		 * @returns {Object}
		 */
		function modal( show ) {
			if ( typeof jQueryModal === "undefined" ) {
				jQueryModal = jQuery( document.getElementById( "#modal" ) );
			}

			if ( show === true ) {
				jQueryModal.modal( "show" );
			} else {
				jQueryModal.modal( "hide" );
			}

			return jQueryModal;
		}

		// TODO Controller.getParams = $location.search();

		// Public API
		var Controller       = Object.create( null );
		Controller.getParams = [];
		return Controller;
	}

	/**
	 * @type {GlobalController}
	 */
	CPK.global.controller = new GlobalController();

	// Show modal for terms of use
	jQuery( document.getElementById( "#termsOfUseModal" ) )
		.modal( "show" )
		.unbind( "click" );

})();