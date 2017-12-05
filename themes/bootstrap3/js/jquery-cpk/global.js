/**
 * Global controller.
 *
 * @author Jiří Kozlovský, original Angular solution
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 *
 * @todo $rootScope.$on( 'notificationClicked', notificationClicked );
 */

(function() {
	if (CPK.verbose === true) {
		console.log("jquery-cpk/global.js");
	}

	/**
	 * @type {Object} jQueryModal
	 */
	var jQueryModal = undefined;

	function getParamsByUglyWay( query ) {
		var vars = query.split("&");
		var query_string = {};
		for (var i = 0; i < vars.length; i++) {
			var pair = vars[i].split("=");
			// If first entry with this name
			if (typeof query_string[pair[0]] === "undefined") {
				query_string[pair[0]] = decodeURIComponent(pair[1]);
				// If second entry with this name
			} else if (typeof query_string[pair[0]] === "string") {
				var arr = [query_string[pair[0]], decodeURIComponent(pair[1])];
				query_string[pair[0]] = arr;
				// If third or later entry with this name
			} else {
				query_string[pair[0]].push(decodeURIComponent(pair[1]));
			}
		}
		return query_string;
	}

	var getUrlParameter = function getUrlParameter(sParam) {
		var sPageURL = decodeURIComponent(window.location.search.substring(1)),
			sURLVariables = sPageURL.split('&'),
			sParameterName,
			i;

		for (i = 0; i < sURLVariables.length; i++) {
			sParameterName = sURLVariables[i].split('=');

			if (sParameterName[0] === sParam) {
				return sParameterName[1] === undefined ? true : sParameterName[1];
			}
		}
	};

	function getParamsByNiceWay( name ) {
		var url_string = "http://www.example.com/t.html?a=1&b=3&c=m2-m3-m4-m5"; //window.location.href
		var url = new URL(url_string);
	}

	function getGetParams() {
		//...
	}

	function getGetParam( name ) {

	}

	/**
	 * Global controller
	 * @todo Find what is injected `$location` object!
	 * @todo Initialize requested modal!
	 */
	function GlobalController() {
		// We need to initialize requested modal
		var currentUrl = new URL( document.location ),
			viewModal  = getGetParams().get( "viewModal" );

		/**
		 * @returns {Promise<boolean>}
		 * @todo Finish this!
		 */
		function init() {
			return Promise.resolve( false );
		}

		/**
		 * @private Returns GET parameters.
		 * @returns {URLSearchParams|UrlSearchParams}
		 */
		function getGetParams() {
			return ( currentUrl.hasOwnProperty( "searchParams" ) )
				? currentUrl.searchParams
				: new UrlSearchParams();
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

		// Public API
		var Controller        = Object.create( null );
		Controller.getParams  = getGetParams;
		Controller.initialize = init;
		Controller.viewModal  = viewModal();
		return Controller;
	}

	/**
	 * @type {GlobalController}
	 */
	CPK.global.controller = new GlobalController();

}());