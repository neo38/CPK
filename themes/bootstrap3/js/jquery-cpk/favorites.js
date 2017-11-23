/**
 * New implementation of Favorites. Is based on jQuery but it keeps
 * previous Angular-based code in mind.
 *
 * Basically there is a new global variable CPK.favorites which
 * is object and contains these properties:
 *
 * - favorites.available : all objects that was parsed on page and
 *   are thus available for favorites service.
 * - favorites.Favorite : prototype object for new favorites,
 * - favorites.notifications : notification service,
 * - favorites.storage : storage service for favorites.
 *
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 */

(function() {
    console.log("jquery-cpk/favorites.js");

    /**
     * Prototype for favorites notifications service.
     * @constructor
     */
    var FavoritesNotifications = function() {
        console.log("Initializing FavoritesNotifications.");

        var $addedSomething = false,
            $notificationsEnabled = typeof __notif !== "undefined";

        console.log("Notifications are " + ($notificationsEnabled === true ? "ENABLED" : "DISABLED") + ".");

        /**
         * Notify that a new favorite were added.
         */
        this.favAdded = function() {
            if ($notificationsEnabled !== true) {
                return;
            }

            if ($addedSomething === false) {
                $addedSomething = true;
                createNotificationWarning();
            }
        };

        /**
         * Notify that all favorites were removed.
         */
        this.allFavsRemoved = function() {
            if ($notificationsEnabled !== true) {
                return;
            }

            __notif.helper.pointers.global.children(".notif-favs").remove();

            if (__notif.sourcesRead.unreadCount === 0) {
                $addedSomething = false;
                __notif.warning.hide();
                __notif.helper.pointers.global.children().first().show();
            }
        };

        /**
         * Creates warning about unsaved favorites.
         * @private
         */
        function createNotificationWarning() {
            var message = translate("you_have_unsaved_favorites");
            __notif.addNotification(message, "favs");
        }
    };

    /**
     * Initialize favorites
     * @type {Object}
     */
    CPK.favorites = {};
    /**
     * @type {Favorite}
     */
    CPK.favorites.Favorite = Favorite;
    /**
     * @type {Array}
     */
    CPK.favorites.available = [];
    /**
     * @type {FavoritesNotifications}
     */
    CPK.favorites.notifications = new FavoritesNotifications();
    /**
     * @type {FavoritesStorage}
     */
    CPK.favorites.storage = new FavoritesStorage($usedStorageType);

}(jQuery));