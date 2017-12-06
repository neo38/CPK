/**
 * Universal storage implementation.
 *
 * If is rejected initialization of storage of type "localStorage" or
 * "sessionStorage" you can still use "fakeStorage" as an alternative.
 *
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 */

(function() {
	"use strict";

	/**
	 * Single fake storage item.
	 * @param {string} id
	 * @param {string} val
	 * @constructor
	 */
	function FakeStorageItem( id, val ) {
		var Item = Object.create( null );
		Item.id  = id;
		Item.val = val;

		return Item;
	}

	/**
	 * Fake storage.
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
			 * @type {number}
			 */
			var idx = fakeStore.findIndex(function setItem_findIndex( elm ) { return ( elm.id === id ); });

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
			 * @type {FakeStorageItem[]}
			 */
			var result = fakeStore.filter(function filterItem( elm ) { return ( elm.id === id ); });

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
			 * @type {number}
			 */
			var idx = fakeStore.findIndex(function removeItem_findIndex( elm ) { return ( elm.id === id ); });

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
		 * @private Returns length of the storage.
		 * @returns {number}
		 */
		function getLength() {
			return fakeStore.length;
		}

		// Public API
		var Storage = Object.create( null );

		// Properties
		Object.defineProperty( Storage, "length", { get: getLength } );

		// Methods
		Storage.getItem    = getItem;
		Storage.setItem    = setItem;
		Storage.removeItem = removeItem;
		Storage.clear      = clear;
		Storage.key        = key;

		return Storage;
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

		// Public API
		this.initStorage    = initStorage;
		this.isSupported    = isSupported;
		this.isStorage      = isStorage;
		this.FakeStorage    = FakeStorage;
	}

	/**
	 * @type {CpkStorage}
	 */
	CPK.storage = new CpkStorage();

}());