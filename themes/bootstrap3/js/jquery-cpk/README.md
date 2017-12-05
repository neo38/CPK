# jquery-cpk

This code is replacement of previous solution based [Angular][1] library. It's based just on [jQuery][2] and native components of JavaScript self - above all [Worker][3], [Promise][4] etc.

## Structure

There are several more or less standalone parts which all are initialized in [common.js][5]. In this file is also defined basic structure of `CPK` module.

### `CPK.storage`

The most important module which is behind several others - it offers unified and simple access to [`window.localStorage`][6] as well as [`window.sessionStorage`][7]. It also offers fall-back storage `FakeStorage` - which is just in-time-memory storage.

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
    * @returns {Promise}
    */
   function resolveMyStorageInitialization( result ) {
       if ( result === true ) {
           return Promise.resolve( true );
       } else if ( CPK.storage.isStorage( result ) === true ) {
           myStorage = result;
           return Promise.resolve( true );
       } else {
           return Promise.resolve( CPK.storage.initStorage( "fakeStorage" ) );
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

This object contains some widely used methods:

- `CPK.global.showDOM( Element elm )` - removes _hidden_ attribute
- `CPK.global.hideDOM( Element elm )` - adds _hidden_ attribute
- `CPK.global.toggleDOM( Element elm )` - toggles _hidden_ attribute

Also holds `GlobalController` which serves global modal dialog (via `viewModal` GET parameter).

### `CPK.login`

This contains all what's needed for _Federative Login_. Basically it has just one functionality - it offers to users the last identity providers which they are used and creates list with these providers on top of _federative login_ modal dialog.

### `CPK.notifications`

__TBD__

### `CPK.history`

This module handles checked-out items (e.g. page _MyResearch_ -> _Checked Out History_).

### `CPK.favorites`

__TBD__

### `CPK.admin`

Currently contains just `ApprovalController` which controls page _Configurations Approval_ ([approval.phtml][9]).

[1]:https://angularjs.org/
[2]:https://jquery.com/
[3]:https://developer.mozilla.org/en-US/docs/Web/API/Worker
[4]:https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
[5]:https://github.com/moravianlibrary/CPK/blob/bug-776b/themes/bootstrap3/js/jquery-cpk/common.js
[6]:https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
[7]:https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage
[8]:https://developer.mozilla.org/en-US/docs/Web/API/Storage
[9]:https://github.com/moravianlibrary/CPK/blob/bug-776b/themes/bootstrap3/templates/admin/configurations/approval.phtml