const crypto = require('crypto');

(async () => {
    try {
        // Generate AES key
        const key = await crypto.subtle.generateKey(
            {
                name: 'AES-CBC',
                length: 256
            },
            true,
            ['encrypt', 'decrypt']
        );

        // Export the key as JWK format
        const exportedKey = await crypto.subtle.exportKey('jwk', key);
        console.log('Generated AES Key:', exportedKey.k);

        // Convert the key to a Buffer
        const keyBuffer = Buffer.from(exportedKey.k, 'base64');

        // Input text to encrypt
        const inputText = 'Hello, World!';

        // Generate a random IV (Initialization Vector)
        const iv = crypto.randomBytes(16);

        // Create a Cipher object
        const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);

        // Encrypt the input text
        let encrypted = cipher.update(inputText, 'utf8', 'base64');
        encrypted += cipher.final('base64');

        console.log('Encrypted Text:', encrypted);
    } catch (error) {
        console.error('Error generating AES key or encrypting text:', error);
    }
})();