const Role = require('../models/Role');

/**
 * Middleware to require a specific role
 * Usage: router.post('/ajouter', requireRole('create'), handler)
 * 
 * - Checks if user has the specified role OR 'admin' role
 * - Returns 403 if role not found
 * - Calls next() if authorized
 */
const requireRole = (requiredRole) => {
    return async (req, res, next) => {
        const userId = req.session.userId;

        // Must be authenticated
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Must be logged in' });
        }

        try {
            // Check if user has required role OR admin role
            const hasRequiredRole = await Role.hasRole(userId, requiredRole);
            const isAdmin = await Role.hasRole(userId, 'admin');

            if (!hasRequiredRole && !isAdmin) {
                return res.status(403).json({ success: false, error: 'Insufficient permissions' });
            }

            // Authorized - continue
            next();

        } catch (error) {
            console.error('Role check error:', error);
            return res.status(500).json({ success: false, error: 'Permission check failed' });
        }
    };
};

/**
 * Middleware to require admin role specifically
 * Usage: router.get('/admin', requireAdmin, handler)
 */
const requireAdmin = async (req, res, next) => {
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ success: false, error: 'Must be logged in' });
    }

    try {
        const isAdmin = await Role.hasRole(userId, 'admin');

        if (!isAdmin) {
            return res.status(403).json({ success: false, error: 'Admin access required' });
        }

        next();

    } catch (error) {
        console.error('Admin check error:', error);
        return res.status(500).json({ success: false, error: 'Permission check failed' });
    }
};

module.exports = { requireRole, requireAdmin };
