/**
 * UserController
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
    _config: {},

    login: function(req, res){
        var email = req.param('email');
        var password = req.param('password');

        User.findOneByEmail(email, function(err, user){
            if (err) res.json({ error: 'DB error' }, 500);

            if (user) {
                if (user.password === password) {
                    req.session.user = user;
                    res.json(user);
                } else {
                    res.json({ error: 'Invalid password' }, 400);
                }

            } else {
                res.json({ error: 'User not found' }, 404);
            }
        });
    },

    /*
    login: function (req, res) {
        var userId = req.param('id');

        if(!userId) {
            res.status(400);
            res.json('User id is required');
        }

        User.findOne({ id: userId }, function (err, user) {
     req.session.user = user;
     res.json(user);
        });
    },

    */

    getLoggedInUser: function (req, res) {
        if (req.session.user) {
            res.json(req.session.user);
        } else {
            res.json(null);
        }
    }

};
