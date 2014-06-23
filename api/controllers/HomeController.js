module.exports = {

    index: function (req, res) {
        console.log(Nomination.find());

        return res.view({
            nominations: Nomination.find(),
            users: User.find()
        });
    },

    login: function(req, res){
        return res.view();
    },

    register: function(req, res){
        return res.view();
    },

    dashboard: function(req, res){
        return res.view();
    },

    /**
     * Overrides for the settings in `config/controllers.js`
     * (specific to MapController)
     */
    _config: {}
};
