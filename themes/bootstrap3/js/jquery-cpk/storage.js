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
	 * These types of storage are supported.
	 * @type {string[]}
	 */
	var supportedTypes = [ "fakeStorage", "localStorage", "sessionStorage" ];

	/**
	 * This is a public API which should any storage fulfill.
	 * @type {string[]}
	 */
	var storageApi = [ "clear", "key", "length", "setItem", "getItem", "removeItem" ];

	/**
	 * @type {FakeStorageItem[]}
	 */
	var fakeStore = [];

	/**
	 * @param {string} type (Optional.) Type of used storage - `localStorage` or `sessionStorage`.
	 * @private Returns TRUE if localStorage is supported.
	 * @returns {boolean}
	 */
	function isSupported( type ) {
		if ( type === undefined || supportedTypes.indexOf( type ) === -1 ) {
			type = "localStorage";
		}

		try {
			var storage = window[ type ],
				x = "__storage_test__";

			storage.setItem( x, x );
			storage.removeItem( x );

			return true;
		} catch( error ) {
			if ( CPK.verbose === true ) {
				console.error( error );
			}

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
		storageApi.forEach(function( method ) {
			if ( method === "length" ) {
				if ( storage.hasOwnProperty( method ) !== true ) {
					ret = false;
				}
			} else if ( typeof storage[ method ] !== "function" ) {
				ret = false;
			}
		});

		return ret;
	}

	/**
	 * Single fake storage item.
	 * @param {string} id
	 * @param {string} val
	 * @constructor
	 */
	function FakeStorageItem( id, val ) {
		this.id  = id;
		this.val = val;
	}

	/**
	 * Sets item.
	 * @param {string} id
	 * @param {string} val
	 */
	function setItem( id, val ) {

		/**
		 * @param {FakeStorageItem} elm
		 * @returns {boolean}
		 */
		var findIndex = function( elm ) {
			return ( elm.id === id );
		};

		if ( fakeStore.findIndex( findIndex ) === -1 ) {
			// We are adding new item.
			fakeStore.push( new FakeStorageItem( id, val ) );
		} else {
			// We are updating already existing item.
			fakeStore[ idx ].val = val;
		}
	}

	/**
	 * Gets item's value.
	 * @param {string} id
	 * @returns {string|null}
	 */
	function getItem( id ) {

		/**
		 * @param {FakeStorageItem} elm
		 * @returns {boolean}
		 */
		var filterItem = function( elm ) {
			return ( elm.id === id );
		};

		/**
		 * @type {FakeStorageItem[]}
		 */
		var result = fakeStore.filter( filterItem );

		if ( result.length === 1 ) {
			return result[ 0 ].val;
		}

		return null;
	}

	/**
	 * Removes item with given id.
	 * @param {string} id
	 * @returns {boolean}
	 */
	function removeItem( id ) {

		/**
		 * @param {FakeStorageItem} elm
		 * @returns {boolean}
		 */
		var findIndex = function( elm ) {
			return ( elm.id === id );
		};

		/**
		 * @type {number}
		 */
		var idx = fakeStore.findIndex( findIndex );

		if ( idx === -1 ) {
			// Requested item was not found.
			return false;
		}

		// Remove item
		fakeStore.splice( idx, 1 );

		return true;
	}

	/**
	 * Clears the storage.
	 */
	function clear() {
		fakeStore = [];
	}

	/**
	 * Returns the name of the nth key in the storage.
	 * @param {number} key The number of the key you want to get the name of.
	 * @returns {string|null}
	 */
	function key( key ) {
		if ( fakeStore.length <= key ) {
			return null;
		}

		return fakeStore[ key ].id;
	}

	/**
	 * Our fake storage.
	 * @private
	 * @property {number} length
	 * @constructor
	 */
	function FakeStorage() {
		// Properties
		Object.defineProperty( this, "length", {
			get: function() { return fakeStore.length; }
		} );
		// Methods
		this.getItem    = getItem;
		this.setItem    = setItem;
		this.removeItem = removeItem;
		this.clear      = clear;
		this.key        = key;
	}

	/**
	 * Initializes storage (`window.localStorage` or `FakeStorage`).
	 * @param {string} type
	 * @returns {Promise}
	 */
	function initStorage( type ) {
		return new Promise(function( resolve, reject ) {
			if ( supportedTypes.indexOf( type ) === -1 ) {
				reject( "Requested unknown storage type ('" + type + "')!" );
			}

			if ( isSupported( type ) !== true ) {
				reject( "Requested unsupported storage type ('" + type + "')!" );
			}

			resolve( ( type === "fakeStorage" ) ? new FakeStorage() : window[ type ] );
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
	 * For more details about usage see `favorites.js`, `federative-login.js`
	 * or `notifications.js`.
 	 */

}());