$(function () {
    var map;
    var infowindow;

    function initialize() {
        var im3 = new google.maps.LatLng(30.228997, -81.584781);

        map = new google.maps.Map(document.getElementById('map'), {
            center: im3,
            zoom: 15
        });

        var infowindow = new google.maps.InfoWindow({
            map: map,
            position: im3,
            content: 'There you are...',
            maxWidth: 200
        });

        var request = {
            location: im3,
            radius: 5000,
            name: ['coffee']
        };
        infowindow = new google.maps.InfoWindow();
        var service = new google.maps.places.PlacesService(map);
        service.nearbySearch(request, callback);
    }

    function handleNoGeolocation(errorFlag) {
        if (errorFlag) {
            var content = 'Error: The Geolocation service failed.';
        } else {
            var content = 'Error: Your browser doesn\'t support geolocation.';
        }

        var options = {
            map: map,
            position: new google.maps.LatLng(60, 105),
            content: content
        };

        var infowindow = new google.maps.InfoWindow(options);
        map.setCenter(options.position);
    }


    function callback(results, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            for (var i = 0; i < results.length; i++) {
                createMarker(results[i]);
            }
        }
    }

    function createMarker(place) {
        console.log(place);

        var placeLoc = place.geometry.location;
        var marker = new google.maps.Marker({
            map: map,
            position: place.geometry.location
        });

        google.maps.event.addListener(marker, 'click', function () {

            var infowindow = new google.maps.InfoWindow({
                map: map,
                position: marker.position,
                content: place.name,
                maxWidth: 200
            });

            infowindow.setContent(place.name);
            infowindow.open(map, this);
        });
    }

    google.maps.event.addDomListener(window, 'load', initialize);

});