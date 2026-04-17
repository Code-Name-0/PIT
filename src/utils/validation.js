const VALID_USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,20}$/;
const MIN_PASSWORD_LENGTH = 8;

const validateUsername = (username) => {
    if (!username) return 'Username is required';
    if (!VALID_USERNAME_PATTERN.test(username)) {
        return 'Username must be 3-20 alphanumeric characters (_, - allowed)';
    }
    return null;
};

const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < MIN_PASSWORD_LENGTH) {
        return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    }
    return null;
};

module.exports = {
    validateUsername,
    validatePassword
};
