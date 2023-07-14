const {createMessage, encrypt, readMessage, decrypt} = require('openpgp');
const { readFileSync, statSync} = require('fs');
const {post} = require("axios");
const {extname} = require("path");
const CryptoJS = require('crypto-js');

const filePath = process.argv[2];
const randomPIN = process.argv[3];
const generateRandomPassword = (length) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return password;
};

const getFileSize = (filePath) => {
    const stats = statSync(filePath);
    const fileSizeInBytes = stats.size;
    const fileSizeInKB = fileSizeInBytes / 1024;
    const fileSizeInMB = fileSizeInKB / 1024;
    return {
        kilobytes: fileSizeInKB
    };
};

(async () => {
    try {
        const password = generateRandomPassword(32); // Set the password for encryption

        // Read the PDF file as Uint8Array
        const sourceFilePath = filePath;
        const pdfFile = readFileSync(sourceFilePath);
        const sourceFileSize = getFileSize(sourceFilePath);
        console.log('Source File size:', sourceFileSize.kilobytes, 'KB');
        const pdfData = new Uint8Array(pdfFile);

        // Create a message from the PDF data
        const message = await createMessage({ binary: pdfData });

        // Encrypt the message with the password
        const encrypted = await encrypt({
            message,
            passwords: [password],
            format: 'binary'
        });
        // console.log('Encrypted:', encrypted); // Uint8Array

// Send the encrypted data to the API
        const apiUrl = 'http://155.4.96.26:7777/file'; // Replace with the actual API URL
        const options = {
            hostname: '155.4.96.26',
            port: 7777,
            path: apiUrl,
            method: 'POST',
            headers: {
                'Content-Type': 'application/octet-stream',
                'X-EXT': extname(sourceFilePath),
            },
        };
        await post(apiUrl, encrypted, options).then((response) => {
            const uid = response.data.uid;
            console.log(`uid: ${response.data.uid}`);
            const link = Buffer.from(uid + '.' + password).toString('base64');
            console.log(`Link: http://localhost/f/d/${link}`)
            if (randomPIN !== undefined && randomPIN.toString().length === 6) {
                console.log('PIN:', randomPIN);
                const encryptedLink = CryptoJS.AES.encrypt(link, randomPIN.toString()).toString().replace(/=/g, '');
                console.log('Encrypted Link: ', 'http://localhost/f/d/p/' + encryptedLink);
                console.log('Decrypted Link: ', CryptoJS.AES.decrypt(encryptedLink, randomPIN.toString()).toString(CryptoJS.enc.Utf8));
            }
        }).catch((error) => {
            console.error(error);
        });
        console.log('Encrypted data sent to the API.');
    } catch (error) {
        console.error('Error:', error.message);
    }
})();