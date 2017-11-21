/**
 * New implementation of history service. Is based on jQuery but is based
 * previous Angular-based code.
 *
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 */

(function($, console) {
    console.log("jquery-cpk/history.js");

    var onHistoryUsernameLinked = function() {};
    var pagesCountDOM = {};

    function CheckedOutHistoryController($q, $log) {
        // Private
        var username = undefined,
            loaderDiv = undefined,
            currentPage = 1,
            pagesCache = [];

        onHistoryUsernameLinked = onHistoryUsernameDirectiveLinked;

        var vm = this;

        // Public
        vm.historyPage = [];
        vm.pageSelected = pageSelected;
        vm.perPage = 10;
        vm.perPageUpdated = perPageUpdated;

        return vm;

        // Public

        //...

        // Private
        //...

    }

    //...

}(jQuery, console));