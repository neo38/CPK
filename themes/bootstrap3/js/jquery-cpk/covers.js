/**
 * Covers.
 *
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 */

(function() {
	if ( CPK.verbose === true ) {
		console.log( "jquery-cpk/covers.js" );
	}

	/**
	 * History service controller
	 * @returns {Object}
	 * @constructor
	 */
	function CoversController() {

		/**
		 * Initializes the controller.
		 * @returns {Promise<boolean>}
		 */
		function init() {
			console.warn( "XXX Implement CoversController!" );

			/**
			 * @param {XXX} result
			 * @returns {Promise<boolean>}
			 */
			function finalizeInit( result ) {
				return Promise.resolve( true );
			}

			// Collect requests for covers -> perform them -> resolve (display images)
			return Promise
				.resolve( collectRequests() )
				.then( performRequests )
				.then( resolveRequests );
		}

		/**
		 * @private Collect all cover requests.
		 * @returns {Promise<array>}
		 */
		function collectRequests() {

		}

		/**
		 * @private Perform requests for covers.
		 * @param {array} requests
		 * @returns {Promise<array>}
		 */
		function performRequests( requests ) {

		}

		/**
		 * @private Resolves requests (shows covers).
		 * @param {array} requests
		 * @returns {Promise<boolean>}
		 */
		function resolveRequests( requests ) {

		}

		// Public API
		var Controller = Object.create( null );

		Controller.initialize = init;

		return Controller;
	}

	/**
	 * @type {CoversController}
	 */
	CPK.covers = new CoversController();
}());