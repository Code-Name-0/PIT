// Middleware to detect if request is AJAX
const detectAjax = (req, res, next) => {
    req.isAjax = req.headers['content-type']?.includes('application/json') ||
        req.xhr ||
        req.headers['x-requested-with'] === 'XMLHttpRequest';
    next();
};

module.exports = { detectAjax };
