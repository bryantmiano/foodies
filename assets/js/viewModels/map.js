Foodies.Map = function () {
    var self = this;

    // public properties
    self.keyword = ko.observable();
    self.selectedPlace = ko.observable();
    self.selectedUser = ko.observable();

    self.users = ko.mapping.fromJS([]);
    self.nominations = ko.mapping.fromJS([]);

    self.places = ko.observableArray();
    self.markers = ko.observableArray();
    self.infoWindows = ko.observableArray();

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
    };

    self.selectUser = function (user) {
        self.selectedUser(user);

        $.post('/users/login', { id: user.id }, function (response) {
            var modal = $.remodal.lookup[$('#select-foodie').data('remodal')];
            modal.close();

            $.notify('Using as ' + user.name(), 'success');
        });
    };

    // private methods
    function initMap() {

        map = new google.maps.Map(document.getElementById('map'), {
            center: im3,
            zoom: 16
        });

        // put custom marker where im3 is
        var marker = new google.maps.Marker({
            position: im3,
            map: map,
            icon: '/images/im3_logo.png'
        });

        // use custom styled map to hide google places
        var styles = [
            {
                featureType: "poi",
                stylers: [
                    { visibility: "off" }
                ]
            }
        ];
        var styledMap = new google.maps.StyledMapType(styles, {name: "Styled Map"});

        map.mapTypes.set('map_style', styledMap);
        map.setMapTypeId('map_style');

        placeSearch();
    }

    function initUsers() {
        // get list of users
        $.get('/users', function (data) {
            ko.mapping.fromJS(data, self.users);

            // check if user is logged in already
            $.get('/users/checkIfLoggedIn', function (data) {
                var userId = data;
                var user = ko.utils.arrayFirst(self.users(), function (user) {
                    return user.id() == userId;
                });
                self.selectedUser(user);
            });
        });
    }

    function placeSearch(keyword) {
        if (keyword) {
            clearMarkers();
            clearPlaces();

            var request = {
                location: im3,
                radius: 50000,
                name: keyword
            };
            var service = new google.maps.places.PlacesService(map);
            service.nearbySearch(request, callback);
        }

        function callback(results, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                for (var i = 0; i < results.length; i++) {
                    createMarkerForPlace(results[i]);
                }
                if (results.length > 0) {
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
        return place;
    }

    function createMarkerForPlace(place) {
        var markers = self.markers,
            infoWindows = self.infoWindows;

        console.log(place);

        // create the model to attach to marker
        var model = createModelForPlace(place);

        // set to selected place for infowindow template
        self.selectedPlace(model);

        // create infowindow
        var infowindow = new google.maps.InfoWindow({
            map: map,
            position: place.geometry.location,
            content: '<div class="infowindow">' + $('#infowindow-template').html() + '</div>',
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
            infowindow: infowindow,
            place: model
        });
        markers.push(marker);

        // open infowindow on click
        google.maps.event.addListener(marker, 'click', function () {
            infowindow.open(map, this);
            console.log(marker.place);
        });
    }

    // realtime socket methods
    socket.on('message', function notificationReceivedFromServer(message) {
        if (message.model === 'nomination' && message.verb === 'create') {
            var newNomination = ko.mapping.fromJS(message.data);
            self.nominations.push(newNomination);
        }
    });

    socket.get('/nominations', function (data) {
        ko.mapping.fromJS(data, self.nominations);
    });

    // init on load
    google.maps.event.addDomListener(window, 'load', initialize);
};