# jquery-cpk

This code is replacement of previous solution based [Angular][1] library. 
It's based just on [jQuery][2] and native components of JavaScript self - 
above all [Worker][3], [Promise][4] etc.

## Structure

There are several more or less standalone parts which all are initialized in 
[common.js][5]. In this file is also defined basic structure of `CPK` module.

### `CPK.storage`

The most important module which is behind several others - it offers unified 
and simple access to [`window.localStorage`][6] as well as [`window
.sessionStorage`][7]. If used browser doesn't support requested storage the `FakeStorage` will be
 returned. This fake storage has same API as normal storage and is used to 
 provide (at least some) functionality for all users. 

Usage of `CPK.storage` is easy:

1. Firstly there is one storage defined when application starts and it can be
 used anywhere programmer need:
   ```javascript
   CPK.localStorage.setItem( "key", "value" );
   ```
2. Secondly you can define own storage if you needed:
   ```javascript
   var newStorage;
   CPK.storage.initStorage( "localStorage" )
       .then(function( result ) {
           // We need to check if storage was really initialized
           if ( CPK.storage.isStorage( result ) === true ) {
               newStorage = result;
           }
       })
       .catch(function( error ) {
           console.error( "Storage was not initialized!", error );
       });
   ```

### `CPK.global`

__TBD__

### `CPK.login`

__TBD__

### `CPK.notifications`

__TBD__

### `CPK.favorites`

__TBD__

### `CPK.history`

__TBD__

### `CPK.admin`

__TBD__

[1]:https://angularjs.org/
[2]:https://jquery.com/
[3]:https://developer.mozilla.org/en-US/docs/Web/API/Worker
[4]:https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
[5]:https://github.com/moravianlibrary/CPK/blob/bug-776b/themes/bootstrap3/js/jquery-cpk/common.js
[6]:https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
[7]:https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage
