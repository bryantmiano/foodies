module.exports = {

    index: function (req, res) {
        console.log(Nomination.find());

        return res.view({
            nominations: Nomination.find(),
            users: User.find()
        });
    },

    login: function(req, res){
        if (req.session.user) {
            res.redirect('/dashboard', 301);
        }

        return res.view();
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

    /**
     * Overrides for the settings in `config/controllers.js`
     * (specific to MapController)
     */
    _config: {}
};
