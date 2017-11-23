/**
 * New implementation of notifications. Is based on jQuery but is based
 * previous Angular-based code.
 *
 * @author Jiří Kozlovský, original Angular solution
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 */

(function($) {
    if (CPK.verbose === true) {
        console.log("jquery-cpk/notifications.js");
    }

    /**
     * Holds DOM elements of global notifications section
     * @type {Object}
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
    var institutionNotifLoaderHolder = {};

    /**
     * Is called after linker has done it's job which is defined
     * as done right after all globalNotifHolder's object keys
     * are filled with values.
     * @type {Function}
     */
    var onLinkerDone = function() {};

    /**
     * @param {Object} $q
     * @returns {NotificationsController}
     * @constructor
     * @todo Resolve "$q"!
     */
    function NotificationsController($q) {
        var apiNonrelevantJobDoneFlag = false,
            onApiNonrelevantJobDone,
            unreadNotifsCount = 0,
            vm = this;

        // Public
        vm.notifications = {};
        vm.initApiRelevantNotificationsForUserCard = initApiRelevantNotificationsForUserCard;
        vm.initApiNonrelevantNotifications = initApiNonrelevantNotifications;
        vm.notifClicked = notifClicked;

        onLinkerDone = function() {
            if (!hasGlobalNotifications()) {
                if (apiNonrelevantJobDoneFlag) {
                    hideGlobalNotifications();
                } else {
                    onApiNonrelevantJobDone = onLinkerDone;
                }
            } else {
                showWarningIcon();
            }
        };

        return vm;

        /**
         * Initializes an empty array for an username provided in order
         * to successfully bind data to this Controller.
         */
        function initApiRelevantNotificationsForUserCard(source, username) {
            vm.notifications[username] = [];

            $q.resolve(fetchNotificationsForUserCard(username)).then(
                function(notifications) {
                    onGotNotificationsForUserCard(notifications, source, username);
                }
            ).catch(
                function(reason) {
                    console.error(reason);
                }
            );
        }

        function initApiNonrelevantNotifications() {
            vm.notifications.noAPI = {};
            vm.notifications.noAPI.user = [];

            $q.resolve(fetchNotificationsForUser()).then(
                function(notifications) {
                    onGotNotificationsForUser(notifications);
                    apiNonrelevantJobDone();
                }
            ).catch(function() {
                console.error(reason);
                apiNonrelevantJobDone();
            });
        }

        /**
         * Process the notifications on user_card scale after we got them.
         * @param {Array} notifications
         * @param {String} source
         * @param {String} username
         */
        function onGotNotificationsForUserCard(notifications, source, username) {
            if (!(notifications instanceof Array)) {
                return;
            }

            vm.notifications[username] = notifications;

            if (notifications.length !== 0) {
                notifications.forEach(
                    function(notification) {
                        if (notification.clazz.match(/unread/)) {
                            ++unreadNotifsCount;
                        }
                    }
                );
                updateUnreadNotificationsCount();
                showWarningIcon();
            } else {
                hideDOM(institutionNotifLoaderHolder[source + ".parent"]);
            }

            hideLoader(source);
        }

        /**
         * Process the notifications on user_card scale after we got them.
         * @param {Array} notifications
         */
        function onGotNotificationsForUser(notifications) {
            if (!(notifications instanceof Array)) {
                return;
            }

            vm.notifications.noAPI.user = notifications;

            if (notifications.length < 1) {
                return;
            }

            notifications.forEach(
                function(notification) {
                    if (notification.clazz.match(/unread/)) {
                        ++unreadNotifsCount;
                    }
                }
            );

            updateUnreadNotificationsCount();
            showWarningIcon();
        }

        /**
         * A notification has been clicked .. follow the href if any.
         */
        function onNotificationClick(notification, source) {
            var clazz = notification.clazz;
            var href  = notification.href;
            var type  = notification.type;

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
                $.post("/AJAX/JSON?method=notificationRead", data).done(followLocation);
            }
        }

        // Private

        /**
         * Prints errors found in server's response onto console.
         * @param {Object} response
         */
        function print_response_errors(response) {
            if (typeof response.errors === "object") {
                response.errors.forEach(function(e) {
                    console.error(e);
                });
            }
        }

        /**
         * Fetches notifications for provided username asynchronously.
         * @param {String} username
         * @returns {Promise}
         */
        function fetchNotificationsForUserCard(username) {
            return new Promise(function(resolve, reject) {
                var data = {
                    cat_username: username
                };

                $.post("/AJAX/JSON?method=getMyNotificationsForUserCard", data)
                    .done(function(response) {
                        response = response.data.data;

                        // Print errors if any
                        print_response_errors(response);

                        if (typeof response.notifications !== "undefined") {
                            resolve(response.notifications);

                            if (response.notifications.length == 0) {
                                $("ul#notificationsList > li#" + response.source).append(
                                    '<div class="notif-default">' +
                                    VuFind.translate("without_notifications") +
                                    '</div>'
                                );
                            }
                        } else {
                            reject("No notifications for user card returned!");
                        }
                    })
                    .fail(function(e) {
                        reject(e);
                    });
            });
        }

        /**
         * Fetches notifications for current user asynchronously.
         * @returns {Promise}
         */
        function fetchNotificationsForUser() {
            return new Promise(function(resolve, reject) {
                $.get("/AJAX/JSON?method=getMyNotificationsForUser")
                    .done(function(response) {
                        response = response.data.data;

                        print_response_errors(response);

                        if (typeof response.notifications !== "undefined") {
                            resolve(resolve.notifications);
                        } else {
                            reject("No notifications for current user returned!");
                        }
                    })
                    .fail(function(e) {
                        reject(e);
                    });
            });
        }

        /**
         * Hides a loader for an institution. It hides a loader associated
         * with portal notifications if no source provided.
         * @param {String} source
         */
        function hideLoader(source) {
            hideDOM(typeof source === "undefined" ? globalNotifHolder.loader : institutionNotifLoaderHolder[source]);

            if (!hasGlobalNotifications()) {
                hideGlobalNotifications();
            }
        }

        /**
         * Shows up a previously hidden loader for an institution. It shows up
         * a loader associated with portal notifications if no source provided.
         * @param {String} source
         */
        function showLoader(source) {
            showDOM(typeof source === "undefined" ? globalNotifHolder.loader : institutionNotifLoaderHolder[source]);

            if (hasGlobalNotifications()) {
                showGlobalNotifications();
            }
        }

        /**
         * Hides warning icon.
         */
        function hideWarningIcon() {
            globalNotifHolder.warningIcon.style.display = "none";
        }

        /**
         * Shows warning icon by setting DOM element's style to nothing.
         */
        function showWarningIcon() {
            /**
             * @todo Shouldn't be "block" instead of ""?!
             */
            globalNotifHolder.warningIcon.style.display = "";
        }

        /**
         * Sets the count to the counter of unread notifications.
         */
        function updateUnreadNotificationsCount() {
            unreadNotifsCount < 0 && (unreadNotifsCount = 0);
            globalNotifHolder.unreadNotifsCount.textContent = unreadNotifsCount;
        }

        /**
         * Hides up the global notification section.
         */
        function hideGlobalNotifications() {
            hideDOM(globalNotifHolder.parent);
        }

        /**
         * Shows up the global notification section.
         */
        function showGlobalNotifications() {
            showDOM(globalNotifHolder.parent);
        }

        function showDOM(dom) {
            dom.removeAttribute("hidden");
        }

        function hideDOM(dom) {
            dom.setAttribute("hidden", "hidden");
        }

        /**
         * Checks if are there currently any global notifications.
         * @returns {boolean}
         */
        function hasGlobalNotifications() {
            var hasSynchronousGlobalNotifications = globalNotifHolder.synchronousNotifications.children.length !== 0;
            var hasApiNonrelevantNotifications = typeof vm.notifications.noAPI.user === "object" && vm.notifications.noAPI.user.length !== 0;

            return hasSynchronousGlobalNotifications || hasApiNonrelevantNotifications;
        }

        function apiNonrelevantJobDone() {
            apiNonrelevantJobDoneFlag = true;

            if (typeof onApiNonrelevantJobDone === "function") {
                onApiNonrelevantJobDone.call();
            }
        }
    }

    /**
     * Hooks DOM elements to an variable associated with notifications linked
     * with the portal, not the institutions within it.
     * @returns {Object}
     */
    function globalNotifDirective() {
        return {
            restrict: "A",
            link: linker
        };

        var buf = undefined;

        function linker(scope, elms, attrs) {
            switch (attrs.globalNotif) {
                case "loader":
                    globalNotifHolder.loader = elms.context;
                    break;

                case "parent":
                    globalNotifHolder.parent = elms.context;
                    break;

                case "synchronousNotifications":
                    globalNotifHolder.synchronousNotifications = elms.context;
                    break;

                case "warningIcon":
                    globalNotifHolder.warningIcon = elms.context;
                    break;

                case "unreadNotifsCount":
                    globalNotifHolder.unreadNotifsCount = elms.context;
                    break;

                default:
                    console.error("Linker for notifications controller failed to link global notifications element.");
                    break;
            }

            checkLinkerIsDone();
        }
    }

    /**
     * Checks if the linker is done linking by checking variables within {@see globalNotifHolder}
     * variable are all set to same value.
     *
     * It calls {@see onLinkerDone()} if it is done.
     */
    function checkLinkerIsDone() {
        if (typeof buf === "undefined") {
            buf = {};
            buf["globalNotifHolderKeys"] = Object.keys(globalNotifHolder);
            buf["globalNotifHolderKeysLength"] = buf["globalNotifHolderKeys"].length;
        }

        for (var i = 0; i < buf["globalNotifHolderKeysLength"];) {
            if (typeof globalNotifHolder[buf["globalNotifHolderKeys"][i]] === "undefined") {
                break;
            }

            if (++i === buf["globalNotifHolderKeysLength"]) {
                if (typeof onLinkerDone === "function") {
                    onLinkerDone();
                } else {
                    console.error("onLinkerDone must be a function!");
                }
            }
        }
    }

    /**
     * Hooks DOM elements to an variable associated with particular institution identity.
     * @returns {Object}
     */
    function institutionNotif() {
        return {
            restrict: "A",
            link: linker
        };

        function linker(scope, elms, attrs) {
            var source = attrs.institutionNotif;
            // Now we really need to hook only the warning icons to each
            institutionNotifLoaderHolder[source] = elms.context;
        }
    }

    /**
     * @type {NotificationsController}
     */
    CPK.notifications = new NotificationsController(null);

}(jQuery));