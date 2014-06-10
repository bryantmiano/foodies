Foodies.Map = function () {
    var self = this;

    // public properties
    self.keyword = ko.observable();
    self.selectedPlace = ko.observable();
    self.selectedDetailedPlace = ko.observable();
    self.selectedUser = ko.observable().socket('/users/getLoggedInUser');

    self.users = ko.observableArray().socket('/users');
    self.nominations = ko.observableArray().socket('/nominations');
    self.sortedNominations = ko.computed(function(){
        var data = self.nominations().sort(function (l, r) {
            var leftDate = Date.parse(l.createdAt());
            var rightDate = Date.parse(r.createdAt());
            return leftDate < rightDate ? 1 : -1;
        });

        console.log(data);
        return data;
    });

    self.places = ko.observableArray();
    self.markers = ko.observableArray();
    self.infoWindows = ko.observableArray();

    // private properties
    var map;
    var im3 = new google.maps.LatLng(30.228997, -81.584781);  // imobile3 address
    var placesService;

    function initialize() {
        initMap();

        placesService = new google.maps.places.PlacesService(map);
        placeSearch();
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

    self.nominatePlace = function (place) {

        console.log(ko.toJS(self.selectedUser()));

        var newNomination = {
            name: place.name(),
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
            address: place.formatted_address(),
            userId: self.selectedUser().id()
        };

        $.post('/nominations/create', newNomination, function (response) {
            $.notify('You wanna eat there!', 'success');
        });
    };

    self.destroyNomination = function (nomination) {
        socket.delete('/nominations/destroy/' + nomination.id(), function (response) {
            console.log(response);
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
        map.setMapTypeId('map_style')
    }

    function placeSearch(keyword) {
        //if (keyword) {
        clearMarkers();
        clearPlaces();

        var request = {
            location: im3,
            radius: 50000,
            name: keyword
        };
        placesService.nearbySearch(request, callback);

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

    function getPlaceDetails(reference) {
        var request = {
            reference: reference
        };

        placesService.getDetails(request, callback);

        function callback(place, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                console.log(place);

                var model = createModelForPlace(place);
                self.selectedDetailedPlace(model);
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
        //console.log(place);
        var place = ko.mapping.fromJS(place);

        place.imageUrl = ko.computed(function () {
            var url;
            if (place.hasOwnProperty('photos') && place.photos().length > 0) {
                url = place.photos()[0].getUrl({'maxWidth': 250, 'maxHeight': 250})
            }
            else {
                url = place.icon();
            }
            return url;
        });

        place.formatted_website = ko.computed(function () {
            var url;
            if (place.hasOwnProperty('website')) {
                url = place.website();
            } else {
                url = null;
            }
            return url;
        })

        self.places.push(place);
        return place;
    }

    function createMarkerForPlace(place) {
        var markers = self.markers,
            infoWindows = self.infoWindows;

        // create the model to attach to marker
        var model = createModelForPlace(place);

        // set to selected place for infowindow template
        self.selectedPlace(model);

        // create infowindow
        var infowindow = new google.maps.InfoWindow({
            map: map,
            position: place.geometry.location,
            content: $('#infowindow-template').html(),
            maxWidth: 500,
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
            getPlaceDetails(place.reference);

            var infoWindows = self.infoWindows();

            for (var i = 0; i < infoWindows.length; i++) {

                infoWindows[i].close();
            }

            infowindow.open(map, this);
        });
    }

    // realtime socket methods
    socket.on('message', function notificationReceivedFromServer(message) {
        if (message.model === 'nomination' && message.verb === 'create') {
            var newNomination = ko.mapping.fromJS(message.data);
            self.nominations.push(newNomination);
        }
    });

    // init on load
    google.maps.event.addDomListener(window, 'load', initialize);
};