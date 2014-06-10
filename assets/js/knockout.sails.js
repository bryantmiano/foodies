// ko.sails v0.1 for KnockoutJS
// https://github.com/mehano/knockout.sails
// additional extensions and functions to support sailsjs realtime socket.io requests
// (c) Bryant Miano - bryantmiano@gmail.com
// License: MIT (http://www.opensource.org/licenses/mit-license.php)

(function (factory) {

    if (typeof require === "function" && typeof exports === "object" && typeof module === "object") {
        // CommonJS or Node: hard-coded dependency on "knockout"
        factory(require("knockout"), exports);
    } else if (typeof define === "function" && define["amd"]) {
        // AMD anonymous module with hard-coded dependency on "knockout"
        define(["knockout", "exports"], factory);
    } else {
        // <script> tag: use the global `ko` object, attaching a `mapping` property
        factory(ko)
    }

}(function (ko, undefined) {

    if (typeof socket !== "object")
        throw "Socket connection was not found.";

    if (typeof ko.mapping !== "object")
        throw "Knockout Mapping plugin is required.  https://github.com/SteveSanderson/knockout.mapping";

    // socket for observables
    ko.observable.fn.socket = function(socketUrl, callback) {
        if (!socketUrl) throw "socketUrl cannot be null.";

        var result = ko.computed(function(){
            var observable = this;

            //observable = ko.mapping.fromJS([]);

            socket.get(socketUrl, function (data) {
                if (data instanceof Array) {
                    throw "Response for socket url '" + socketUrl + "' and did not return a single object."
                }

                ko.mapping.fromJS(data, observable);

                if (typeof callback == "function") callback(data);
            });

            return this;

        }, this);
    };

    // socket for observable arrays
    ko.observableArray.fn.socket = function(socketUrl, callback) {
        var observableArray = this;

        observableArray = ko.mapping.fromJS([]);

        socket.get(socketUrl, function (data) {
            //console.log(data);
            if (!data instanceof Array) {
                throw "Response for socket url" + socketUrl + " did not return an array."
            }

            ko.mapping.fromJS(data, {}, observableArray);

            if (typeof callback == "function") callback(data);
        });

        return observableArray;
    };

    ko.extenders.socket = function(target, options) {
        var socketUrl = options.url;

        socket.get(socketUrl, function (data) {
            //console.log(data);
            if (!data instanceof Array) {
                throw "Response for socket url" + socketUrl + " did not return an array."
            }

            ko.mapping.fromJS(data, {}, target);

            console.log(target());

            // if (typeof callback == "function") callback();
        });

        return target;
    };
}));