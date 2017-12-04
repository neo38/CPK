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
	 * Our fake storage.
	 * @private
	 * @property {number} length
	 * @constructor
	 */
	function FakeStorage() {
		/**
		 * @type {FakeStorageItem[]}
		 */
		var fakeStore = [];

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

			/**
			 * @type {number}
			 */
			var idx = fakeStore.findIndex( findIndex );

			if ( idx === -1 ) {
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
	 * Constructs `CPK.storage` object.
	 * @constructor
	 */
	function CpkStorage() {
		/**
		 * Initializes storage of requested type.
		 * @param {string} type
		 * @returns {Promise<FakeStorage|Storage|boolean>}
		 */
		function initStorage( type ) {
			/**
			 * @param {function} resolve
			 * @private
			 */
			function initStoragePromise( resolve ) {
				if ( isSupported( type ) !== true ) {
					resolve( false );
				}

				/**
				 * @type {FakeStorage|Storage}
				 */
				var storage = ( type === "fakeStorage" ) ? new FakeStorage() : window[ type ];

				resolve( storage );
			}

			return new Promise( initStoragePromise );
		}

		/**
		 * Checks if given object implements storage.
		 * @param {Object} storage
		 * @returns {boolean}
		 */
		function isStorage( storage ) {
			return ( ( storage instanceof Storage ) || ( storage instanceof FakeStorage ) );
		}

		/**
		 * Returns TRUE if localStorage is supported.
		 * @param {string} type (Optional.) Type of used storage - `localStorage` or `sessionStorage`.
		 * @returns {boolean}
		 */
		function isSupported( type ) {
			if ( type === "FakeStorage" ) {
				return true;
			}

			if ( type === undefined || [ "localStorage", "sessionStorage" ].indexOf( type ) === -1 ) {
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

		this.initStorage = initStorage;
		this.isSupported = isSupported;
		this.isStorage   = isStorage;
		this.FakeStorage = FakeStorage;
	}

	/**
	 * @type {CpkStorage}
	 */
	CPK.storage = new CpkStorage();

}());