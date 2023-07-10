const openpgp = require('openpgp');

// Encrypts the message with the provided key and returns the encrypted PGP message
async function encryptMessage(message, publicKey) {
    const { data: encrypted } = await openpgp.encrypt({
        message: openpgp.message.fromText(message),
        publicKeys: (await openpgp.key.readArmored(publicKey)).keys,
    });

    return encrypted;
}

// Decrypts the PGP message with the provided private key and passphrase and returns the decrypted message
async function decryptMessage(encryptedMessage, privateKey, passphrase) {
    const { data: decrypted } = await openpgp.decrypt({
        message: await openpgp.message.readArmored(encryptedMessage),
        privateKeys: (await openpgp.key.readArmored(privateKey)).keys,
        passwords: [passphrase],
    });

    return decrypted;
}

// Example usage
async function runExample() {
    const message = 'Hello, World!';
    const publicKey = `-----BEGIN PGP PUBLIC KEY BLOCK-----
...
-----END PGP PUBLIC KEY BLOCK-----`;

    const privateKey = `-----BEGIN PGP PRIVATE KEY BLOCK-----
...
-----END PGP PRIVATE KEY BLOCK-----`;
    const passphrase = 'jnW0SDsM7U2GPfzNZnZmQ8';

    // Encrypt the message using the recipient's public key
    const encryptedMessage = await encryptMessage(message, publicKey);
    console.log('Encrypted Message:', encryptedMessage);

    // Decrypt the encrypted message using the recipient's private key and passphrase
    const decryptedMessage = await decryptMessage(encryptedMessage, privateKey, passphrase);
    console.log('Decrypted Message:', decryptedMessage);
}

runExample();