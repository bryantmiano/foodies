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

    if (typeof io.socket !== "object")
        throw "Socket connection was not found.";

    if (typeof ko.mapping !== "object")
        throw "Knockout Mapping plugin is required.  https://github.com/SteveSanderson/knockout.mapping";

    // socket for observables
    ko.observable.fn.socket = function (options, callback) {
        var socketUrl;
        var obs = this;

        if (options.hasOwnProperty('url')) {
            socketUrl = options.url;
        } else if (options.hasOwnProperty('model')) {
            socketUrl = '/' + options.model;
        }

        socket.get(socketUrl, function (data) {
            if (data instanceof Array) {
                throw "Response for socket url '" + socketUrl + "' and did not return a single object."
            }

            obs(ko.mapping.fromJS(data));

            if (typeof callback == "function") callback(data);
        });

        return obs;
    };

    // socket for observable arrays
    ko.observableArray.fn.socket = function (options, callback) {
        var socketUrl;
        var observableArray = this;

        if (options.hasOwnProperty('url')) {
            socketUrl = options.url;
        } else if (options.hasOwnProperty('model')) {
            socketUrl = '/' + options.model;
        }

        if (!options.hasOwnProperty('mappingOptions')) {
            options.mappingOptions = {};
        }

        socket.get(socketUrl + '?sort=createdAt%20DESC', function (data) {
            if (!data instanceof Array) {
                throw "Response for socket url" + socketUrl + " did not return an array."
            }

            ko.mapping.fromJS(data, options.mappingOptions, observableArray);

            if (typeof callback == "function") callback(data);
        });

        if (options.hasOwnProperty('model')) {
            socket.on(options.model, function (message) {

                //console.log('New comet message: ');
                //console.log(message);

                // handle created event
                if (message.verb === 'created') {
                    var socketGetUrl = socketUrl + '/' + message.id;
                    $.get(socketGetUrl, function (data) {
                        var createdObj = ko.mapping.fromJS(data, options.mappingOptions);
                        observableArray.push(createdObj);
                    });

                // handle destroyed event
                } else if (message.verb === "destroyed") {

                    var destroyedObj = ko.utils.arrayFirst(observableArray(), function (item) {
                        return item.id() === message.id;
                    });

                    observableArray.remove(destroyedObj);
                }
            });
        }
        ;

        return observableArray;
    };
}));