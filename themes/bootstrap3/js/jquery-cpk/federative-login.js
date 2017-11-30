/**
 * New implementation of "federative login".
 *
 * Uses CPK.localStorage to store information about last used identity providers.
 * Initialized is in `jquery-cpk/common.js`.
 *
 * @author Jiří Kozlovský, original Angular solution
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 *
 * @todo We need to add handler on links of identity providers because we doesn't save new "lips" now!
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
			lastIdentityProviders = null,
			initializedLastIdps = false;

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
						console.log( lip );
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

					resolve( true );
				} catch ( e ) {
					// We doesn't need to break workflow because of this
					if ( CPK.verbose === true ) {
						console.error( e );
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
				if ( jQuery.isArray( rows ) !== true ) {
					resolve( false );
				} else {
					rows.forEach( (row) => {
						jQuery( row ).onClick( lipClickHandler );
					});
					resolve( true );
				}
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
		 * @param {Element} elm
		 * @returns {Promise}
		 */
		function libraryCardsHomeLinkHandler( elm ) {
			// This promise is always be resolved but that's ok - we can be on wrong page
			return new Promise(function( resolve ) {
				if ( typeof elm === "object" ) {
					resolve ( false );
				} else if ( elm.nodeType !== 1) {
					resolve( false );
				} else {
					jQuery( elm ).onClick( toggleHelpContent );
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

			return Promise.result( true );
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
		 * @private Handler for click on
		 * @param {Event} event
		 */
		function lipClickHandler( event ) {
			event.preventDefault();
			event.stopPropagation();

			console.log( "lipClickHandler" );
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