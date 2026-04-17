const db = require('../config/database');

const Post = {
    // Get all posts with author info, newest first
    findAll: async () => {
        return db('posts')
            .join('users', 'posts.author_id', 'users.id')
            .select('posts.*', 'users.username as author')
            .orderBy('posts.created_at', 'desc');
    },

    // Get post by ID
    findById: async (id) => {
        return db('posts')
            .join('users', 'posts.author_id', 'users.id')
            .where('posts.id', id)
            .select('posts.*', 'users.username as author')
            .first();
    },

    // Create new post
    create: async (text, authorId, x, y) => {
        const result = await db('posts').insert({
            text,
            author_id: authorId,
            x,
            y,
            created_at: db.fn.now(),
            updated_at: db.fn.now()
        });
        return result[0]; // Return inserted ID
    },

    // Update post text
    update: async (id, text) => {
        return db('posts')
            .where({ id })
            .update({
                text,
                updated_at: db.fn.now()
            });
    },

    // Delete post by ID
    delete: async (id) => {
        return db('posts').where({ id }).del();
    },

    // Get posts by author ID
    findByAuthorId: async (authorId) => {
        return db('posts')
            .where({ author_id: authorId })
            .orderBy('created_at', 'desc');
    },

    // Check if user is post author
    isAuthor: async (postId, userId) => {
        const post = await db('posts').where({ id: postId }).first();
        return post && post.author_id === userId;
    },

    // Update post position (x, y coordinates)
    updatePosition: async (id, x, y) => {
        return db('posts')
            .where({ id })
            .update({
                x,
                y,
                updated_at: db.fn.now()
            });
    }
};

module.exports = Post;
