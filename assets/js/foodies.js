$(function () {
    $.notify.defaults({
        globalPosition: 'top center'
    })

    ko.applyBindings(new Foodies.Map());
});