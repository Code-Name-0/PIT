const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, error: 'Must be logged in' });
    }
    next();
};

module.exports = { requireAuth };
