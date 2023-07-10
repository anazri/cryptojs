const fs = require('fs');
const axios = require('axios');
const CryptoJS = require('crypto-js');

const CHUNK_SIZE = 64 * 1024; // 64 KB

const encryptFileAndSendToAPI = async (filePath, apiUrl) => {
    try {
        // Create a readable stream from the file
        const fileStream = fs.createReadStream(filePath);

        // Generate a random IV
        const iv = CryptoJS.lib.WordArray.random(16);

        // Initialize the AES cipher
        const cipher = CryptoJS.AES.encrypt('', CryptoJS.enc.Utf8.parse('password'), {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
        });

        // Create a writable stream to collect the encrypted chunks
        const encryptedChunks = [];
        const encryptedStream = CryptoJS.lib.StreamCipher.createEncryptor(
            cipher.key,
            {
                iv: cipher.iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7,
            }
        );
        encryptedStream.on('data', (chunk) => {
            encryptedChunks.push(chunk);
        });

        // Encrypt the file by reading and encrypting chunks of data
        let bytesRead = 0;
        fileStream.on('data', (chunk) => {
            const chunkWordArray = CryptoJS.lib.WordArray.create(chunk);
            encryptedStream.process(chunkWordArray);
            bytesRead += chunk.length;
        });

        // When the entire file has been read, finalize the encryption
        fileStream.on('end', () => {
            encryptedStream.finish();
            const encryptedData = CryptoJS.lib.WordArray.create(
                [].concat(...encryptedChunks)
            );

            // Convert the encrypted data and IV to base64 strings
            const encryptedDataBase64 = CryptoJS.enc.Base64.stringify(encryptedData);
            const ivBase64 = CryptoJS.enc.Base64.stringify(iv);

            // Prepare the payload for the API request
            const payload = {
                data: encryptedDataBase64,
                iv: ivBase64,
            };

            // Send the encrypted file data to the API
            axios
                .post(apiUrl, payload)
                .then((response) => {
                    // Extract the UID from the API response
                    const uid = response.data.uid;
                    console.log('File encrypted and sent successfully. UID:', uid);
                })
                .catch((error) => {
                    console.error('API Error:', error);
                });
        });

        // Handle errors
        fileStream.on('error', (error) => {
            console.error('File read error:', error);
        });
    } catch (error) {
        console.error('Error encrypting and sending file:', error);
    }
};

// Usage example
const filePath = '/path/to/file.pdf';
const apiUrl = 'http://localhost:7777/file';

encryptFileAndSendToAPI(filePath, apiUrl);