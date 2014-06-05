Foodies.Map = function () {

    // public properties
    var self = this;
    self.keyword = ko.observable();

    // private properties
    var map;

    // public methods
    self.searchKeyword = function (value) {
        placeSearch(self.keyword());
    }

    // private methods
    function initialize() {
        var im3 = new google.maps.LatLng(30.228997, -81.584781);

        map = new google.maps.Map(document.getElementById('map'), {
            center: im3,
            zoom: 15
        });

        var infowindow = new google.maps.InfoWindow({
            map: map,
            position: im3,
            content: '<div class="infowindow">There you are...</div>',
            maxWidth: 400
        });
        placeSearch();
    }

    function placeSearch(keyword) {
        if (keyword) {

        }
        else {
            var request = {
                location: im3,
                radius: 5000,
                types: ['food', 'restaurant', 'cafe', 'coffee']
            };
        }
        var service = new google.maps.places.PlacesService(map);
        service.nearbySearch(request, callback);

        function callback(results, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                for (var i = 0; i < results.length; i++) {
                    createMarkerForPlace(results[i]);
                }
            }
        }
    }

    function createMarkerForPlace(place) {
        var photos = place.photos;

        var marker = new google.maps.Marker({
            map: map,
            position: place.geometry.location
        });

        google.maps.event.addListener(marker, 'click', function () {

            var infowindow = new google.maps.InfoWindow({
                map: map,
                position: place.geometry.location,
                content: place.name,
                maxWidth: 200,
                icon: photos[0].getUrl({'maxWidth': 35, 'maxHeight': 35}),
                title: place.name
            });

            infowindow.setContent(place.name);
            infowindow.open(map, this);

        });
    }

    // init on load
    google.maps.event.addDomListener(window, 'load', initialize);
};