/**
 * New implementation of "federative login".
 *
 * Uses CPK.localStorage to store information about last used identity providers.
 * Initialized is in `jquery-cpk/common.js`.
 *
 * @author Jiří Kozlovský, original Angular solution
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 */

(function () {
	"use strict";

	if ( CPK.verbose === true ) {
		console.info( "jquery-cpk/federative-login.js" );
	}

	/**
	 * Federative login controller
	 * @returns {Object}
	 * @constructor
	 */
	function FederativeLoginController() {
		var _storageKey = "__luidps",
			lastIdentityProviders = null;

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
				.then( resolveRenderLips )
				.then( resolveRegisterLipsHandler )
				.then( resolveLibrarycardsHomeLinkHandler );
		}

		/**
		 * @returns {Promise}
		 * @private
		 */
		function initLips() {
			return new Promise( function ( resolve ) {
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
			return new Promise( function ( resolve ) {
				if ( lips === null || lips.length <= 0 ) {
					resolve( [] );
					return;
				}

				try {
					var lip;
					lip = JSON.parse( lips );
					resolve( jQuery.isArray( lip ) ? lip : [] );
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

					reject( error );
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

			return Promise.resolve( renderLips( lips ) );
		}

		/**
		 * @param {Array} lips
		 * @returns {Promise}
		 * @private
		 */
		function renderLips( lips ) {
			return new Promise( function ( resolve ) {
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

						// XXX This should be done via CSS...
						img.setAttribute( "height", "30" );
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

					table.appendChild( tbody );
					parent.appendChild( table );

					resolve( true );
				} catch ( error ) {
					// We doesn't need to break workflow because of this
					if ( CPK.verbose === true ) {
						console.error( error );
					}

					resolve( false );
				}
			} );
		}

		/**
		 * @param {boolean} result
		 * @returns {Promise}
		 * @private
		 */
		function resolveRenderLips( result ) {
			if ( CPK.verbose === true ) {
				console.info( result === true
					? "The last identity providers were rendered."
					: "The last identity providers were not rendered." );
			}

			return Promise.resolve( registerLipsHandler() );
		}

		/**
		 * @private Registers onclick event handler on rendered indentity providers.
		 * @returns {Promise}
		 */
		function registerLipsHandler() {
			return new Promise(function( resolve ) {
				// For HTML see `templates/login/identity-providers.phtml`.
				jQuery( "tr", "#table-regular_identity_providers" ).click( lipClickHandler );
				resolve( true );
			});
		}

		/**
		 * @param {boolean} result
		 * @returns {Promise}
		 * @private
		 */
		function resolveRegisterLipsHandler( result ) {
			if ( CPK.verbose === true ) {
				console.info( result === true
					? "Links of identity providers were initialized."
					: "Links of identity providers were not initialized." );
			}

			var elm = document.getElementById( "login-help-content-link" );

			return Promise.resolve( libraryCardsHomeLinkHandler( elm ) );
		}

		/**
		 * @private Registers onclick event handler on link in librarycards/home.phtml.
		 * @param {HTMLElement} elm
		 * @returns {Promise}
		 */
		function libraryCardsHomeLinkHandler( elm ) {
			return new Promise(function( resolve ) {
				if ( typeof elm === "object" ) {
					resolve ( false );
				} else if ( elm.nodeType !== 1) {
					resolve( false );
				} else {
					elm.addEventListener( "click", toggleHelpContent, true );
					resolve( true );
				}
			});
		}

		/**
		 * @param {boolean} result
		 * @returns {Promise}
		 * @private
		 */
		function resolveLibrarycardsHomeLinkHandler( result ) {
			if ( CPK.verbose === true ) {
				console.info( result === true
					? "Librarycards home link was initialized."
					: "Librarycards home link was not initialized." );
			}

			return Promise.resolve( true );
		}

		/**
		 * @private Toggles help content.
		 * @param {Event} event
		 */
		function toggleHelpContent( event ) {
			var elm = document.getElementById( "login-help-content" );

			if ( elm.nodeType === 1 ) {
				CPK.global.toggleDOM( elm );
			}
		}

		/**
		 * @private Handler for click on identity provider.
		 * @param {Event} event
		 * @todo Would be better if event we're handling here be directly on <a> not on parent <tr>.
		 */
		function lipClickHandler( event ) {
			try {
				if ( event.target.nodeName.toLowerCase() !== "a" ) {
					return;
				}

				var ipJson = event.currentTarget.getAttribute( "data-identityprovider" );
				var ip = JSON.parse( ipJson ),
					i = 0;

				if ( typeof ip !== "object" ) {
					if ( CPK.verbose === true ) {
						console.error( "Parsing JSON of selected identity provider failed!", event, ipJson, ip );
					}

					return;
				}

				// If identity provider is already saved, remove it.
				lastIdentityProviders = lastIdentityProviders.filter(( lip ) => { return lip.name !== ip.name; });

				// And set it as the first one.
				lastIdentityProviders.unshift( ip );

				// Save updated last identity providers (but max. 3!).
				var source = JSON.stringify( lastIdentityProviders.slice( 0, 3 ) );

				CPK.localStorage.setItem( _storageKey, source );

				// And now just continue as event will bubble...
			} catch ( error ) {
				if ( CPK.verbose === true) {
					console.error( "Error when handling click on identity provider.", error );
				}
			}
		}

		// Public API
		var Login = Object.create( null );
		Login.initialize = initialize;

		return Login;
	}

	/**
	 * @type {Object}
	 */
	CPK.login = new FederativeLoginController();

}());