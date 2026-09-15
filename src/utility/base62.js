const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const BASE = ALPHABET.length;

function encodeBase62(num) {
    if (num === 0) return ALPHABET[0];
    let result = '';
    while (num > 0) {
        result = ALPHABET[num % BASE] + result;
        num = Math.floor(num / BASE);
    }
    return result;
}

module.exports = { encodeBase62 };