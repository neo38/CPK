# Standardy pro psaní kódu (JavaScript)

__UPOZORNĚNÍ: Toto je pracovní verze dokumentu!!!__

Při psaní JavaScript kódu je třeba následovat [JavaScript Style Guide][2] od [jQuery][1]. Pro základní přehled jsou zde tyto odkazy:

- [Style Guide][4]
- [Code Organization][5]

Obecně výborným zdrojem pro informace o JavaScriptu je [MDN][7] - kvalitní a otestované ukázky, přehledy podpory v prohlížečích atp. Pro věci okolo [Promise][8] se mi výborně osvědčil [tento tutoriál][9] - ale i celý ten web [javascript.info][10] je poměrně kvalitní.

Zde je několik dalších bodů, které by měly být při psaní JavaScriptu dodržovány:

- programátor __nemůže__ svévolně přidat novou externí knihovnu
- programátor __nemůže__ svévolně vkládat JavaScript do _views_
- na celý web __by měl__ být jen jeden handler pro `document.onReady`
- všude, kde to jde, __dávat přednost__ nativním _JS_ prostředkům před [jQuery][1]
- přiřazení handlerů nemá být přímo v HTML, ale __vždy__ prostřednictvím skriptu
- _dlouhodobým cílem je veškerý _JS_ načítat pomocí [RequireJS][11] na jednom místě (na konci stránky)_


## Ukázky z existujících kódů

K výše uvedeným pravidlům si uvedeme příklady špatných řešení ve stávajícím kódu:

### Práce s [poli][6]

První příklad je pokus, jak odstranit určitý prvek z pole objektů:

```javascript
for (var i = 0; i < lastIdpsLength; ++i) {
  var lastIdp = lastIdps[i];
  if (lastIdp.name === idp.name) {
    // Remove yourself
    lastIdps.splice(i, 1);
    break;
  }
};
```

Pomineme-li podivný inkrement `i`, je jasné, že není třeba přepisovat __nativní__ funkce:

```javascript
lastIdpsLength.filter(function( ip ) {
  return ip.name !== idp.name;
});
```

Jde to dokonce zkrátit až takto (i když jen od _ES6_):

```javascript
lastIdpsLength.filter( ip => { return ip.name !== idp.name; } );
```

Následuje ukázka, jak nezkracovat pole na určitý počet prvků:

```javascript
// Maximally we will have 3 institutions
if (lastIdps.length > 3)
    lastIdps.pop();
```

Na první pohled je zřejmé, že skript předpokládá, že pole bude mít max. 4 prvky, protože jenak by tam muselo být toto:

```javascript
while ( lastIdps.length > 3 ) {
  lastIdps.pop();
}
```

Ale tak jako tak, i na toto je __nativní__ funkce objektu [Array][6]

```javascript
lastIdps = lastIdps.slice( 0, 3 );
```

#### Shrnutí

Každý by si měl projít, jaké vlastně JavaScript nabízí možnosti a co jeho [základní objekty][12] umí... Vždy totiž platí, že je třeba využívat nativní součásti JavaScriptu než na všechno zneužívat [jQuery][1] nebo dokonce nativní možnosti implementovat po svém.

### Přístup k elementům

__Pro přístup k jednotlivým elementům použít vždy jejich _ID_ namísto CSS třídy.__

Pokud také chci přistoupit k jednotlivému elementu, tak je zbytečné psát `jQuery( "#id" )`, daleko lepší je rovnou `document.getElementById( "id" )`.

Např. pokud chci přidat třídu k elementu u kterého znám ID, tak místo

```javascript
jQuery( "#id_elementu" ).addClass( "nejaka_trida" );
```

rozhodně musím použít toto:

```javascript
document.getElementById( "#id_elementu" ).classList.add( "nejaka_trida" );
```

Jiný příklad - pokud potřebuji přidat _event handlery_ pro řádky v tabulce bude přístup přes [jQuery][1] nejlepší - ale i tak to můžeme zrychlit tím, že selektoru specifikujeme oblast, kde se mají prvky vyskytovat, např.:

```javascript
jQuery( ".trida", "#id" )
```

Vybere všechny prvky s CSS třídou `.trida`, které jsou pod elementem s _ID_ `id`.

#### Shrnutí

[jQuery][1] se musí užívat v rozmné míře, není nutné základní operace nedělat v čistém JavaScriptu, který prohlížeče zpracovávají nejrychleji.

### Použití `setTimeout`/`setInterval`

Tyto funkce __nikdy__ nesmí být použity jako v příkladu ze stávajícího kódu níže:

```javascript
/**
 * Wait 1500 ms for response, then suppose this is the first tab.
 * @type {Number} mastershipRetrieval
 */
var mastershipRetrieval = window.setTimeout(function() {
    window.removeEventListener("storage", onGotFavorites);
    sessionStorage.setItem(storage.name, "[]");
    becomeMaster(true);
}, 1500);
```

Toto je naprosto šílené - nejen, že je limit `1500` vymyšlený a autor spíše doufá, že to vždy bude stačit, ale hlavně přesně na toto jsou [Promises][8] - __nikdy__ není zapotřebí spustit nějaký proces _za chvíli_, až _možná_ stávající proces proběhne - pokud ho zabalíme do _Promise_, pak prostě zavěsíme _callback_ a ono se to samo spustí, žádné odhadování času...

__Pozn.__: Nicméně [setTimeout][13] má i užitečnou vlastnost, že pokud vynecháme parametr času, tak se spustí při příští vhodné příležitosti (kdy ve frontě událostí JS enginu není již nic jiného - jak říká specifikace _as soon as possible_ tzn. _ASAP_ :)). Toto můžeme s úspěchem použít ve chvíli, kdy [Promises][8] nechceme řetězit, ale přesto chceme, aby se některé spustili až po jiných (viz. [common.js][14]).

<<<<<<< HEAD
=======
### Události ([Events][19])

Ve stávajícím kódu se i nacházelo řešení, kdy pro emitování událostí bylo využíváno ukládání do [localStorage][16] (což emituje událost [`storage`][18]) - toto řešení (i obdobné obezličky) je naprosto zbytečné - pokud chcete informovat zbytek kódu o nějaké události využijte [Custom Events][17].

>>>>>>> d134a9bec2de2f626d6acccad8b54e2a65254b11
## Doporučené postupy

Níže najdete doporučené postupy pro některé běžné operace.

### Modul s jednoduchou funkčností

Nejprve si ukážeme, jak jedoduše splnit požadavek na externí skript a nepřidávání _event handlerů_ přímo do HTML.

Zde je jednoduchý modul, který zpracovává tzv. _federative login_:

```javascript
(function () {
	"use strict";

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
					return reject( error );
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
			return Promise.resolve( registerLipsHandler() );
		}

		/**
		 * @private Registers onclick event handler on rendered indentity providers.
		 * @returns {Promise}
		 */
		function registerLipsHandler() {
			return new Promise(function( resolve ) {
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
				//...
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
```

Ten se inicializuje tímto způsobem v [common.js][15]:

```javascript
// Initialize notifications
setTimeout(() => {
    CPK.notifications.initialize( e )
        .then(function( result ) {
            CPK.global.areNotificationsAvailable = ( result === true );

            if ( CPK.verbose === true ) {
                console.info( "Notifications were initialized.", result );
            }
        })
        .catch(function( error ) {
            if ( CPK.verbose === true ) {
                console.error( "Initialization of notifications was rejected.", error );
            }
        });
});
``` 

Nyní k tomu vysvětlení:


__TBD__

[1]:https://jquery.com/
[2]:https://contribute.jquery.org/style-guide/js/
[3]:https://learn.jquery.com/code-organization/concepts/
[4]:https://contribute.jquery.org/style-guide/
[5]:https://learn.jquery.com/code-organization/
[6]:https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
[7]:https://developer.mozilla.org/en-US/docs/Web/JavaScript
[8]:https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
[9]:https://javascript.info/promise-chaining
[10]:https://javascript.info/
[11]:http://requirejs.org/
<<<<<<< HEAD
[12]:https://developer.mozilla.org/cs/docs/Web/JavaScript/Reference/Global_Objects
[13]:https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setTimeout
[14]:https://github.com/moravianlibrary/CPK/blob/d1380d1036d9b1b625cdcbe61908b1c8cfd70be6/themes/bootstrap3/js/jquery-cpk/common.js#L160
[15]:https://github.com/moravianlibrary/CPK/blob/d1380d1036d9b1b625cdcbe61908b1c8cfd70be6/themes/bootstrap3/js/jquery-cpk/common.js#L174
=======
[12]:https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects
[13]:https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setTimeout
[14]:https://github.com/moravianlibrary/CPK/blob/d1380d1036d9b1b625cdcbe61908b1c8cfd70be6/themes/bootstrap3/js/jquery-cpk/common.js#L160
[15]:https://github.com/moravianlibrary/CPK/blob/d1380d1036d9b1b625cdcbe61908b1c8cfd70be6/themes/bootstrap3/js/jquery-cpk/common.js#L174
[16]:https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
[17]:https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Creating_and_triggering_events
[18]:https://developer.mozilla.org/en-US/docs/Web/Events/storage
[19]:https://developer.mozilla.org/en-US/docs/Web/Events
>>>>>>> d134a9bec2de2f626d6acccad8b54e2a65254b11
