/**
 * Nomination
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    attributes: {
        latitude: {
            type: 'float',
            required: true
        },
        longitude: {
            type: 'float',
            required: true
        },
        name: {
            type: 'string',
            required: true
        },
        address: {
            type: 'string',
            required: true
        },
        leavingAt: {
            type: 'datetime',
            required: false
        },
        user: {
            model: 'user'
        },
        imageUrl: {
            type: 'string',
            required: false
        }
    }

};
