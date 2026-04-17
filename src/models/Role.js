const db = require('../config/database');

const VALID_ROLES = ['create', 'modify', 'delete', 'admin'];

const Role = {
    // Assign role to user (idempotent - ignore if already exists)
    assign: async (userId, role) => {
        if (!VALID_ROLES.includes(role)) {
            throw new Error(`Invalid role: ${role}`);
        }

        const exists = await db('user_roles')
            .where({user_id: userId, role})
            .first();

        if (!exists) {
            await db('user_roles').insert({
                user_id: userId,
                role,
                created_at: db.fn.now()
            });
        }
    },

    // Revoke role from user (idempotent)
    revoke: async (userId, role) => {
        if (!VALID_ROLES.includes(role)) {
            throw new Error(`Invalid role: ${role}`);
        }

        await db('user_roles')
            .where({user_id: userId, role})
            .del();
    },

    // Check if user has role
    hasRole: async (userId, role) => {
        if (!VALID_ROLES.includes(role)) {
            throw new Error(`Invalid role: ${role}`);
        }

        const record = await db('user_roles')
            .where({user_id: userId, role})
            .first();

        return !!record;
    },

    // Get all roles for user
    allRolesForUser: async (userId) => {
        const records = await db('user_roles')
            .where({user_id: userId})
            .select('role');

        return records.map(r => r.role);
    },

    // Get all users with their roles
    allWithRoles: async () => {
        const users = await db('users').select('*');

        const usersWithRoles = await Promise.all(
            users.map(async (user) => ({
                ...user,
                roles: await Role.allRolesForUser(user.id)
            }))
        );

        return usersWithRoles;
    }
};

module.exports = Role;
