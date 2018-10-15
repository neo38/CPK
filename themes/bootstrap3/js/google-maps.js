function initMap () {
    let myLatLng = { lat: 49.78, lng: 15.39 };

    let map = new google.maps.Map( document.getElementById( 'map' ), {
        zoom: 7,
        center: myLatLng,
    } );
    let position = {
        lat: parseFloat( $( '#map-lat' ).val() ),
        lng: parseFloat( $( '#map-lng' ).val() )
    };
    let marker = new google.maps.Marker( {
        position: position,
        map: map,
        title: 'name of library',
    } );
}