/**
 * Basic storage implementation. It uses window.localStorage if available
 * otherwise uses "fake" localStorage based on cookies.
 *
 * It also allow to use window.sessionStorage if developer wants to - in
 * that case is fallback also our "fake" storage.
 *
 * @link https://developer.mozilla.org/en-US/docs/Web/API/Storage/LocalStorage
 *
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 */

(function() {
	"use strict";

	if ( CPK.verbose === true ) {
		console.info( "jquery-cpk/storage.js" );
	}

	/**
	 * @type {Object}
	 */
	var fakeStore = Object.create( null );

	/**
	 * @private Returns TRUE if localStorage is supported.
	 * @returns {boolean}
	 */
	function isSupported() {
		try {
			var storage = window.localStorage,
				x = "__storage_test__";

			storage.setItem( x, x );
			storage.removeItem( x );

			return true;
		} catch( e ) {
			return false;
		}
	}

	/**
	 * Checks if given object implements storage.
	 * @param {Object} storage
	 * @returns {Boolean}
	 */
	function isStorage( storage ) {
		if ( typeof storage !== "object" ) {
			return false;
		}

		var ret = true;

		[ "setItem", "getItem", "removeItem", "clear" ].forEach(function( method ) {
			if ( typeof storage[method] !== "function" ) {
				ret = false;
			}
		});

		return ret;
	}

	/**
	 * Sets item.
	 * @param {String} id
	 * @param {String} val
	 * @returns {String}
	 */
	function setItem( id, val ) {
		fakeStore[id] = String( val );
		return fakeStore[id];
	}

	/**
	 * Gets item's value.
	 * @param {String} id
	 * @returns {String}
	 */
	function getItem( id ) {
		return fakeStore.hasOwnProperty( id ) ? String( fakeStore[id] ) : undefined;
	}

	/**
	 * Removes item with given id.
	 * @param {String} id
	 * @returns {boolean}
	 */
	function removeItem( id ) {
		try {
			delete fakeStore[id];
			return true;
		} catch ( e ) {
			return false;
		}
	}

	/**
	 * Clears the storage.
	 */
	function clear() {
		fakeStore = Object.create( null );
	}

	/**
	 * Our fake storage.
	 * @private
	 * @constructor
	 */
	function FakeStorage() {
		this.getItem = getItem;
		this.setItem = setItem;
		this.removeItem = removeItem;
		this.clear = clear;
	}

	/**
	 * Initializes storage (`window.localStorage` or `FakeStorage`).
	 * @returns {Promise}
	 */
	function initStorage() {
		return new Promise(function( resolve ) {
			var storage;

			if ( isSupported() !== true ) {
				if ( CPK.verbose === true ) {
					console.info("Normal local storage is not available. We will use fake storage...");
				}

				storage = new FakeStorage();
			} else {
				storage = window.localStorage;
			}

			resolve( storage );
		});
	}

	// Public API
	CPK.storage = Object.create( null );
	CPK.storage.initStorage = initStorage;
	CPK.storage.isSupported = isSupported;
	CPK.storage.isStorage   = isStorage;
	CPK.storage.FakeStorage = FakeStorage;

	/**
	 * Please note that storage used in application runtime is an instance
	 * created in `common.js` when `document.onReady` event handler is running
	 * and is available as `CPK.localStorage`.
	 *
	 * E.g.:
	 *
	 * <pre>
	 * // Set data (an object) to the storage
	 * CPK.localStorage.setItem( "my_key", JSON.stringify( data );
	 * // Read data
	 * var data = JSON.parse( CPK.localStorage.getItem( "my_key" ) );
	 * </pre>
	 *
	 * For more details about usage see `favorites.js` or `federative-login.js`.
 	 */

}());