/**
 * NominationController
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

    users: function (req, res) {
        var nominationId = req.param('id');

        if (!nominationId) {
            res.status(400);
            res.json('Nomination id is required');
        }
        /*

        var nominationVotes;
        var users = [];

        Vote.find({ nomination: nominationId }).exec(function (err, votes) {
            nominationVotes = votes;

            for (var vote in nominationVotes) {
                console.log(vote);

                User.findOne({ id: vote.user }).exec(function(err, user) {
                    //console.log(user);
                    users.push(user);
                });
            }
            //console.log(users);
            res.json(users);
        });

        */

        Vote.find({ nomination: nominationId }).populate('user').exec(function(e, r){
           res.json(r);
        });
    },

    /**
     * Overrides for the settings in `config/controllers.js`
     * (specific to NominationController)
     */
    _config: {}
};
