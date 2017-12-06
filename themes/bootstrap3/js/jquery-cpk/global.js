/**
 * Global controller.
 *
 * @author Jiří Kozlovský, original Angular solution
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 */

(function() {
	"use strict";

	// Private variables
	var MODAL_PARAM = "viewModal",
		jQueryModal = undefined,
	    cacheParams = [];

	/**
	 * @private Returns all GET parameters as an array with name/value objects.
	 * @param {boolean} skipCache (Optional.) Set on ANY bool if you want to skip cache.
	 * @returns {Object[]}
	 */
	function getUrlParams( skipCache ) {
		if ( cacheParams.length > 0 && typeof skipCache === "undefined" ) {
			return cacheParams;
		}

		var pageUrl = decodeURIComponent( window.location.search.substring( 1 ) ),
			urlVars = pageUrl.split( "&" ),
			result = [],
			paramName, i;

		for ( i = 0; i < urlVars.length; i++ ) {
			paramName = urlVars[i].split( "=" );

			if ( paramName[0] === name ) {
				result.push({
					"name": paramName[0],
					"value": ( paramName[1] === undefined ) ? true : paramName[1]
				});
			}
		}

		cacheParams = result;

		return result;
	}

	/**
	 * @private Returns value for specified GET parameter.
	 * @param {string} name
	 * @param {array} params (Optional.)
	 * @returns {boolean|string|null}
	 */
	function getUrlParam( name, params ) {
		params = jQuery.isArray( params ) ? params : getUrlParams( undefined );

		for ( var i = 0; i < params.length; i++ ) {
			if ( params[i].name === name ) {
				return params[i].value;
			}
		}

		return null;
	}

	/**
	 * Global controller.
	 */
	function GlobalController() {
		/**
		 * Current value of "viewModal" parameter.
		 * @type {string}
		 */
		var viewModalParam;

		/**
		 * Holds array of linked HTML elements.
		 * @property {HTMLElement} main
		 * @property {HTMLElement} title
		 * @property {HTMLElement} body
		 * @type {Object}
		 */
		var domLinker = Object.create( null );

		/**
		 * @returns {Promise<boolean>}
		 */
		function init() {
			return Promise
				.resolve( initModalParam() )
				.then( initDom );
		}

		/**
		 * @private Obtains "viewModal" parameter.
		 * @returns {Promise<string|boolean>}
		 */
		function initModalParam() {
			var modalParam = getGetParam( MODAL_PARAM );

			viewModalParam = ( modalParam !== null && modalParam.length > 0 ) ? modalParam : null;

			return Promise.resolve( true );
		}

		/**
		 * @private Initializes "domLinker".
		 * @returns {Promise<boolean>}
		 */
		function initDom() {
			var result = true;

			domLinker.main  = document.getElementById( "globalModal" );
			domLinker.title = document.getElementById( "globalModalTitle" );
			domLinker.body  = document.getElementById( "globalModalBody" );

			/**
			 * @param {HTMLElement} elm
			 */
			function checkElm( elm ) {
				try {
					if ( elm.nodeType !== 1 ) {
						result = false;
					}
				} catch ( e ) {
					result = false;
				}
			}

			// Check if we found all DOM elements we need
			[ domLinker.main, domLinker.title, domLinker.body ].forEach( checkElm );

			// Just inform that something is wrong
			if ( result === false && CPK.verbose === true ) {
				console.error( "DOM for GlobalConstructor was not initialized." );
			}

			// But do not stop the process
			return Promise.resolve( true );
		}

		/**
		 * Returns GET parameter by its name.
		 * @param {string} name
		 * @returns {string}
		 */
		function getGetParam( name ) {
			return getUrlParam( name, undefined );
		}

		/**
		 * Returns all GET parameters as an array with name/value objects.
		 * @returns {Object[]}
		 */
		function getGetParams() {
			return getUrlParams( undefined );
		}

		/**
		 * Shows modal (with `portalPageId`).
		 * @param {string} portalPageId
		 * @returns {Promise}
		 */
		function viewModal( portalPageId ) {

			/**
			 * @param {Object} response
			 */
			function onModalAjaxDone( response ) {
				try {
					var portalPage = response.data.data;

					domLinker.title.textContent = portalPage.title;
					domLinker.body.innerHTML = portalPage.content;

					modal( true );
				} catch ( error ) {
					if ( CPK.verbose === true ) {
						console.error( error );
					}
				}
			}

			/**
			 * @param {string} error
			 */
			function onModalAjaxFail( error ) {
				if ( CPK.verbose === true ) {
					console.error( error );
				}
			}

			/**
			 * @param {boolean} result Result from {@see resolveInitDomLinker}.
			 * @returns {Promise<boolean>}
			 */
			function viewModalPromise( result ) {
				if ( result !== true ) {
					return Promise.resolve( false );
				}

				// Perform request for the contents
				jQuery.get( "/AJAX/JSON?method=getPortalPage&prettyUrl=" + portalPageId )
					.done( onModalAjaxDone )
					.fail( onModalAjaxFail );

				return Promise.resolve( true );
			}

			/**
			 * @param {boolean} result
			 * @returns {Promise<boolean>}
			 */
			function resolveViewModalPromise( result ) {
				if ( CPK.verbose === true ) {
					console.info( result === true
						? "Modal should be open in any moment."
						: "Modal will not be opened!" );
				}

				return Promise.resolve( result );
			}

			// Try to show modal dialog
			return Promise
				.resolve( initDomLinker() )
				.then( resolveInitDomLinker )
				.then( viewModalPromise )
				.then( resolveViewModalPromise );
		}

		/**
		 * @private Toggles visibility of our modal dialog.
		 * @param {boolean} show
		 * @returns {Object}
		 */
		function modal( show ) {
			if ( typeof jQueryModal === "undefined" ) {
				jQueryModal = jQuery( domLinker.main );
			}

			jQueryModal.modal( ( show === true ) ? "show" : "hide" );

			return jQueryModal;
		}

		/**
		 * @private Handles click on notification.
		 * @param {Event} event
		 */
		function onNotificationClick( event ) {
			var oldModal = getUrlParam( MODAL_PARAM, undefined ),
				newModal = getUrlParam( MODAL_PARAM, getUrlParams( true ) );

			if ( CPK.verbose === true ) {
				console.log( "GlobalController->onNotificationClick", event, oldModal, newModal );
			}

			if ( newModal !== null && newModal !== oldModal ) {
				Promise.resolve( viewModal( newModal ) );
			}
		}

		// Public API
		var Controller        = Object.create( null );
		Controller.initialize = init;
		Controller.getParam   = getGetParam;
		Controller.getParams  = getGetParams;
		Controller.viewModal  = viewModal;

		return Controller;
	}

	/**
	 * @type {GlobalController}
	 */
	CPK.global.controller = new GlobalController();

}());