$(function () {
    $.notify.defaults({
        globalPosition: 'top center'
    });
    
    ko.router.map([
        { route: '', module: 'home', title: 'Welcome', nav: true },
        { route: 'test', module: 'about', title: 'About Us', nav: true },
    ]);

    var viewModel = new Foodies.Map();
    viewModel.router = ko.router.vm;
    ko.applyBindings(viewModel);

    ko.router.init();

});