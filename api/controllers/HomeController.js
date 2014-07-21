module.exports = {

    index: function (req, res) {
        return res.view({
            nominations: Nomination.find(),
            users: User.find()
        });
    },

    login: function(req, res){
        return res.view();
    },

    logout: function(req, res) {
        req.session.user = null;
        res.redirect('/', 301);
    },

    gif: function(req, res){
        var giphy = require('giphy-wrapper')('dc6zaTOxFJmzC');

        //random offset for random gif
        var offset = Math.floor((Math.random() * 2000) + 1);


        giphy.search('eating', 1, offset, function (err, data) {
            if (err) {
                // check error
            }


            return res.json(data);
        });
    },

    register: function(req, res){
        return res.view();
    },

    dashboard: function(req, res){

        if (!req.session.user) {
            res.redirect('/', 301);
        }

        return res.view();
    },

    notify: function(req, res){
        var color = req.param('color');

        if (req.param('message') === null) {
            return res.json(null);
        }

        if (color === null) {
            color = 'green'
        }

        var Hipchatter = require('hipchatter');
        var hipchatter = new Hipchatter('jdtmZa8GouIRZ1aI3S870E1fV7SUKYRA1wEqGzCM');

        hipchatter.notify(707663,
            {
                message: req.param('message'),
                color: color,
                token: 'omWlgmRe4zmck9eBYjXGor4mJ1y1E5VUevxKb3NR'
            }, function(err){
                return res.json(true);
            });

    },


    /**
     * Overrides for the settings in `config/controllers.js`
     * (specific to MapController)
     */
    _config: {}
};
