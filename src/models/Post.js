const db = require('../config/database');

const Post = {
    findAll: async () => {
        return db('posts')
            .join('users', 'posts.author_id', 'users.id')
            .select('posts.*', 'users.username as author')
            .orderBy('posts.created_at', 'desc');
    },

    findById: async (id) => {
        return db('posts').where({ id }).first();
    },

    create: async (text, authorId, x, y) => {
        return db('posts').insert({
            text,
            author_id: authorId,
            x,
            y,
            created_at: db.fn.now(),
            updated_at: db.fn.now()
        });
    },

    delete: async (id) => {
        return db('posts').where({ id }).del();
    }
};

module.exports = Post;
