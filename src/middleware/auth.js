const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        // Check if AJAX request
        if (req.headers['content-type']?.includes('application/json') ||
            req.xhr ||
            req.headers['x-requested-with'] === 'XMLHttpRequest') {
            return res.status(401).json({ success: false, error: 'Must be logged in' });
        }
        // Non-AJAX: redirect to login
        return res.redirect('/login');
    }
    next();
};

module.exports = { requireAuth };
