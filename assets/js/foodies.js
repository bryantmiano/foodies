$(function () {

    $.notify.defaults({
        globalPosition: 'bottom left'
    });

    ko.router.map([
        { route: '', module: 'home', title: 'Welcome', nav: true },
        { route: 'test', module: 'about', title: 'About Us', nav: true },
    ]);

    if ($('#foodies-container').length > 0) {
        Foodies.Init();
    }

    $('#register-form').submit(function(e){
        var form = $(this);
        e.preventDefault();

        $.post('/user', form.serialize(), function(response){
            form.find('button').notify('User was created.', {className: 'success', position: 'right'});
            $('#return-to-login').slideDown('fast');
        }).fail(function(response){
            form.find('button').notify('Oops.  Something went totally wrong.', {position: 'right'});
        });
    });

    $('#login-form').submit(function(e){
        var form = $(this);
        e.preventDefault();

        $.post('/user/login', form.serialize(), function(response){
            window.location.href = '/dashboard';
        }).fail(function(response){
            var response = $.parseJSON(response.responseText);
            form.find('button').notify(response.error, {position: 'right'});
        });
    });

    var gifMe = function(){
        $('#food-gif').fadeOut();
        $.get('/gif', function(response){
            $('#food-gif').attr('src', response.data[0].images.fixed_height.url);
            $('#food-gif').fadeIn();
        });
    };
    gifMe();

    $('#food-gif').click(function(){
        gifMe();
    });
});

var socket = io.socket;

Foodies = {};

Foodies.Init = function(){
    var viewModel = new Foodies.Map();
    ko.applyBindings(viewModel);

    $.blockUI({
        message: '<div class="spinner"><div class="double-bounce1"></div><div class="double-bounce2"></div></div> Initializing flux capacitor',
    });

    io.socket.on('connect', function () {
        $.unblockUI();
    });
};

Foodies.Nomination = function (data) {
    var self = this;

    ko.mapping.fromJS(data, {}, self);

    self.newCommentText = ko.observable();

    self.isSelectedUserCreator = ko.computed(function(){
        if (!self.user) return false;
        return self.user.id() === self.selectedUser.id();
    });

    self.isSelectedUserJoined = ko.computed(function(){
        var isFound = false;
        if (!self.user) return false;
        ko.utils.arrayForEach(self.votes(), function(vote){
            if (vote.user() === self.selectedUser.id()) isFound = true;
        });
        return isFound;
    });

    self.submitComment = function(nomination) {
        console.log(nomination);
        var newComment = {
            text: self.newCommentText(),
            user: self.user.id(),
            nomination: nomination.id()
        };
        $.post('/comment', newComment, function(data){
            console.log(data);
        });
    }
};

Foodies.Map = function () {
    var self = this;

    var nominationMapping = {
        create: function (options) {
            options.data.selectedUser = ko.toJS(self.selectedUser());

            return new Foodies.Nomination(options.data);
        }
    };

    // public properties
    self.keyword = ko.observable();
    self.isEatBtnVisible = ko.observable(true);
    self.today = ko.observable(moment().format('dddd, MMM Do'));

    self.selectedNomination = ko.observable();
    self.selectedPlace = ko.observable();
    self.selectedDetailedPlace = ko.observable();
    self.selectedPlaceVotes = ko.observable();
    self.selectedUser = ko.observable().socket({ url: '/user/getLoggedInUser'});

    self.users = ko.observableArray().socket({ model: 'user' });

    self.nominations = ko.observableArray().socket({ model: 'nomination', mappingOptions: nominationMapping });
    self.sortedNominations = ko.computed(function () {
        var data = self.nominations().sort(function (l, r) {
            return Date.parse(l.createdAt()) < Date.parse(r.createdAt()) ? 1 : -1; // sort by createdAt date
        });

        var todayOnly  = ko.utils.arrayFilter(data, function(nomination) {
            var creationDate = moment(nomination.createdAt());
            var today = moment().startOf('day');
            return creationDate > today;
        });

        return todayOnly;
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

        io.socket.post('/user/login', { id: user.id() }, function (response) {
            var modal = $.remodal.lookup[$('#select-foodie').data('remodal')];
            modal.close();

            $.notify('Using as ' + user.name(), 'success');
        });
    };

    self.selectNomination = function(nomination){
        clearMarkers();
        clearPlaces();

        console.log(ko.toJS(nomination));

        self.isEatBtnVisible(false);
        self.selectedNomination(nomination);

        getPlaceDetails(nomination.reference(), function(){
            var place = self.selectedDetailedPlace();

            var location = new google.maps.LatLng(place.geometry.location.lat()(), place.geometry.location.lng()());

            var marker = new google.maps.Marker({
                map: map,
                position: location,
                name: place.name
            });

            self.markers.push(marker);

            map.panTo(location);
            map.setZoom(14);

            $.get('/nomination/votes', { id: nomination.id() }, function(votes){
                var mappedVotes = ko.mapping.fromJS(votes, {}, self.selectedPlaceVotes);
            });
        });

    };

    self.nominatePlace = function (place) {
        var newNomination = {
            name: place.name(),
            latitude: place.geometry.location.lat()(),
            longitude: place.geometry.location.lng()(),
            address: place.formatted_address(),
            user: self.selectedUser(),
            reference: place.reference()
        };

        $.post('/nomination/create', newNomination, function (response) {
            $.notify('Hipchat notified that you want to nom nom there.', 'success');
            $.post('/notify', {
                color: "green",
                message: '<b>' + self.selectedUser().name().capitalize() + '</b> wants to <i>nom nom</i> at <b>' + response.name + '</b>! <br/> <a href="http://foodies.herokuapp.com/dashboard">View</a>'
            });
        });
    };

    self.joinNomination = function (nomination) {

        var newVote = {
            nomination: nomination.id(),
            user: self.selectedUser()
        };

        $.post('/vote/create', newVote, function (response) {
            $.notify('You joined the ' + nomination.name() + ' party.', 'success');
            self.selectNomination(nomination);

            console.log(nomination.votes().length);

            $.post('/notify', {
                color: "yellow",
                message: '<b>' + self.selectedUser().name().capitalize() + '</b> joined the <b>' + nomination.name() + '</b> lunch party! <br/> <b>' + (nomination.votes().length + 2) + '</b> peeps now want to go. <br/> <a href="http://foodies.herokuapp.com/dashboard">View</a>'
            });
        });
    };

    self.leaveNomination = function(nomination){

        var vote = ko.utils.arrayFirst(nomination.votes(), function (vote) {
            return vote.user() === self.selectedUser().id();
        });

        if (vote){
            $.ajax({
                url: '/vote/destroy/' + vote.id(),
                type: 'DELETE',
                success: function (result) {
                    $.notify('You left the ' + nomination.name() + ' party.  :(', 'success');
                    self.selectNomination(nomination);
                    $.post('/notify', {
                        color: "yellow",
                        message: '<b>' + self.selectedUser().name().capitalize() + '</b> left the <b>' + nomination.name() + '</b> lunch party... <br/> <b>'  + (nomination.votes().length) + '</b> peeps still want to go. <br/> <a href="http://foodies.herokuapp.com/dashboard">View</a>'
                    });
                }
            });
        }
    };

    self.destroyNomination = function (nomination) {
        $.ajax({
            url: '/nomination/destroy/' + nomination.id(),
            type: 'DELETE',
            success: function (result) {
                $.notify('Deleted.', 'success');

                $.post('/notify', {
                    color: "gray",
                    message: '<b>' + self.selectedUser().name().capitalize() + '</b> no longer wants to <i>nom nom</i> at <b>' + nomination.name() + '</b>... <br/> <a href="http://foodies.herokuapp.com/dashboard">View</a>'
                });
            }
        });
    };

    self.slideDown = function (element) {
        $(element).hide().slideDown('fast');
    };

    self.slideUp = function (element) {
        $(element).slideUp('fast', function () {
            $(element).remove();
        });
    };

    io.socket.on('vote', function (message) {
        var nominationId;

        // when a new vote is created or destroyed, get the updated nomination
        if (message.verb === 'created') {
            nominationId = message.data.nomination;


        } else if (message.verb === 'destroyed') {
            nominationId = message.previous.nomination.id;
        }

        io.socket.get('/nomination/' + nominationId, function (data) {
            var updatedNomination = ko.mapping.fromJS(data, nominationMapping);

            var oldNomination = ko.utils.arrayFirst(self.nominations(), function (nomination) {
                return nomination.id() === data.id;
            });

            self.nominations.replace(oldNomination, updatedNomination);
        });

    });

    // private methods
    function initMap() {

        map = new google.maps.Map(document.getElementById('map'), {
            center: im3,
            zoom: 16,
            mapTypeControl: false
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
        if (!keyword) return;

        self.selectedPlace(null);
        self.selectedDetailedPlace(null);
        self.isEatBtnVisible(true);

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

                map.setZoom(13);
            }
        }
    }

    function getPlaceDetails(reference, outerCallback) {
        var request = {
            reference: reference
        };

        placesService.getDetails(request, callback);

        function callback(place, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                var model = createModelForPlace(place);
                self.selectedDetailedPlace(model);

                if (outerCallback) outerCallback();
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


// init on load
    google.maps.event.addDomListener(window, 'load', initialize);
}
;

ko.bindingHandlers.enterkey = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        var allBindings = allBindingsAccessor();

        $(element).on('keypress', function (e) {
            var keyCode = e.which || e.keyCode;
            if (keyCode !== 13) {
                return true;
            }

            var target = e.target;
            target.blur();

            allBindings.enterkey.call(viewModel, viewModel, target, element);

            return false;
        });
    }
};

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}