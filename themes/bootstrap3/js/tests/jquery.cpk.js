/**
 * @todo Test `image` ajax transport.
 */
QUnit.module( "jquery.cpk.js" );

QUnit.test( "new AuthorityMetadataPrototype()", function( a ) {
	"use strict";
	var d = new jQuery.fn.cpk.AuthorityMetadata();
	a.ok( d._id === null );
	a.ok( d.auth_biographical_or_historical_data === null );
	a.ok( d.auth_id === null );
	a.ok( d.auth_name === null );
	a.ok( d.auth_year === null );
	a.ok( d.authinfo === null );
	a.ok( d.backlink_url === null );
	a.ok( d.cover_icon_url === null );
	a.ok( d.cover_medium_url === null );
	a.ok( d.cover_preview510_url === null );
	a.ok( d.cover_thumbnail_url === null );
	a.ok( d.links === null );
	a.ok( d.orig_height === null );
	a.ok( d.orig_width === null );
} );

QUnit.test( "AuthorityMetadataPrototype.parseFromObject()", function( a ) {
	"use strict";
	[{
		_id: "5a632b559605583bf25c0d4a",
		auth_biographical_or_historical_data: "Anglický prozaik a esejista.",
		auth_id: "jn19981001921",
		auth_name: "Orwell, George",
		auth_year: "1903-1950",
		authinfo: { auth_id: "jn19981001921" },
		backlink_url: "http://www.obalkyknih.cz/view_auth?auth_id=jn19981001921",
		cover_icon_url: "https://cache.obalkyknih.cz/file/cover/1332410/icon",
		cover_medium_url: "https://cache.obalkyknih.cz/file/cover/1332410/medium",
		cover_preview510_url: "https://cache.obalkyknih.cz/file/cover/1332410/preview510",
		cover_thumbnail_url: "https://cache.obalkyknih.cz/file/cover/1332410/thumbnail",
		links: [{
			link: "http://cs.wikipedia.org/wiki/George_Orwell",
			source_name: "Wikipedie",
			title: "George Orwell"
		}],
		orig_height: "503",
		orig_width: "362"
	}, {
		_id: "5a632b559605583bf25c0d4b",
		auth_biographical_or_historical_data: "Britský spisovatel fantasy literatury žijící v Minneapolis (USA).",
		auth_id: "jn20000807024",
		auth_name: "Gaiman, Neil",
		auth_year: "1960-",
		authinfo: { auth_id: "jn20000807024" },
		backlink_url: "http://www.obalkyknih.cz/view_auth?auth_id=jn20000807024",
		cover_icon_url: "https://cache.obalkyknih.cz/file/cover/1375960/icon",
		cover_medium_url: "https://cache.obalkyknih.cz/file/cover/1375960/medium",
		cover_preview510_url: "https://cache.obalkyknih.cz/file/cover/1375960/preview510",
		cover_thumbnail_url: "https://cache.obalkyknih.cz/file/cover/1375960/thumbnail",
		links: [{
			link: "http://cs.wikipedia.org/wiki/Neil_Gaiman",
			source_name: "Wikipedie",
			title: "Neil Gaiman"
		}],
		orig_height: "503",
		orig_width: "362"
	}].forEach( function( obj ) {
		var d = jQuery.fn.cpk.AuthorityMetadata.parseFromObject( obj );
		a.ok( d._id === obj._id );
		a.ok( d.auth_biographical_or_historical_data === obj.auth_biographical_or_historical_data );
		a.ok( d.auth_id === obj.auth_id );
		a.ok( d.auth_name === obj.auth_name );
		a.ok( d.auth_year === obj.auth_year );
		a.propEqual( d.authinfo, obj.authinfo );
		a.ok( d.backlink_url === obj.backlink_url );
		a.ok( d.cover_icon_url === obj.cover_icon_url );
		a.ok( d.cover_medium_url === obj.cover_medium_url );
		a.ok( d.cover_preview510_url === obj.cover_preview510_url );
		a.ok( d.cover_thumbnail_url === obj.cover_thumbnail_url );
		a.ok( d.links.length === obj.links.length );
		a.ok( d.orig_height === obj.orig_height );
		a.ok( d.orig_width === obj.orig_width );
	} );
} );

QUnit.todo( "new BookMetadataPrototype()", function( a ) {
	//...
} );

QUnit.todo( "BookMetadataPrototype.parseFromObject", function( a ) {
	//...
} );

QUnit.test( "new CoverPrototype()", function( a ) {
	var e1 = jQuery( "div[data-recordid='mkpe4103697']" ),
	    d1 = new jQuery.fn.cpk.Cover( "displayThumbnailWithoutLinks", "Knappův průvodce po Praze a okolí", { nbn: "BOA001-mkpe.4103697" }, "mkpe4103697", e1 );
	a.ok( d1.action === "displayThumbnailWithoutLinks" );
	a.ok( d1.advert === "Knappův průvodce po Praze a okolí" );
	a.propEqual( d1.bibInfo === { nbn: "BOA001-mkpe.4103697" } );
	a.ok( d1.target === e1 );
	a.ok( d1.record === "mkpe4103697" );

	var e2 = jQuery( "div[data-recordid='mkpe4103697']" ),
		d2 = new jQuery.fn.cpk.Cover( "displayThumbnailWithoutLinks", "A hory odpověděly", { isbn: "8002709787", nbn: "cnb002510781", oclc: "(OCoLC)864849691" }, "mzkMZK01-001344329", e2 );
	a.ok( d2.action === "displayThumbnailWithoutLinks" );
	a.ok( d2.advert === "A hory odpověděly" );
	a.propEqual( d2.bibInfo === { isbn: "8002709787", nbn: "cnb002510781", oclc: "(OCoLC)864849691" } );
	a.ok( d2.target === e2 );
	a.ok( d2.record === "mzkMZK01-001344329" );
} );

QUnit.test( "CoverPrototype.parseCoverFromElement", function( a ) {
	jQuery( "div[data-obalkyknihcz]" ).each( function( i, e ) {
		var d = jQuery.fn.cpk.Cover.parseFromElement( e );
		switch( i ) {
			case 0:
				a.ok( d.action === "displayThumbnailWithoutLinks" );
				a.ok( d.advert === "Song to kill a giant  : [Latvian revolution and the Soviet empire's fall]" );
				a.propEqual( d.bibInfo === { isbn: "9934842629", nbn: "BOA001-mkpe.3990705" } );
				a.ok( d.target === e.parentElement );
				a.ok( d.record === "mkpe3990705" );
				break;

			case 1:
				a.ok( d.action === "displayThumbnailWithoutLinks" );
				a.ok( d.advert === "Hnízda" );
				a.propEqual( d.bibInfo === { isbn: "8075322347", nbn: "BOA001-mkpe.4270861"} );
				a.ok( d.target === e.parentElement );
				a.ok( d.record === "mkpe4270861" );
				break;

			case 2:
				a.ok( d.action === "displayAuthorityThumbnailCoverWithoutLinks" );
				a.ok( d.advert === "Small, Bertrice, 1937-" );
				a.propEqual( d.bibInfo === { auth_id: "jn20000605057" } );
				a.ok( d.target === e.parentElement );
				a.ok( d.record === "authAUT10-000057109" );
				break;

			case 3:
				a.ok( d.action === "displayAuthorityThumbnailCoverWithoutLinks" );
				a.ok( d.advert === "Jonasson, Jonas, 1961-" );
				a.propEqual( d.bibInfo === { auth_id: "xx0157366" } );
				a.ok( d.target === e.parentElement );
				a.ok( d.record === "authAUT10-000720804" );
				break;
		}
	} );
} );

QUnit.test( "new CoverCacheItemPrototype()", function( a ) {
	"use strict";
	var d = new jQuery.fn.cpk.CoverCacheItem( "xx0004638" );
	a.ok( d.id === "xx0004638" );
	a.ok( d.icon_url === null );
	a.ok( d.medium_url === null );
	a.ok( d.pdf_url === null );
	a.ok( d.preview_url === null );
	a.ok( d.thumbnail_url === null );
	a.ok( d.summary === null );
	a.ok( d.summary_short === null );
} );

QUnit.test( "CoverCacheItemPrototype.parseFromObject", function( a ) {
	"use strict";
	// TODO Try to pass all object types we defined in `jquery.cpk.js`
	var ad1 = new jQuery.fn.cpk.AuthorityMetadata();
	ad1._id = "5a6358b5643b9644b63645df";
	ad1.auth_biographical_or_historical_data = "Americká spisovatelka romatnických napínavých příběhů a thilerů.";
	ad1.auth_id = "xx0053579";
	ad1.auth_name = "Jackson, Lisa";
	ad1.auth_year = "1952-";
	ad1.authinfo = { auth_id: "xx0053579" };
	ad1.backlink_url = "http://www.obalkyknih.cz/view_auth?auth_id=xx0053579";
	ad1.cover_icon_url = "https://cache.obalkyknih.cz/file/cover/1424222/icon";
	ad1.cover_medium_url = "https://cache.obalkyknih.cz/file/cover/1424222/medium";
	ad1.cover_preview510_url = "https://cache.obalkyknih.cz/file/cover/1424222/preview510";
	ad1.cover_thumbnail_url = "https://cache.obalkyknih.cz/file/cover/1424222/thumbnail";
	ad1.links = [{ source_name: "wikipedie", link: "http://en.wikipedia.org/wiki/Lisa_Jackson_(author)", title: "Lisa Jackson" }];
	ad1.orig_height = "3964";
	ad1.orig_width = "2848";

	[{
		icon_url: null,
		id: "jn20010310318",
		medium_url: "https://cache.obalkyknih.cz/file/cover/1394567/medium",
		pdf_url: null,
		preview_url: "https://cache.obalkyknih.cz/file/cover/1394567/preview510",
		summary: null,
		summary_short: null,
		thumbnail_url: null
	}, ad1].forEach( function( obj ) {
		var d = jQuery.fn.cpk.CoverCacheItem.parseFromObject( obj );

		if ( obj.constructor.name === "AuthorityMetadataPrototype" ) {
			a.ok( d.id === obj.authinfo.auth_id );
			a.ok( d.icon_url === obj.cover_icon_url );
			a.ok( d.medium_url === obj.cover_medium_url );
			a.ok( d.preview_url === obj.cover_preview510_url );
			a.ok( d.thumbnail_url === obj.cover_thumbnail_url );
			a.ok( d.summary_short === obj.auth_biographical_or_historical_data );
		} else {
			a.ok( d.id === obj.id );
			a.ok( d.icon_url === obj.icon_url );
			a.ok( d.medium_url === obj.medium_url );
			a.ok( d.pdf_url === obj.pdf_url );
			a.ok( d.preview_url === obj.preview_url );
			a.ok( d.thumbnail_url === obj.thumbnail_url );
			a.ok( d.summary === obj.summary );
			a.ok( d.summary_short === obj.summary_short );
		}
	} );
} );