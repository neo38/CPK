/**
 * Favorites - notifications.
 *
 * @author Jiří Kozlovský, original Angular solution
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 */

(function() {
    if (CPK.verbose === true) {
        console.log("jquery-cpk/favorites.notifications.js");
    }

    /**
     * Favorites notifications service.
     * @returns {Object}
     */
    function FavoritesNotificationsService() {
        var notifications = {
            favoriteAdded : favoriteAdded,
            allFavoritesRemoved : allFavoritesRemoved
        };

        var addedSomethingAlready = false,
            notificationsEnabled = typeof __notif !== "undefined";

        return notifications;

        // Public

        /**
         * Notification about favorite was added.
         */
        function favoriteAdded() {
            if (notificationsEnabled === true) {
                if (addedSomethingAlready === false) {
                    addedSomethingAlready = true;
                    createNotificationWarning();
                }
            }
        }

        /**
         * Notification about all favorites were removed.
         */
        function allFavoritesRemoved() {
            if (notificationsEnabled === true) {
                // Remove the notification
                __notif.helper.pointers.global.children(".notif-favs").remove();

                // Remove the warning icon if there is no more notifications
                if (__notif.sourcesRead.unreadCount === 0) {
                    addedSomethingAlready = false;

                    // Hide warning icon...
                    __notif.warning.hide();
                    __notif.helper.pointers.global.children().first().show();
                }
            }
        }

        // Private

        /**
         * Creates notification warning.
         */
        function createNotificationWarning() {
            var translatedMessage = VuFind.translate("you_have_unsaved_favorites");
            __notif.addNotification(translatedMessage, "favs");
        }
    }

    /**
     * @type {Object}
     */
    CPK.favorites.notifications = FavoritesNotificationsService();

}());