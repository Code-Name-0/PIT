const db = require('../config/database');

const User = {
    // Find user by username
    findByUsername: async (username) => {
        return db('users').where({ username }).first();
    },

    // Find user by ID
    findById: async (id) => {
        return db('users').where({ id }).first();
    },

    // Find all users (with their roles)
    findAll: async () => {
        return db('users').select('*');
    },

    // Create new user
    create: async (username, passwordHash) => {
        const result = await db('users').insert({
            username,
            password_hash: passwordHash,
            created_at: db.fn.now()
        });
        return result[0]; // Return inserted ID
    },

    // Update user password
    updatePassword: async (id, passwordHash) => {
        return db('users').where({ id }).update({ password_hash: passwordHash });
    },

    // Check if username exists
    usernameExists: async (username) => {
        const user = await db('users').where({ username }).first();
        return !!user;
    },

    // Find guest user
    findGuest: async () => {
        return db('users').where({ username: 'guest' }).first();
    }
};

module.exports = User;
