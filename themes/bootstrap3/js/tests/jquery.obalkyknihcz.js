QUnit.module( "jquery.obalkyknihcz.js" );

var testData = [
	{ id: "test_item_1", summary_short: "Test short summary of the first cache item.", thumbnail_url: "http://www.test.cz/thumbnail1.png" },
	{ id: "test_item_2", summary_short: "Test short summary of the second cache item.", thumbnail_url: "http://www.test.cz/thumbnail2.png" },
	{ id: "test_item_3" },
	{ id: "test_item_4", summary_short: "Test short summary of the fourth cache item.", thumbnail_url: "http://www.test.cz/thumbnail4.png" }
];

QUnit.testStart( function( details ) {
	var testCacheItem1 = new jQuery.fn.cpk.CoverCacheItem( testData[0].id );
	testCacheItem1.summary_short = testData[0].summary_short;
	testCacheItem1.thumbnail_url = testData[0].thumbnail_url;

	var testCacheItem2 = new jQuery.fn.cpk.CoverCacheItem( testData[1].id );
	testCacheItem2.summary_short = testData[1].summary_short;
	testCacheItem2.thumbnail_url = testData[1].thumbnail_url;

	var cacheData = {};
	cacheData[ testData[0].id ] = testCacheItem1;
	cacheData[ testData[1].id ] = testCacheItem2;

	window.localStorage.setItem( "cpk_obalkyknihcz", JSON.stringify( cacheData ) );
} );

QUnit.testDone( function( details ) {
	window.localStorage.removeItem( "cpk_obalkyknihcz" );
} );

QUnit.test( "CacheHandler.getCacheItem", function( a ) {
	var t1 = jQuery.fn.obalkyknihcz.getCacheItem( testData[0].id );
	a.ok( ( t1 !== null && jQuery.type( t1 ) === "object" ) );
	a.ok( t1.id === testData[0].id );
	a.ok( t1.summary_short === testData[0].summary_short );
	a.ok( t1.thumbnail_url === testData[0].thumbnail_url );

	var t2 = jQuery.fn.obalkyknihcz.getCacheItem( testData[1].id );
	a.ok( ( t2 !== null && jQuery.type( t2 ) === "object" ) );
	a.ok( t2.id === testData[1].id );
	a.ok( t2.summary_short === testData[1].summary_short );
	a.ok( t2.thumbnail_url === testData[1].thumbnail_url );

	var t3 = jQuery.fn.obalkyknihcz.getCacheItem( testData[2].id );
	a.ok( t3 === null );
} );

QUnit.test( "CacheHandler.setCacheItem", function( a ) {

	// 1. insert new cache item
	var t1 = jQuery.fn.cpk.CoverCacheItem.parseFromObject( testData[ 3 ] );
	a.ok( t1.id === testData[ 3 ].id, "CoverCacheItemPrototype.id" );
	a.ok( t1.summary_short === testData[ 3 ].summary_short, "CoverCacheItemPrototype.summary_short" );
	a.ok( t1.thumbnail_url === testData[ 3 ].thumbnail_url, "CoverCacheItemPrototype.thumbnail_url" );
	jQuery.fn.obalkyknihcz.setCacheItem( t1.id, t1 );

	// 2. retrieve it, test it and modify it
	var t2 = jQuery.fn.obalkyknihcz.getCacheItem( t1.id ),
	    ts2 = "Full summary of the fourth cache item is nearly shorter than short summary.",
	    ti2 = "http://www.test.cz/icon4.png";
	a.ok( t2.id === testData[ 3 ].id, "CoverCacheItemPrototype.id" );
	a.ok( t2.summary_short === testData[ 3 ].summary_short, "CoverCacheItemPrototype.summary_short" );
	a.ok( t2.thumbnail_url === testData[ 3 ].thumbnail_url, "CoverCacheItemPrototype.thumbnail_url" );
	t2.summary = ts2;
	t2.icon_url = ti2;
	jQuery.fn.obalkyknihcz.setCacheItem( t2.id, t2 );

	// 3. retrieve it and test it again
	var t3 = jQuery.fn.obalkyknihcz.getCacheItem( t1.id );
	a.ok( t3.id === testData[ 3 ].id, "CoverCacheItemPrototype.id" );
	a.ok( t3.summary_short === testData[ 3 ].summary_short, "CoverCacheItemPrototype.summary_short" );
	a.ok( t3.thumbnail_url === testData[ 3 ].thumbnail_url, "CoverCacheItemPrototype.thumbnail_url" );
	a.ok( t3.summary === ts2, "CoverCacheItemPrototype.summary" );
	a.ok( t3.icon_url === ti2, "CoverCacheItemPrototype.icon_url" );
} );