/**
 * jQuery-based replacement for original Angular-based ng-cpk module.
 */

if (typeof CPK == "undefined")
    var CPK = {};

/**
 * Application self is splitted into several modules:
 *
 * Favorites
 * =========
 *
 * CPK.favorites.Favorite      Object representing single favorite.
 * CPK.favorites.available     Available (possible) favorites on the current page.
 * CPK.favorites.notifications Notifications for favorites.
 * CPK.favorites.storage       Storage for favorites.
 *
 * Notifications
 * =============
 *
 * CPK.notifications.
 */