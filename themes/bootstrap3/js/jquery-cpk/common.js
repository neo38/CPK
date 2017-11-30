/**
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
 * @todo Replace using of "Promise" by using "jQuery.Deferred().promise()".
 * @todo When no "Promise" will be used we can move out "es6-promise.min.js" (loaded in layout.phtml).
 * @todo We need to replace all that ng-linker shit and replace it by jQuery-based solution!
 * @todo Would be great to make tests :)
 * @todo Use "CPK.verbose" across all scripts!
 * @todo Move all shared methods to "CPK.global"!
 * @todo Check code styling in all files of this module.
 * @todo Go through all TODOs and either fix them or remove.
 * @todo All code must be commented.
 * @todo We should also check help (for example here: https://cpk-front.mzk.cz/Portal/Page/napoveda#1.2)
 * @todo File "jquery-cpk/admin.js" load only conditionally.
 * @todo Reformat changed PHTML templates! --> all JS/PHTML files produced for this task should follow coding styles!
 * @todo Move comments above (about jquery-cpk) to the standalone README.md file
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
	 */
	areNotificationsAvailable: false,

	/**
	 * TRUE if CPK.localStorage is available.
	 */
	isStorageAvailable: false,

	/**
	 * Removes "hidden" attribute from the given element.
	 * @param {HTMLElement} elm
	 */
	showDOM: function( elm ) {
		"use strict";
		elm.removeAttribute( "hidden" );
	},

	/**
	 * Sets "hidden" attribute for the given element.
	 * @param {HTMLElement} elm
	 */
	hideDOM: function( elm ) {
		"use strict";
		elm.setAttribute( "hidden", "hidden" );
	},

	/**
	 * Toggles "hidden" attribute on the given element.
	 * @param {HTMLElement} elm
	 */
	toggleDOM: function( elm ) {
		"use strict";
		if ( elm.hasAttribute( "hidden" ) ) {
			CPK.global.hideDOM( elm );
		} else {
			CPK.global.showDOM( elm );
		}
	},

	controller: undefined
};

// This is here because of unhandled rejected promises (if there are any).
window.addEventListener("unhandledrejection", ( event ) => {
	// The event object has two special properties: "promise" and "reason".
	if ( CPK.verbose === true ) {
		console.error( event );
	}

	//...
});

/**
 * @todo This should be the only document.onReady handler.
 */
jQuery(document).ready(function(e) {
	"use strict";

	// Initialize storage
	CPK.storage.initStorage()
		.then(function( result ) {
			if ( CPK.storage.isStorage( result ) !== true ) {
				return Promise.reject( "Not an instance of storage was returned!" );
			}

			CPK.localStorage = result;
			CPK.global.isStorageAvailable = true;

			if ( CPK.verbose === true ) {
				console.info( "Storage was initialized.", result );
			}
		}).
		catch(function( error ) {
			if ( CPK.verbose === true) {
				console.error( "Initialization of CPK.localStorage failed!", error );
			}

			CPK.global.isStorageAvailable = false;
		});

	// Initialize login
	setTimeout(() => {
		CPK.login.initialize( e )
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
	setTimeout(() => {
		CPK.notifications.initialize( e )
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

	// Initialize favorites
	/*setTimeout(() => {
		//...
	});*/
});


(function($) {
    //angular.module('cpk').controller('GlobalController', GlobalController).directive('ngModal', ngModal);
    //GlobalController.$inject = [ 'favsBroadcaster', '$rootScope', '$location', '$log', '$http' ];

    var linkedObjects = {
        modal : {
            global : {
                body : undefined,
                header : undefined
            }
        }
    };

    var linkerCache = {
        modal : {}
    };

    var jQueryModal = undefined;

    /**
     * Initialize injected favsBroadcaster & show requested modal
     */
    function GlobalController(favsBroadcaster, $rootScope, $location, $log, $http) {

        var vm = this;

        vm.getParams = $location.search();

        if (typeof vm.getParams['viewModal'] !== 'undefined') {

            viewModal(vm.getParams['viewModal']);
        }

        $rootScope.$on('notificationClicked', notificationClicked);

        return vm;

        /**
         * Handle click on notification
         */
        function notificationClicked() {
            var oldModal = vm.getParams['viewModal'];

            vm.getParams = $location.search();

            if (typeof vm.getParams['viewModal'] !== 'undefined') {

                viewModal(vm.getParams['viewModal'], $log, $http);
            }
        }

        /*
         * Private
         */

        function viewModal(portalPageId) {

            onLinkedModal('global', showTheModal);

            function showTheModal() {

                new Promise(function() {
                    modal(true);
                });

                var header = linkedObjects.modal.global.header;
                var body = linkedObjects.modal.global.body;

                $http.get('/AJAX/JSON?method=getPortalPage&prettyUrl=' + portalPageId).then(function(dataOnSuccess) {
                    var portalPage = dataOnSuccess.data.data;

                    header.textContent = portalPage.title;
                    body.innerHTML = portalPage.content;

                }, function(dataOnError) {
                    $log.error(dataOnError);
                });

            }
        }

        function modal(show) {
            if (typeof jQueryModal === 'undefined') {
                jQueryModal = $('#modal');
            }

            if (typeof show === 'boolean' && show)
                jQueryModal.modal('show');
            else
                jQueryModal.modal('hide');

            return jQueryModal;
        }
    }

    function ngModal() {
        return {
            restrict : 'A',
            link : linker
        };

        function linker(scope, elements, attrs) {

            // IE 11 :(
            var modalAttr = attrs.ngModal.split('.');

            var modalId = modalAttr[0];
            var modalPart = modalAttr[1];

            if (typeof linkedObjects.modal[modalId] === 'undefined')
                linkedObjects.modal[modalId] = {};

            linkedObjects.modal[modalId][modalPart] = elements.context;

            onLinkedModal(modalId, modalPart);
        }
    }

    /**
     * Handles calling the callback function appropriate to a modalId after are
     * linked all the necessary modal attributes.
     *
     * The callback must be set by onLinkedModal(modalId, callback)
     */
    function onLinkedModal(modalId, what) {
        if (typeof linkerCache.modal[modalId] === 'undefined') {
            linkerCache.modal[modalId] = {};
        }

        if (typeof what === 'function') {
            // Process the function as input
            var linkerDone = linkerCache.modal[modalId].linkerDone;

            if (typeof linkerDone === 'boolean' && linkerDone) {
                what.call();
            } else {
                linkerCache.modal[modalId].callback = what;
            }

        } else {
            // Now the linker linked something

            var callIt = true;

            var modalAttributes = Object.keys(linkedObjects.modal[modalId]);
            var modalAttributesLength = modalAttributes.length;

            for (var i = 0; i < modalAttributesLength; ++i) {

                var key = modalAttributes[i];

                if (typeof linkedObjects.modal[modalId][key] === 'undefined') {
                    callIt = false;
                    break;
                }
            }

            if (callIt) {

                linkerCache.modal[modalId].linkerDone = true;

                if (typeof linkerCache.modal[modalId].callback === 'function') {
                    linkerCache.modal[modalId].callback.call();
                }
            }

        }
    }

})(jQuery);