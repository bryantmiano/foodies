$(function () {
    ko.applyBindings(new Foodies.Map(), $('#foodies-container')[0]);
    ko.applyBindings(new Foodies.User(), $('#select-foodie')[0]);
});