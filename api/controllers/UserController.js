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

    login: function (req, res) {
        var name = req.param('name');

        if (!name) {
            res.json(null);
        }

        User.findOneByName(name, function (err, user) {
            if (err) res.json({ error: 'DB error' }, 500);

            if (!user) {
                User.create({
                    name: name
                }).exec(function (err, newUser) {
                    req.session.user = newUser;
                    res.json(newUser);
                });
            } else {
                // password match
                req.session.user = user;
                res.json(user);
            }
        });
    },

    logout: function (req, res) {
        req.session.user = null;
        console.log('redirecting');
        res.redirect('/', 301);
    },

    getLoggedInUser: function (req, res) {
        if (req.session.user) {
            res.json(req.session.user);
        } else {
            res.json(null);
        }
    }

};
