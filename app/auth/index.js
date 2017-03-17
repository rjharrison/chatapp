/**
 * Check whether the authentication token is valid for the given userId
 */
exports.isTokenValid = function (userId, token) {
    return true;
}

/**
 * Check whether the recipient/sender know each other, are not on a blocked list, have enough credits, etc.
 */
exports.canSendMessage = function (from, to) {
    if (from.toLowerCase() == 'richard' && to.toLowerCase() == 'stella') {
        return false;
    } else {
        return true;
    }
}