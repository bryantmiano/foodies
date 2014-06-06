Foodies.User = function () {
    var self = this;

    // public properties
    self.keyword = ko.observable();
    self.selectedPlace = ko.observable();

    self.users = ko.mapping.fromJS([]);

    function initailize(){
        $.get( '/users', function(data){
            ko.mapping.fromJS(data, self.nominations);
        });
    };

    initailize();
};