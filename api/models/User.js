/**
 * User
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    attributes: {
        name: {
            type: "string",
            required: true,
            maxLength: 40
        },
        email: {
            type: "string",
            unique: true,
            maxLength: 40
        },
        password: {
            type: "string"
        }
    }
};
