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

    /*
    ko.extenders.so = function(target, precision) {
        //create a writeable computed observable to intercept writes to our observable
        var result = ko.computed({
            read: target,  //always return the original observables value
            write: function(newValue) {
                var current = target(),
                    roundingMultiplier = Math.pow(10, precision),
                    newValueAsNum = isNaN(newValue) ? 0 : parseFloat(+newValue),
                    valueToWrite = Math.round(newValueAsNum * roundingMultiplier) / roundingMultiplier;

                //only write if it changed
                if (valueToWrite !== current) {
                    target(valueToWrite);
                } else {
                    //if the rounded value is the same, but a different value was written, force a notification for the current field
                    if (newValue !== current) {
                        target.notifySubscribers(valueToWrite);
                    }
                }
            }
        }).extend({ notify: 'always' });

        //initialize with current value to make sure it is rounded appropriately
        result(target());

        //return the new computed observable
        return result;
    };
    */


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

                if (typeof callback == "function") callback();
            });

            return this;

        }, this);
    };

    ko.observableArray.fn.socket = function(socketUrl, callback) {
        var observableArray = this;

        var result = ko.computed({
            read: function(){
                socket.get(socketUrl, function (data) {
                    console.log(data);
                    if (!data instanceof Array) {
                        throw "Response for socket url" + socketUrl + " did not return an array."
                    }

                    return ko.mapping.fromJS(data);

                    //console.log(result());

                    // if (typeof callback == "function") callback();
                });
            },
            write: function(){

            }

        }, this);

        result(observableArray());

        return result;
    }
}));