/**
 * New implementation of "federative login".
 *
 * @author Jiří Kozlovský, original Angular solution
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 */

(function ( $ ) {
	"use strict";

	/**
	 * Federative login controller.
	 * @returns {Object}
	 * @constructor
	 */
	function FederativeLoginController() {
		var _storageKey = "__luidps",
			lastIdentityProviders = null;

		/**
		 * Initializes notifications (just like linkers before for Angular app).
		 * @return {Promise<boolean>}
		 */
		function init() {
			return Promise
				.resolve( initHelp() )
				.then( initLips )
				.then( parseLips )
				.then( updateLips )
				.then( renderLips )
				.then( registerLipsHandler )
				.then( resolveRegisterLipsHandler );
		}

		/**
		 * @private Initializes show/hide help link.
		 * @returns {Promise<boolean>}
		 */
		function initHelp() {
			try {
				var link    = document.getElementById( "login-help-link" ),
				    content = document.getElementById( "login-help-content" );

				$( "h4", link ).click( function onLoginHelpLinkClick() {
					CPK.global.toggleDOM( content );
				} );
			} catch ( error ) {
				if ( CPK.verbose === true ) {
					console.error( error );
				}
			}

			return Promise.resolve( true );
		}

		/**
		 * @private Initializes the last used identity providers.
		 * @param <boolean> result
		 * @returns {Promise<string|null>}
		 */
		function initLips( result ) {
			try {
				var lips;
				lips = CPK.localStorage.getItem( _storageKey );
				return Promise.resolve( lips );
			} catch ( error ) {
				// This mean that the page is opened for the first time
				CPK.localStorage.setItem( _storageKey, JSON.stringify( [] ) );

				return Promise.resolve( null );
			}
		}

		/**
		 * @private Parses the last used identity providers.
		 * @param {string|boolean} lips
		 * @returns {Promise<array>}
		 */
		function parseLips( lips ) {
			/**
			 * @param {string} _lips
			 * @returns {Promise<array>}
			 */
			function parseLipsPromise( _lips ) {
				try {
					var lip;
					lip = JSON.parse( _lips );

					return Promise.resolve( $.isArray( lip ) ? lip : [] );
				} catch ( error ) {
					if ( CPK.verbose === true ) {
						console.error( "Could not parse the last identity provider from localStorage", error, _lips );
					}

					return Promise.resolve( [] );
				}
			}

			if ( lips === null ) {
				return Promise.resolve( [] );
			} else if ( lips.length <= 0 ) {
				return Promise.resolve( [] );
			} else {
				return Promise.resolve( parseLipsPromise( lips ) );
			}
		}

		/**
		 * @private Update the last identity provider with correct URL.
		 * @param {array} lips
		 * @returns {Promise<array>}
		 */
		function updateLips( lips ) {
			try {
				// Setup default language
				var lang = document.body.parentNode.getAttribute( "lang" ),
					newTarget = location.pathname + location.search;

				newTarget += ( newTarget.indexOf( "?" ) >= 0 ? "&" : "?" ) + "auth_method=Shibboleth";

				lips.forEach( function ( lip ) {
					lip.name = lip[ "name_" + lang ];
					lip.href = lip.href.replace( /target=[^&]*/, "target=" + encodeURIComponent( newTarget ) );
				} );

				return Promise.resolve( lips );
			} catch ( error ) {
				if ( CPK.verbose === true ) {
					console.error( "Updating of last identity providers by document's language failed!", error );
				}

				return Promise.resolve( lips );
			}
		}

		/**
		 * @private Renders the last identity providers.
		 * @param {array} lips
		 * @returns {Promise<boolean>}
		 */
		function renderLips( lips ) {
			lastIdentityProviders = lips;

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

				return Promise.resolve( true );
			} catch ( error ) {
				// We doesn't need to break workflow because of this.
				// It just means that we doesn't need render federative
				// login because user is probably logged in.
				return Promise.resolve( false );
			}
		}

		/**
		 * @private Registers onclick event handler on rendered identity providers.
		 * @returns {Promise<boolean>}
		 */
		function registerLipsHandler( result ) {
			if ( result === false ) {
				return Promise.resolve( true );
			}

			try {
				var table = document.getElementById( "table-regular_identity_providers" );
				$( "tr", table ).click( lipClickHandler );
			} catch ( error ) {
				if ( CPK.verbose === true ) {
					console.error( error );
				}
			}

			return Promise.resolve( true );
		}

		/**
		 * @param {boolean} result
		 * @returns {Promise<boolean>}
		 * @private
		 */
		function resolveRegisterLipsHandler( result ) {
			var elm = document.getElementById( "login-help-content-link" );

			return Promise.resolve( libraryCardsHomeLinkHandler( elm ) );
		}

		/**
		 * @private Registers onclick event handler on link in librarycards/home.phtml.
		 * @param {HTMLElement} elm
		 * @returns {Promise<boolean>}
		 */
		function libraryCardsHomeLinkHandler( elm ) {
			if ( typeof elm === "object" ) {
				return Promise.resolve ( true );
			} else if ( elm.nodeType !== 1) {
				return Promise.resolve( true );
			} else {
				elm.addEventListener( "click", toggleHelpContent, true );
				return Promise.resolve( true );
			}
		}

		/**
		 * @private Handler for click on identity provider.
		 * @param {Event} event
		 */
		function lipClickHandler( event ) {
			try {
				if ( event.target.nodeName.toLowerCase() !== "a" ) {
					return;
				}

				var ipJson = event.currentTarget.getAttribute( "data-identityprovider" );
				var ip = JSON.parse( ipJson );

				if ( typeof ip !== "object" ) {
					if ( CPK.verbose === true ) {
						console.error( "Parsing JSON of selected identity provider failed!", event, ipJson, ip );
					}

					return;
				}

				/**
				 * @private Filter callback for filtering LIPs.
				 * @param {Object} lip
				 * @returns {boolean}
				 */
				var filterLips = function filterLipsFunc( lip ) {
					return lip.name !== ip.name;
				};

				// If identity provider is already saved, remove it.
				lastIdentityProviders = lastIdentityProviders.filter( filterLips );

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
		Login.initialize = init;

		return Login;
	}

	/**
	 * @type {FederativeLoginController}
	 */
	CPK.login = new FederativeLoginController();

}( jQuery ));