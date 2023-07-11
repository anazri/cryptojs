const fs = require('fs');
const axios = require('axios');
const CryptoJS = require('crypto-js');

const CHUNK_SIZE = 64 * 1024; // 64 KB

const generateRandomPassword = (length) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return password;
};

const encryptFileAndSendToAPI = async (filePath, apiUrl, password) => {
    try {
        // Read the file as a buffer
        const fileBuffer = fs.readFileSync(filePath);

        // Convert the file buffer to a WordArray
        const fileWordArray = CryptoJS.lib.WordArray.create(fileBuffer);

        // Generate a random IV
        const iv = CryptoJS.lib.WordArray.random(16);

        // Encrypt the file data using AES with the provided password and IV
        const encryptedData = CryptoJS.AES.encrypt(fileWordArray, password, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
        });

        // Convert the encrypted data and IV to base64 strings
        const encryptedDataBase64 = encryptedData.toString();
        const ivBase64 = iv.toString();

        // Prepare the payload for the API request
        const payload = {
            message: encryptedDataBase64,
            vector: ivBase64,
            once: true,
            expiration: 3600,
        };

        // Send the encrypted file data to the API
        axios
            .post(apiUrl, payload)
            .then((response) => {
                // Extract the UID from the API response
                const uid = response.data.uid;
                console.log('File encrypted and sent successfully. UID:', uid);

                // Fetch the encrypted message from the API using the UID
                const fetchUrl = `${apiUrl}/${uid}`;
                axios
                    .get(fetchUrl)
                    .then((response) => {
                        // Extract the encrypted message from the API response
                        const encryptedMessage = response.data.data.message;

                        // Decrypt the message using the password and IV
                        const decryptedData = CryptoJS.AES.decrypt(encryptedMessage, password, {
                            iv: CryptoJS.enc.Hex.parse(response.data.data.vector),
                            mode: CryptoJS.mode.CBC,
                            padding: CryptoJS.pad.Pkcs7,
                        });

                        // Convert the decrypted data to a buffer
                        const decryptedBuffer = CryptoJS.lib.WordArray.create(decryptedData.words);

                        // Save the decrypted file locally
                        const decryptedFilePath = 'decrypted-mount-safa.pdf';
                        fs.writeFileSync(decryptedFilePath, Buffer.from(decryptedBuffer.toString(), 'binary'));
                        console.log('File decrypted and saved:', decryptedFilePath);
                    })
                    .catch((error) => {
                        console.error('API Error:', error);
                    });
            })
            .catch((error) => {
                console.error('API Error:', error);
            });
    } catch (error) {
        console.error('Error encrypting and sending file:', error);
    }
};

// Usage example
const filePath = 'mount-safa.pdf';
const apiUrl = 'http://localhost:7777/file';
const password = generateRandomPassword(32);

encryptFileAndSendToAPI(filePath, apiUrl, password);
