# jquery-cpk

This code is replacement of previous solution based [Angular][1] library. It's based just on [jQuery][2] ~~and native components of JavaScript self - above all [Worker][3], [Promise][4] etc.~~

__Note #1__: Originally I used native [Promise][4] but this is not supported in _IE_ (see [table Browser compatibility][18]) so I switched to pure [jQuery deferreds][19] which should work everywhere (e.g. on all [browsers supported by jQuery][20]). Please note, that __examples in this README file still doesn't reflect this change__.

__Note #2__: The whole `jquery-cpk` package is just a transitional package while the rest of our JavaScript code is not still refactored. But there are some goals which are taken in mind (and can affect current solution without obvious reason) - here is the short list of __ultimate goals__:

1. all JavaScript code is loaded via [RequireJS][16]
2. all JavaScript code is [__unobstructive__][21]
3. there is just __one__ _document.onReady_ event handler
4. we should reflect stack we are using - e.g. (from bottom levels) [jQuery][2], [jQuery UI][22] and [Bootstrap 3][23] - which means that we can hide some functionality inside widgets to get better code.

__Note #3__: Some parts of this documents referrs to the future and doesn't reflect current state - __specification firstly -> implementation secondly__.

## Code structure

There are several more or less standalone parts which all are initialized in [common.js][5]. In this file is also defined basic structure of `CPK` module which is the main entry point for all of our code (not now but in future there should be no _wild_ variables in global scope (e.g. `window` - all code will be hidden besides few global objects - `jQuery`, `CPK` etc.)).

Secondary, some functionality is created as plugins for [jQuery][2] (and other basic libraries) self - we have some widely used methods, some widgets where this is usefull... Anyway, this code is also placed in modules where by functionality logic belongs.

### jQuery extensions

Here is a list of provided [jQuery][2] plugins:

- ~~`$.fn.switchAddRemoveFavoriteLinkLabel`~~ (__deprecated__) - ...
- `$.fn.cpkCover` - small plugin that handles covers of the books. Now should be possible write something like this `$( "img.obalka" ).cover()` to get covers of all books rendered on the page.
- `$.fn.cpkRecord` - allows to create `CpkRecord` object from the DOM elements. It also handles favorites and covers functionality... Simply - it encapsulates given DOM with all functionality that we require from single record  (e.g. book, author etc.).

### `CPK.storage`

Our most important module which is used behind several others - it offers unified and simple access to [`window.localStorage`][6] as well as [`window.sessionStorage`][7]. It also came with fall-back storage `FakeStorage` - which is just in-time-memory storage.

The idea behind this _fake_ storage is simple - is better offer same (but limited) functionality to all users than use some heavy conditional logic in the source codes.

Usage of `CPK.storage` is easy:

1. Firstly there is one storage defined when application starts and it can be used anywhere programmer needs (it should be by default type of `localStorage`):
   ```javascript
   // Load value
   CPK.localStorage.getItem( "key" );
   // Save value
   CPK.localStorage.setItem( "key", "value" );
   ```
2. Secondly you can define own storage if you needed (with fall-back into `FakeStorage`):
   ```javascript
   /**
    * @type {Storage}
    */
   var myStorage = null;

   /**
    * @param {Storage|boolean} result
    * @returns {jQuery.Deferred<boolean>}
    */
   function resolveMyStorageInitialization( result ) {
       if ( result === true ) {
           return jQuery.Deferred.resolve( true );
       } else if ( CPK.storage.isStorage( result ) === true ) {
           myStorage = result;
           return jQuery.Deferred.resolve( true );
       } else {
           return jQuery.Deferred.resolve( CPK.storage.initStorage( "fakeStorage" ) );
       }
   }

   /**
    * @param {boolean} result
    */
   function doSomething( result ) {
       // Now you can whatever you want with your storage...
       myStorage.setItem( "key", "value" );
   }

   // Initialize storage
   CPK.storage.initStorage( "sessionStorage" )
       .then( resolveMyStorageInitialization )
       .then( resolveMyStorageInitialization )
       .then( doSomething );
   ```

### `CPK.global`

~~This object contains some widely used methods:~~

- ~~`CPK.global.showDOM( Element elm )` - removes _hidden_ attribute~~
- ~~`CPK.global.hideDOM( Element elm )` - adds _hidden_ attribute~~
- ~~`CPK.global.toggleDOM( Element elm )` - toggles _hidden_ attribute~~

__Note__: Functions above were refactored so now extends [jQuery][2] - e.g. `$.fn.showDom`, `$.fn.hideDom` and `$.fn.toggleDom` but we should drop this `hidden` attribute functionality where it belongs - out - and use just CSS instead.

Also holds `GlobalController` which serves global modal dialog (via `viewModal` GET parameter).

### `CPK.login`

This contains all what's needed for _Federative Login_. Basically it has just one functionality - it offers to users the last identity providers which they are used and creates list with these providers on top of _federative login_ modal dialog.

### `CPK.notifications`

This contains functionality for notifications. They are two sources of notifications: _user_ and _user cards_ - `NotificationsController` (initialized as `CPK.notifications`) handles them both and combine them into single widget (see [notifications.phtml][10] for more details about rendered HTML).

### `CPK.history`

This module handles checked-out items (e.g. page _MyResearch_ -> _Checked Out History_; source file [checkedouthistory.phtml][11]).

### `CPK.favorites`

This modules handles all about favorites. It consists of these parts below the `CPK` module:

- `CPK.favorites.SearchController` - for search page
- `CPK.favorites.RecordController` - for record's detail page
- `CPK.favorites.ListController` - for page where are listed favorites for not-logged user
- `CPK.favorites.Favorite` - prototype object which represents single favorite

And these parts are below the `jQuery`:

- `$.fn.favoriteLink` - small plugin thet handles behavior of _Add/Remove Favorite_ links

### `CPK.admin`

Administration module (located in [admin.js][17]) currently contains just `ApprovalController` which controls page _Configurations Approval_ ([approval.phtml][9]).

## Initialization and module construction

All modules are initialized in [common.js][5] - firstly storage and then rest of all other modules as parallel jobs. This functionality is available by using chains of deferreds.

### Example module

In [common.js][5] is small _module_ `TermsOfUseModal` - is so simple that is inserted directly into [common.js][5] as one function (but should be in standalone file). Now look at code of this _module_:

```javascript
/**
 * @private Shows modal for terms of use if needed.
 * @returns {Promise<boolean>}
 */
function initializeTermsOfUseModal() {

   /**
    * @returns {Promise<boolean>}
    */
   function termsOfUseModalPromise() {
      try {
         var elm = document.getElementById( "termsOfUseModal" );

         if ( elm.nodeType === 1 ) {
            jQuery( elm ).modal( "show" ).unbind( "click" );
         }

         return Promise.resolve( true );
      } catch ( error ) {
         return Promise.resolve( false );
      }
   }

   /**
    * @param {boolean} result
    * @returns {Promise<boolean>}
    */
   function resolveTermsOfUseModalPromise( result ) {
      if ( CPK.verbose === true ) {
         console.info( result === true
            ? "Modal 'Terms of Use' was initialized."
            : "Modal 'Terms of Use' was not initialized." );
      }

      return Promise.resolve( true );
   }

   return Promise
      .resolve( termsOfUseModalPromise() )
      .then( resolveTermsOfUseModalPromise );
}
```

Is initialized between other _non_-important modules as a parallel deferreds and as we can see is pretty obvious how it's work. If we have more complex module we just chain more deferreds to fulfill functionality by safe way.

For more examples see other modules - there are simple ones like [federative-login.js][13] or [global.js][14] but also more complex like [notifications.js][12] or [favorites.js][15].

### Benefits

This way of initializing code has these benefits (some of them will be visible after the rest of our JS code will be refactored):

- all code can be initialized at one point
- less important modules are initialized as parallel jobs
- solution counts with future using of [RequireJS][16]

[1]:https://angularjs.org/
[2]:https://jquery.com/
[3]:https://developer.mozilla.org/en-US/docs/Web/API/Worker
[4]:https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
[5]:https://github.com/moravianlibrary/CPK/blob/bug-776b/themes/bootstrap3/js/jquery-cpk/common.js
[6]:https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
[7]:https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage
[8]:https://developer.mozilla.org/en-US/docs/Web/API/Storage
[9]:https://github.com/moravianlibrary/CPK/blob/bug-776b/themes/bootstrap3/templates/admin/configurations/approval.phtml
[10]:https://github.com/moravianlibrary/CPK/blob/bug-776b/themes/bootstrap3/templates/notifications.phtml
[11]:https://github.com/moravianlibrary/CPK/blob/bug-776b/themes/bootstrap3/templates/myresearch/checkedouthistory.phtml
[12]:https://github.com/moravianlibrary/CPK/blob/bug-776b/themes/bootstrap3/js/jquery-cpk/notifications.js
[13]:https://github.com/moravianlibrary/CPK/blob/bug-776b/themes/bootstrap3/js/jquery-cpk/federative-login.js
[14]:https://github.com/moravianlibrary/CPK/blob/bug-776b/themes/bootstrap3/js/jquery-cpk/global.js
[15]:https://github.com/moravianlibrary/CPK/blob/bug-776b/themes/bootstrap3/js/jquery-cpk/favorites.js
[16]:http://requirejs.org/
[17]:https://github.com/moravianlibrary/CPK/blob/bug-776b/themes/bootstrap3/js/jquery-cpk/admin.js
[18]:https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise#Browser_compatibility
[19]:http://jqfundamentals.com/chapter/ajax-deferreds
[20]:https://jquery.com/browser-support/
[21]:https://en.wikipedia.org/wiki/Unobtrusive_JavaScript
[22]:https://jqueryui.com/
[23]:https://getbootstrap.com/
