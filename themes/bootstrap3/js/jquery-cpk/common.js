/**
 * XXX Měli by jsme se uživatele zeptat zda chce ukládat citlivé údaje
 *     do paměti svého počítače - nejen cookies ale i localStorage
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
 *
 * @todo WE NEED TO USE JQUERY DEFERREDS INSTEAD OF NATIVE PROMISES (compatibility with IE and maybe we will be able to kick-off es6-promise.js; see links below)
 * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise#Browser_compatibility
 * @link http://jqfundamentals.com/chapter/ajax-deferreds
 *
 * @todo Remove most of `console.log` debug messages!
 */

/**
 * @property {Object} admin
 * @property {Object} favorites
 * @property {Object} global
 * @property {CheckedOutHistoryController} history
 * @property {Storage} localStorage
 * @property {FederativeLoginController} login
 * @property {NotificationsController} notifications
 * @property {CpkStorage} storage
 * @property {boolean} verbose
 * @constructor
 */
function Cpk() {
	"use strict";

	var self = this;

	/**
	 * @property {ApprovalController} ApprovalController
	 * @type {Object}
	 */
	this.admin = Object.create( null );

	/**
	 * @property {FavoritesNotifications} notifications
	 * @property {FavoritesStorage} storage
	 * @property {Favorite} Favorite
	 * @property {FavoritesBroadcaster} broadcaster
	 * @type {Object}
	 */
	this.favorites = Object.create( null );

	/**
	 * @type {Object}
	 * @todo Move this to `global.js` file!
	 */
	this.global = {
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
			elm.removeAttribute( "hidden" );
		},

		/**
		 * Sets "hidden" attribute for the given element.
		 * @param {HTMLElement} elm
		 */
		hideDOM: function globalHideDOM( elm ) {
			elm.setAttribute( "hidden", "hidden" );
		},

		/**
		 * Toggles "hidden" attribute on the given element.
		 * @param {HTMLElement} elm
		 */
		toggleDOM: function globalToggleDOM( elm ) {
			if ( elm.hasAttribute( "hidden" ) ) {
				self.global.hideDOM( elm );
			} else {
				self.global.showDOM( elm );
			}
		},

		/**
		 * Checks if given parameter is an element
		 * @param {HTMLElement} elm
		 */
		checkElm: function globalCheckElm( elm ) {
			try {
				if ( elm.nodeType !== 1 ) {
					return false;
				}
			} catch ( e ) {
				return false;
			}

			return true;
		},

		/**
		 * @type {GlobalController} controller
		 */
		controller: undefined
	};

	/**
	 * @type {Storage}
	 */
	this.localStorage = Object.create( null );

	/**
	 * Should be jquery-cpk package executed in verbose mode?
	 * @type {Boolean}
	 */
	this.verbose = true;
}



// Define CPK
if ( typeof CPK === "undefined" )
    /**
     * @type {Cpk}
     */
    var CPK = new Cpk();



// Main document.onReady handler
jQuery(function onDocumentReady() {
	"use strict";

	/**
	 * @private Shows modal for terms of use if needed.
	 * @returns {Promise<boolean>}
	 */
	function initializeTermsOfUseModal() {

		/**
		 * @returns {Promise<boolean>}
		 */
		function termsOfUseModalPromise() {
			try {
				var elm = document.getElementById( "termsOfUseModal" );

				if ( elm.nodeType === 1 ) {
					jQuery( elm ).modal( "show" ).unbind( "click" );
				}
			} catch ( error ) {
				// We don't care about errors raised here.
			}

			return Promise.resolve( true );
		}

		return Promise.resolve( termsOfUseModalPromise() );
	}

	/**
	 * @private Initializes `CPK.localStorage`.
	 * @returns {Promise<FakeStorage|Storage|boolean>}
	 */
	function initializeLocalStorage() {
		return Promise.resolve( CPK.storage.initStorage( "localStorage" ) );
	}

	/**
	 * @private Resolves initialization of the `CPK.localStorage`.
	 * @param {FakeStorage|Storage|boolean} result
	 * @returns {Promise}
	 */
	function resolveInitializeLocalStorage( result ) {
		if ( result === true ) {
			return Promise.resolve( true );
		} else if ( CPK.storage.isStorage( result ) === true ) {
			if ( CPK.verbose === true ) {
				console.info( "`CPK.localStorage` was successfully initialized!" );
			}

			CPK.localStorage = result;

			return Promise.resolve( true );
		} else {
			return Promise.resolve( CPK.storage.initStorage( "fakeStorage" ) );
		}
	}

	/**
	 * @private Initializes other jquery-cpk modules.
	 * @returns {Promise<boolean>}
	 */
	function initializeOtherModules() {

		/**
		 * @param {function} job Function that returns Promise and takes no parameters.
		 * @return {Promise<boolean>}
		 */
		function initJob( job ) {
			return Promise.resolve( job.call() ).then( catchInitJob );
		}

		/**
		 * @returns {Promise<boolean>}
		 */
		function catchInitJob( error ) {
			if ( CPK.verbose === true ) {
				console.error( error );
			}

			return Promise.resolve( false );
		}

		// Here are listed all others that need init too.
		[
			CPK.login.initialize,
			CPK.notifications.initialize,
			CPK.history.initialize,
			CPK.favorites.broadcaster.initialize,
			CPK.global.controller.initialize,
			CPK.admin.ApprovalController.initialize,
			initializeTermsOfUseModal
		].forEach( initJob );
	}

	// Initialize application
	initializeLocalStorage() // If initialization of `CPK.localStorage` with
		.then( resolveInitializeLocalStorage ) // "localStorage" type failed
		.then( resolveInitializeLocalStorage ) // we need initialize it again.
		.then( initializeOtherModules );
});