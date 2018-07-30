jQuery( document ).ready( function ( $ ) {
    let searchPath = $( 'input[name="searchPath"]' ).val()

    $( '#searchForm_lookfor' ).keyup( function () {
        $( '#searchclear' ).toggle( Boolean( $( this ).val() ) )
    } )
    $( '#searchclear' ).toggle( Boolean( $( '#searchForm_lookfor' ).val() ) )
    $( '#searchclear' ).click( function () {
        $( '#searchForm_lookfor' ).val( '' ).focus()
        $( this ).hide()
    } )

    /*Google tag manager - send event 2 seconds after stop typing */
    let typingTimer
    let $input = $( '#searchForm_lookfor' )

    $input.on( 'keyup', function () {
        clearTimeout( typingTimer )
        typingTimer = setTimeout( function () {
            dataLayer.push( {
                'event': 'action.search',
                'actionContext': {
                    'eventCategory': 'search',
                    'eventAction': 'whisperer',
                    'eventLabel': $( '#searchForm_lookfor' ).val(),
                    'eventValue': undefined,
                    'nonInteraction': false,
                },
            } )
        }, 2000 )
    } )

    $input.on( 'keydown', function () {
        clearTimeout( typingTimer )
    } )

    /* end google tag manager */

    /* Set autocomplete On page load */
    let query = $( '.search-query' ).val()
    let enabledKeepFacets = $( '.searchFormKeepFilters' ).is( ':checked' )

    /* Set up limit and sort search variables for making search query */
    let limit = $( 'input[name="limit"]' ).val()
    let sort = $( 'input[name="sort"]' ).val()
    let filters = ''

    if (enabledKeepFacets) {
        filters = ''
        $( '.hidden-filter' ).each( function () {
            filters += '&filter[]=' + encodeURIComponent( $( this ).val() )
        } )
    }
    else {
        filters = ''
    }
    /* Set up URL for search  */
    let urlWthoutFacets = searchPath + '?lookfor=' + encodeURIComponent( query )
        + '&type=AllFields&searchTypeTemplate=basic&page=1&database=Solr&limit='
        + limit + '&sort=' + sort + '' + filters + ''

    $( '#run-autocomplete' ).attr( 'href', urlWthoutFacets )
    $( '.searchForm' ).attr( 'action', urlWthoutFacets )

    /* Update autocomplete On some change */
    $( '.search-query' ).on( 'change', function ( event ) {
        query = $( this ).val()
        enabledKeepFacets = $( '.searchFormKeepFilters' ).is( ':checked' )

        if (enabledKeepFacets) {
            filters = ''
            $( '.hidden-filter' ).each( function () {
                filters += '&filter[]=' + encodeURIComponent( $( this ).val() )
            } )
        }
        else {
            filters = ''
            ADVSEARCH.removeAllFilters( true )
        }

        let database = $( 'input[name="database"]' ).val()

        let urlWithFacets = searchPath + '?lookfor0[]=' + encodeURIComponent( query )
            + '&type0[]=AllFields&searchTypeTemplate=basic&page=1&bool0[]=AND&join=AND&database='
            + database + '&limit=' + limit + '&sort=' + sort + '&keepEnabledFilters='
            + enabledKeepFacets + '' + filters + ''

        $( '#run-autocomplete' ).attr( 'href', urlWithFacets )
        $( '.searchForm' ).attr( 'action', urlWithFacets )

        /* Change first query in advanced search to match value in autocomplete */
        ADVSEARCH.clearAdvancedSearchTemplate()
        $( '#query_0 .query-string' ).val( query )
    } )

    $( 'body' ).on( 'click', '#run-autocomplete', function ( event ) {
        event.preventDefault()
        dataLayer.push( {
            'event': 'action.search',
            'actionContext': {
                'eventCategory': 'search',
                'eventAction': 'fulltext',
                'eventLabel': query,
                'eventValue': undefined,
                'nonInteraction': false,
            },
        } )
        /* if autocomplete used in Search/Results, load results async */
        limit = $( 'input[name="limit"]' ).val()
        sort = $( 'input[name="sort"]' ).val()
        let currentUrl = window.location.pathname
        let controller = currentUrl.split( '/' )[1]
        let action = currentUrl.split( '/' )[2]
        let database = $( 'input[name="database"]' ).val()
        let type = $( '#librariesSearchLink' ).hasClass( 'active' ) ? 'Libraries' : 'AllFields'

        if (controller === 'Search' && action === 'Results') {
            ADVSEARCH.updateSearchResults(
                undefined,
                {
                    queryString: '?lookfor0=' + encodeURIComponent( $( '#searchForm_lookfor' ).val() ) + '&type0='
                        + type + '&searchTypeTemplate=basic&database=' + database
                        + '&page=1&bool0=AND&join=AND&limit=' + limit + '&sort=' + sort
                        + '&keepEnabledFilters=' + enabledKeepFacets + '',
                },
                false,
            )
            return false
        }

        $( '.searchForm' ).submit()
    } )

    /*
     * If autocomplete submitted by pressing ENTER, do not reload page
     * statically when on async page with search results.
     */
    $( '.searchForm' ).submit( function ( event ) {
        event.preventDefault()
        limit = $( 'input[name="limit"]' ).val()
        sort = $( 'input[name="sort"]' ).val()
        dataLayer.push( {
            'event': 'action.search',
            'actionContext': {
                'eventCategory': 'search',
                'eventAction': 'fulltext',
                'eventLabel': query,
                'eventValue': undefined,
                'nonInteraction': false,
            },
        } )
        let currentUrl = window.location.pathname
        let controller = currentUrl.split( '/' )[1]
        let action = currentUrl.split( '/' )[2]

        let database = $( 'input[name="database"]' ).val()
        let type = $( '#librariesSearchLink' ).hasClass( 'active' ) ? 'Libraries' : 'AllFields'
        /* Set up URL for search  */
        let url = searchPath + '?lookfor0[]=' + encodeURIComponent( query ) + '&type0[]=' + type
            + '&searchTypeTemplate=basic&page=1&bool0[]=AND&join=AND&limit=' + limit
            + '&sort=' + sort + '&keepEnabledFilters=' + enabledKeepFacets
            + '' + filters + '&database=' + database + ''

        if (controller === 'Search' && action === 'Results') {
            event.preventDefault()
            ADVSEARCH.updateSearchResults(
                undefined,
                {
                    queryString: '?lookfor0=' + encodeURIComponent( $( '#searchForm_lookfor' ).val() )
                        + '&searchTypeTemplate=basic&type0=' + type
                        + '&page=1&bool0=AND&join=AND&limit=' + limit + '&sort=' + sort
                        + '&keepEnabledFilters=' + enabledKeepFacets + '&database=' + database,
                },
                false,
            )
            return false
        }
        else {
            query = $( '#searchForm_lookfor' ).val()
            enabledKeepFacets = $( '.searchFormKeepFilters' ).is( ':checked' )

            if (enabledKeepFacets) {
                filters = ''
                $( '.hidden-filter' ).each( function () {
                    filters += '&filter[]=' + encodeURIComponent( $( this ).val() )
                } )
            }
            else {
                filters = ''
            }

            $( '#run-autocomplete' ).attr( 'href', url )
            $( '.searchForm' ).attr( 'action', url )
            $( location ).attr( 'href', $( '#run-autocomplete' ).attr( 'href' ) )
        }
    } )

    $( '#searchFormKeepFilters' ).on( 'change', function () {
        $( '.applied-filter' ).click()
        $( '.search-query' ).trigger( 'change' )
    } )

    // Update ADVSEARCH_CONFIG
    $.ajax( {
        dataType: 'json',
        async: true,
        type: 'POST',
        url: '/AJAX/JSON?method=getAllAdvancedHandlers',
    } ).done( function ( response ) {
        ADVSEARCH_CONFIG = {'data': response.data}
    } )
} )
