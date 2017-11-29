/**
 * New implementation of "federative login".
 *
 * Uses CPK.localStorage to store information about last used identity providers.
 *
 * @author Jiří Kozlovský, original Angular solution
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 *
 * @todo We need to add handler on lip because we doesn't save new lips now!
 * @todo That link on "themes/bootstrap3/templates/librarycards/home.phtml" should be implemented by two promises (will be allways rendered)...
 */

(function () {
	"use strict";

	if ( CPK.verbose === true ) {
		console.info( "jquery-cpk/federative-login.js" );
	}

	/**
	 * Federative login controller
	 * @returns {Object}
	 */
	function FederativeLoginController() {
		var _storageKey = "__luidps",
			lastIdentityProviders = null,
			initializedLastIdps = false,
			vm = this;

		/**
		 * Initializes notifications (just like linkers before for Angular app).
		 * @param {Event} event
		 * @return {Promise}
		 */
		function initialize( event ) {
			return Promise
				.resolve( initLips() )
				.then( resolveInitLips )
				.then( resolveParseLips )
				.then( resolveUpdateLips )
				.then( resolveRenderLips );
		}

		/**
		 * @returns {Promise}
		 * @private
		 */
		function initLips() {
			return new Promise( function ( resolve, reject ) {
				try {
					var lips;
					lips = CPK.localStorage.getItem( _storageKey );
					resolve( lips );
				} catch ( error ) {
					if ( CPK.verbose === true ) {
						console.error( "Local storage is not initialized yet!", error );
					}

					// XXX We are trying it again?!
					return Promise.resolve( initLips() );
				}
			} );
		}

		/**
		 * @param {string} lips
		 * @returns {Promise}
		 * @private
		 */
		function resolveInitLips( lips ) {
			return Promise.resolve( parseLips( lips ) );
		}

		/**
		 * @param {string} lips
		 * @returns {Promise}
		 * @private
		 */
		function parseLips( lips ) {
			return new Promise( function ( resolve, reject ) {
				if ( lips === null || lips.length <= 0 ) {
					resolve( [] );
					return;
				}

				try {
					var lip;
					lip = JSON.parse( lips );
					resolve( lip );
				} catch ( error ) {
					if ( CPK.verbose === true ) {
						console.error( "Could not parse the last identity provider from localStorage", error, lips );
					}

					resolve( [] );
				}
			} );
		}

		/**
		 * @param {Array} lips
		 * @returns {Promise}
		 * @private
		 */
		function resolveParseLips( lips ) {
			return Promise.resolve( updateLips( lips ) );
		}

		/**
		 * @param {Array} lips
		 * @returns {Promise}
		 * @private
		 * @todo Check if "lips" are really updated!
		 */
		function updateLips( lips ) {
			return new Promise( function ( resolve, reject ) {
				try {
					// Setup default language
					var lang = document.body.parentNode.getAttribute( "lang" ),
						newTarget = location.pathname + location.search;

					newTarget += ( newTarget.indexOf( "?" ) >= 0 ? "&" : "?" ) + "auth_method=Shibboleth";

					lips.forEach( function ( lip ) {
						lip.name = lip[ "name_" + lang ];
						lip.href = lip.href.replace( /target=[^&]*/, "target=" + encodeURIComponent( newTarget ) );
					} );

					resolve( lips );
				} catch ( error ) {
					if ( CPK.verbose === true ) {
						console.error( "Updating of last identity providers by document's language failed!", error );
					}

					reject( e );
				}
			} );
		}

		/**
		 * @param {Array} lips
		 * @returns {Promise}
		 * @private
		 */
		function resolveUpdateLips( lips ) {
			lastIdentityProviders = lips;
			initializedLastIdps = true;

			return Promise.resolve( renderLips( lips ) );
		}

		/**
		 * @param {Array} lips
		 * @returns {Promise}
		 * @private
		 */
		function renderLips( lips ) {
			return new Promise( function ( resolve, reject ) {
				try {
					var parent = document.getElementById( "last-identity-providers" ),
						table = document.createElement( "table" ),
						tbody = document.createElement( "tbody" );

					lips.forEach( function ( lip ) {
						var tr = document.createElement( "tr" ),
							td1 = document.createElement( "td" ),
							td2 = document.createElement( "td" ),
							img = document.createElement( "img" ),
							a = document.createElement( "a" );

						img.setAttribute( "src", lip.logo );
						td1.classList.add( "col-sm-4" );
						td1.appendChild( img );
						a.setAttribute( "href", lip.href );
						a.appendChild( document.createTextNode( lip.name ) );
						td2.appendChild( a );
						tr.appendChild( td1 );
						tr.appendChild( td2 );
						tbody.appendChild( tr );
					} );

					parent.appendChild( table.appendChild( tbody ) );
				} catch ( e ) {
					// We doesn't need to break workflow because of this
					if ( CPK.verbose === true ) {
						console.error( e );
					}
				}

				resolve( lips );
			} );
		}

		/**
		 * @param {Array} lips
		 * @returns {Promise}
		 * @private
		 */
		function resolveRenderLips( lips ) {
			return Promise.resolve( true );
		}

		/**
		 * Toggle help content.
		 * @param {Event} event
		 * @see themes/bootstrap3/templates/librarycards/home.tpl
		 */
		function toggleHelpContent( event ) {
			var elm = document.getElementById( "login-help-content" );

			if ( elm.nodeType === 1 ) {
				CPK.global.toggleDOM( elm );
			}
		}

		// Public API
		vm.initialize = initialize;
		vm.toggleHelpContent = toggleHelpContent;

		return vm;
	}

	/**
	 * @type {Object}
	 */
	CPK.login = new FederativeLoginController();

}());