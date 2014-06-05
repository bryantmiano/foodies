module.exports = {

    index: function (req, res) {
        console.log(Nomination.find());

        return res.view({
            nominations: Nomination.find()
        });
    },

    /**
     * Overrides for the settings in `config/controllers.js`
     * (specific to MapController)
     */
    _config: {}
};
