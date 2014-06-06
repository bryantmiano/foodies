Foodies.Map = function () {
    var self = this;

    // public properties
    self.keyword = ko.observable();
    self.selectedPlace = ko.observable();

    self.nominations = ko.mapping.fromJS([]);
    self.places = ko.observableArray();
    self.markers = ko.observableArray();
    self.infoWindows = ko.observableArray();
    self.users = ko.mapping.fromJS([]);

    // private properties
    var map;
    var im3 = new google.maps.LatLng(30.228997, -81.584781);  // imobile3 address

    function initialize() {
        initMap();
        initUsers();
    }

    // public methods
    self.searchKeyword = function () {
        var keyword = self.keyword();

        if (keyword) {
            placeSearch(self.keyword());
        }
    }

    // private methods
    function initMap(){
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

    function initUsers(){
        $.get( '/users', function(data){
            ko.mapping.fromJS(data, self.users);
        });
    }

    function placeSearch(keyword) {
        clearMarkers();
        clearPlaces();

        if (keyword) {
            var request = {
                location: im3,
                radius: 5000,
                name: keyword
            };
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
                    createModelForPlace(results[i]);
                }
                if (results.length === 1) {
                    map.setCenter(results[0].geometry.location);
                }

                if (keyword) {
                    $.notify(results.length + ' result(s) found for ' + keyword, 'success');
                }
            }
        }
    }

    function clearMarkers() {
        var markers = self.markers();

        for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
        }
    }

    function clearPlaces() {
        self.places([]);
    }

    function createModelForPlace(place) {
        var place = ko.mapping.fromJS(place);
        self.places.push(place);
    }

    function createMarkerForPlace(place) {
        var markers = self.markers,
            infoWindows = self.infoWindows;

        // create infowindow
        var infowindow = new google.maps.InfoWindow({
            map: map,
            position: place.geometry.location,
            content: '<div class="infowindow">' + place.name + '</div>',
            maxWidth: 200,
            //icon: photos[0].getUrl({'maxWidth': 35, 'maxHeight': 35}),
            title: place.name
        });
        infowindow.close();
        infoWindows.push(infowindow);

        // create marker
        var marker = new google.maps.Marker({
            map: map,
            position: place.geometry.location,
            name: place.name,
            infowindow: infowindow
        });
        markers.push(marker);

        // open infowindow on click
        google.maps.event.addListener(marker, 'click', function () {
            infowindow.open(map, this);
        });
    }

    // realtime socket
    socket.get('/nominations', function (data) {
        ko.mapping.fromJS(data, self.nominations);
    });

    socket.on('message', function notificationReceivedFromServer(message) {
        if (message.model === 'nomination' && message.verb === 'create') {
            var newNomination = ko.mapping.fromJS(message.data);
            self.nominations.push(newNomination);
        }

    });

    // init on load
    google.maps.event.addDomListener(window, 'load', initialize);
};