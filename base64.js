// Encode a string to Base64
function encodeBase64(string) {
    return btoa(string);
}

// Decode a Base64 string to the original string
function decodeBase64(base64String) {
    return atob(base64String);
}

// Usage example:
const originalString = process.argv[2] || 'Hello World!';

// Encode the string to Base64
const encodedString = encodeBase64(originalString);
console.log('Encoded:', encodedString);

// Decode the Base64 string back to the original string
const decodedString = decodeBase64(encodedString);
console.log('Decoded:', decodedString);