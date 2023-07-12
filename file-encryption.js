const fs = require('fs');
const openpgp = require('openpgp');
const http = require('http');
const CryptoJS = require('crypto-js');
const {extname} = require("path");

const generateRandomPassword = (length) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return password;
};

const encryptAndSendFile = async (filePath, apiUrl, publicKeyArmored, uid, password) => {
    const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });
    const readStream = fs.createReadStream(filePath);

    const options = {
        hostname: '155.4.96.26',
        port: 7777,
        path: apiUrl,
        method: 'POST',
        headers: {
            'Content-Type': 'application/octet-stream',
            'X-UID': uid,
            'X-EXT': extname(filePath),
        },
    };

    const req = http.request(options, (res) => {
        res.on('data', (data) => {
            // Handle the response from the API
            console.log('API response:', data.toString());
        });
    });

    readStream.on('data', async (chunk) => {
        const encryptedChunk = await openpgp.encrypt({
            message: await openpgp.createMessage({ binary: chunk }),
            encryptionKeys: publicKey,
        });

        req.write(encryptedChunk);
    });

    readStream.on('end', () => {
        req.end();
    });
};

(async () => {
    const password = generateRandomPassword(32);

    const { privateKey, publicKey, revocationCertificate } = await openpgp.generateKey({
        type: 'ecc',
        curve: 'curve25519',
        userIDs: [{ name: 'Jon Smith', email: 'jon@example.com' }],
        passphrase: password,
        format: 'armored',
    });

    const privateKeyArmored = privateKey;
    const publicKeyArmored = publicKey;
    // Encrypt the private key with a random password
    const encryptedPrivateKey = CryptoJS.AES.encrypt(privateKeyArmored, password).toString();

    // Send the encrypted private key to the API
    const keyPayload = {
        once: true,
        message: encryptedPrivateKey,
        expiration: 3600,
    };

    // Send the key payload to the API
    const keyApiUrl = 'http://155.4.96.26:7777/secret';
    const keyOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(keyPayload),
    };

    fetch(keyApiUrl, keyOptions)
        .then((response) => response.json())
        .then(async (data) => {
            if (data.status === 'success') {
                const uid = data.data.uid;
                console.log('UID:', uid);
                const link = Buffer.from(uid + '.' + password).toString('base64');
                console.log('Link:', 'http://localhost/f/d/' + link);
                // Store the UID in a constant for further use

                const filePath = 'mount-safa.pdf'; // Replace with the actual file path
                const apiUrl = 'http://155.4.96.26:7777/file'; // Replace with the API URL

                encryptAndSendFile(filePath, apiUrl, publicKeyArmored, uid, password);
            } else {
                console.log('Status is not success');
                // Handle the case when the status is not success
            }
        })
        .catch((error) => {
            console.error('API Error:', error);
        });
})();