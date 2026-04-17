const db = require('../config/database');

const User = {
    findByUsername: async (username) => {
        return db('users').where({ username }).first();
    },

    findById: async (id) => {
        return db('users').where({ id }).first();
    },

    create: async (username, passwordHash) => {
        return db('users').insert({ username, password_hash: passwordHash });
    }
};

module.exports = User;
