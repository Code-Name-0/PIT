const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/role-check');
const User = require('../models/User');
const Role = require('../models/Role');

// GET /admin - Admin panel (requires admin role)
router.get('/admin', requireAdmin, async (req, res) => {
    try {
        // Get all users with their roles
        const usersWithRoles = await Role.allWithRoles();

        res.render('admin.html', {
            users: usersWithRoles
        });

    } catch (error) {
        console.error('Error loading admin panel:', error);
        res.status(500).render('404.html', {
            message: 'Failed to load admin panel'
        });
    }
});

// POST /api/admin/grant-role - Assign role to user (admin only)
router.post('/api/admin/grant-role', requireAdmin, async (req, res) => {
    try {
        const { user_id, role } = req.body;

        // Validation
        if (!user_id || !role) {
            return res.status(400).json({ success: false, error: 'User ID and role are required' });
        }

        // Validate role is one of: create, modify, delete, admin
        const validRoles = ['create', 'modify', 'delete', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ success: false, error: 'Invalid role' });
        }

        // Check user exists
        const user = await User.findById(user_id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Assign role (idempotent - won't error if already assigned)
        await Role.assign(user_id, role);

        res.json({ success: true });

    } catch (error) {
        console.error('Error granting role:', error);
        res.status(500).json({ success: false, error: 'Failed to grant role' });
    }
});

// POST /api/admin/revoke-role - Remove role from user (admin only)
router.post('/api/admin/revoke-role', requireAdmin, async (req, res) => {
    try {
        const { user_id, role } = req.body;

        // Validation
        if (!user_id || !role) {
            return res.status(400).json({ success: false, error: 'User ID and role are required' });
        }

        // Validate role
        const validRoles = ['create', 'modify', 'delete', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ success: false, error: 'Invalid role' });
        }

        // Check user exists
        const user = await User.findById(user_id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Revoke role (idempotent)
        await Role.revoke(user_id, role);

        res.json({ success: true });

    } catch (error) {
        console.error('Error revoking role:', error);
        res.status(500).json({ success: false, error: 'Failed to revoke role' });
    }
});

module.exports = router;
