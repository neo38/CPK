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
 * @todo In code are used promises (regular "Promise" object) - would be better use pure jQuery solution!
 * @todo We need to replace all that ng-linker shit and replace it by jQuery-based solution!
 * @todo Would be great to make tests :)
 * @todo Use "CPK.verbose" across all scripts!
 * @todo Move all shared methods to "CPK.global"!
 * @todo Check code styling in all files of this module.
 * @todo Go through all TODOs and either fix them or remove.
 * @todo All code must be commented.
 * @todo We should also check help (for example here: https://cpk-front.mzk.cz/Portal/Page/napoveda#1.2)
 */

if (typeof CPK === "undefined")
    /**
     * @type {Object}
     */
    var CPK = {};

/**
 * Should be jquery-cpk package executed in verbose mode?
 * @type {boolean}
 */
CPK.verbose = true;

/**
 * @type {Object}
 */
CPK.favorites = {};

/**
 * @type {Object}
 */
CPK.admin = {};

/**
 * @type {Object}
 */
CPK.global = {

    /**
     * Removes "hidden" attribute from the given element.
     * @param {Element} elm
     */
    showDOM: function(elm) {
        dom.removeAttribute("hidden");
    },

    /**
     * Sets "hidden" attribute for the given element.
     * @param {Element} elm
     */
    hideDOM: function(elm) {
        dom.setAttribute("hidden", "hidden");
    }




    angular.module('cpk').controller('GlobalController', GlobalController).directive('ngModal', ngModal);

    GlobalController.$inject = [ 'favsBroadcaster', '$rootScope', '$location', '$log', '$http' ];

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
     * linked all the neccessarry modal attributes.
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

};