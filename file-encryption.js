const fs = require('fs');
const openpgp = require('openpgp');
const http = require('http');
const CryptoJS = require('crypto-js');
const {extname} = require("path");
const {statSync} = require("fs");

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

    let totalSize = 0;

    readStream.on('data', async (chunk) => {
        const encryptedChunk = await openpgp.encrypt({
            message: await openpgp.createMessage({ binary: chunk }),
            encryptionKeys: publicKey,
        });
        const chunkSize = Buffer.byteLength(encryptedChunk, 'utf8');
        totalSize += chunkSize;
        req.write(encryptedChunk);
    });

    readStream.on('end', () => {
        req.end();
        console.log('Total size:', totalSize, 'bytes');
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
    console.log('Private key:\n', privateKeyArmored);
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

                const filePath = 'secret-file.txt'; // Replace with the actual file path
                const fileSize = getFileSize(filePath);
                console.log('File size:', fileSize.kilobytes, 'KB');
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

const getFileSize = (filePath) => {
    const stats = statSync(filePath);
    const fileSizeInBytes = stats.size;
    const fileSizeInKB = fileSizeInBytes / 1024;
    const fileSizeInMB = fileSizeInKB / 1024;
    return {
        kilobytes: fileSizeInKB
    };
};