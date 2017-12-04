/**
 * Global controller.
 *
 * @author Jiří Kozlovský, original Angular solution
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 */

(function($) {
	if (CPK.verbose === true) {
		console.log("jquery-cpk/global.js");
	}

	/**
	 * @type {Object} jQueryModal
	 */
	var jQueryModal = undefined;

	/**
	 * Global controller
	 * @todo Find what is injected `$location` object!
	 * @todo Initialize requested modal!
	 */
	function GlobalController() {
		// We need to initialize requested modal
		var currentUrl = new URL( document.location );

		if ( currentUrl.hasOwnProperty( "searchParams" ) ) {
			// This is for modern browsers
			var viewModal = currentUrl.searchParams.get( "viewModal" );
		} else {
			// This is for older browsers
			var params = currentUrl.search;
			console.log( params );
		}

		//if ( typeof vm.getParams['viewModal'] !== 'undefined' ) {
		//	viewModal( vm.getParams['viewModal'] );
		//}
		//$rootScope.$on( 'notificationClicked', notificationClicked );

		/**
		 * @returns {Promise<boolean>}
		 * @todo Finish this!
		 */
		function init() {
			return Promise.resolve( false );
		}

		/**
		 * Handles click on notification.
		 */
		function notificationClicked() {
			var oldModal = CPK.global.controller.getParams[ 'viewModal' ];

			vm.getParams = $location.search();

			if (typeof vm.getParams['viewModal'] !== 'undefined') {

				viewModal(vm.getParams['viewModal'], $log, $http);
			}
		}

		/*
		 * Private
		 */

		/**
		 * @param {string} portalPageId
		 * @private Shows modal (with `portalPageId`).
		 * @returns {Promise}
		 * @todo Finish this!
		 */
		function viewModal( portalPageId ) {
			/**
			 * @returns {Promise}
			 */
			var handleShowModal = function() {
				return new Promise(function( resolve, reject ) {
					// TODO Before this starts with `onLinkedModal( 'global', showTheModal );`

					// TODO var header = linkedObjects.modal.global.header;
					// TODO var body = linkedObjects.modal.global.body;

					jQuery.get( "/AJAX/JSON?method=getPortalPage&prettyUrl=" + portalPageId )
						.done(function( response ) {
							var portalPage = response.data.data;

							// TODO header.textContent = portalPage.title;
							// TODO body.innerHTML = portalPage.content;
						})
						.fail(function( error ) {
							if ( CPK.verbose === true ) {
								console.error( error );
							}
						});

					resolve( true );
				});
			};

			return Promise
				.resolve( handleShowModal() )
				.then(function( /*result*/ ) { modal( true ); });
		}

		/**
		 * @param {boolean} show
		 * @returns {Object}
		 */
		function modal( show ) {
			if ( typeof jQueryModal === "undefined" ) {
				jQueryModal = jQuery( document.getElementById( "#modal" ) );
			}

			if ( show === true ) {
				jQueryModal.modal( "show" );
			} else {
				jQueryModal.modal( "hide" );
			}

			return jQueryModal;
		}

		// TODO Controller.getParams = $location.search();

		// Public API
		var Controller        = Object.create( null );
		Controller.getParams  = [];
		Controller.initialize = init;
		return Controller;
	}

	/**
	 * @type {GlobalController}
	 */
	CPK.global.controller = new GlobalController();

}(jQuery));