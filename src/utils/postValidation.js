const validatePostText = (text) => {
    if (!text || typeof text !== 'string') {
        return 'Text is required';
    }

    const trimmed = text.trim();
    if (trimmed.length === 0) {
        return 'Text cannot be empty';
    }

    if (trimmed.length > 500) {
        return 'Text must not exceed 500 characters';
    }

    return null; // Valid
};

const validateCoordinate = (coord, name) => {
    const num = parseFloat(coord);

    if (isNaN(num)) {
        return `${name} must be a number`;
    }

    if (num < 0 || num > 10000) {
        return `${name} must be between 0 and 10000`;
    }

    return null; // Valid
};

module.exports = {
    validatePostText,
    validateCoordinate
};
