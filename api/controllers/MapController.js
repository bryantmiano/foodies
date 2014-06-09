/**
 * MapController
 *
 * @module      :: Controller
 * @description    :: A set of functions called `actions`.
 *
 *                 Actions contain code telling Sails how to respond to a certain type of request.
 *                 (i.e. do stuff, then send some JSON, show an HTML page, or redirect to another URL)
 *
 *                 You can configure the blueprint URLs which trigger these actions (`config/controllers.js`)
 *                 and/or override them with custom routes (`config/routes.js`)
 *
 *                 NOTE: The code you write here supports both HTTP and Socket.io automatically.
 *
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

module.exports = {

    index: function (req, res) {
        return res.view({
            nominations: Nomination.find()
        });
    },

    passmarket: function(req, res) {
        var pm = new sails.passmarket({
            agencyId: 1018,
            apiKey: '4y0op5elm67xgn60igj6',
            apiSecretKey: 'x7f4l695yr5ijmrygo9wipox49ihxqy5dffed5b2',
            identifier: '10e758f0-c449-4cea-9c2a-d909e05fdd86'
        });

        var data = pm.search({ phrase: 'burrito' }, function(data){
            return res.json(data);
        });

    },

    /**
     * Overrides for the settings in `config/controllers.js`
     * (specific to MapController)
     */
    _config: {}
};
