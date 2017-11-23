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
 * @todo Would be great to make tests :)
 * @todo Use CPK.verbose across all scripts!
 */

if (typeof CPK == "undefined")
    /**
     * @type {Object}
     */
    var CPK = {};

/**
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