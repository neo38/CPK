/**
 * New implementation of "federative login".
 *
 * Uses localStorage to store information about last used identity providers.
 *
 * @author Jiří Kozlovský, original Angular solution
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 */

(function($) {
    if (CPK.verbose === true) {
        console.log("jquery-cpk/federative-login.js");
    }

    var DOMHolder = {
        lastUsed : undefined
    };

    /**
     * Federative login controller
     * @returns {Object}
     */
    function FederativeLoginController() {
        var lastIdpsTag = "__luidps",
            lastIdps = [],
            initializedLastIdps = false,
            helperHidden = true;

        var vm = this;

        vm.login = login;
        vm.hasLastIdps = hasLastIdps;
        vm.getLastIdps = getLastIdps;
        vm.showHelpContent = showHelpContent;

        return vm;

        // Public

        /**
         * Performs login operation.
         * @param {Object|String} identityProvider
         */
        function login(identityProvider) {
            if (typeof identityProvider === "string") {
                identityProvider = JSON.parse(identityProvider);
            }

            if (!identityProvider.isConsolidation) {
                getLastIdps();

                // IE 11 :(
                var lastIdpsLength = lastIdps.length;

                // If saved already, just push it in front
                for (var i = 0; i < lastIdpsLength; ++i) {
                    var lastIdp = lastIdps[i];

                    if (lastIdp.name === identityProvider.name) {
                        // Remove yourself
                        lastIdps.splice(i, 1);
                        break;
                    }
                }

                // Set as first
                lastIdps.unshift(identityProvider);

                // Maximally we will have 3 institutions
                if (lastIdps.length > 3) {
                    lastIdps.pop();
                }

                var source = JSON.stringify(lastIdps);
                localStorage.setItem(lastIdpsTag, source);
            }

            if (identityProvider.warn_msg) {
                alert(VuFind.translate("warning_safety_login"));
            }

            window.location.replace(identityProvider.href);
        }

        /**
         * Check if there is any last identity provider.
         * @returns {Boolean}
         */
        function hasLastIdps() {
            getLastIdps();

            return lastIdps !== null && lastIdps instanceof Array && lastIdps.length !== 0;
        }

        /**
         * Returns the last identity provider.
         * @returns {Array}
         */
        function getLastIdps() {
            if (initializedLastIdps === false) {
                initializeLastIdps();
            }

            return lastIdps;
        }

        /**
         * Shows login help.
         */
        function showHelpContent() {
            if (helperHidden) {
                CPK.global.showDOM(DOMHolder.helpContent);
            } else {
                CPK.global.hideDOM(DOMHolder.helpContent);
            }

            helperHidden = !helperHidden;
        }

        // Private

        /**
         * Initializes the last identity provider.
         */
        function initializeLastIdps() {
            lastIdps = localStorage.getItem(lastIdpsTag);

            if (lastIdps === null) {
                lastIdps = [];
            } else {
                try {
                    lastIdps = JSON.parse(lastIdps);
                } catch (e) {
                    if (CPK.verbose === true) {
                        console.error("Could not parse the last identity provider from localStorage", e);
                    }
                    lastIdps = [];
                }

                // Setup default language
                var lang = document.body.parentNode.getAttribute("lang"),
                    newTarget = location.pathname + location.search;

                newTarget += (newTarget.indexOf("?") >= 0 ? "&" : "?") + "auth_method=Shibboleth";

                lastIdps.forEach(function(lastIdp) {
                    lastIdp.name = lastIdp["name_" + lang];
                    lastIdp.href = lastIdp.href.replace(/target=[^&]*/, "target=" + encodeURIComponent(newTarget));
                });
            }

            initializedLastIdps = true;
        }
    }

    /**
     * @type {Object}
     */
    CPK.login = FederativeLoginController();

}(jQuery));