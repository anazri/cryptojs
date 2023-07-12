const axios = require('axios');
const CryptoJS = require('crypto-js');
const {writeFileSync} = require("fs");
const openpgp = require('openpgp');
const {readMessage} = require("openpgp");

function decodeBase64Url(base64Url) {
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padding = base64.length % 4;
    const paddedBase64 = padding === 0 ? base64 : base64 + '==='.slice(padding);
    return atob(paddedBase64);
}

function decryptPrivateKey(encryptedPrivateKey, password) {
    const decryptedBytes = CryptoJS.AES.decrypt(encryptedPrivateKey, password);
    return decryptedBytes.toString(CryptoJS.enc.Utf8);
}

async function decryptFile(encryptedFile, privateKeyArmored, password) {
    const privateKey = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: privateKeyArmored }),
        passphrase: password
    });

    const encryptedMessage = await openpgp.readMessage({ armoredMessage: Uint8ArrayToString(encryptedFile) });

    const decryptedData = await openpgp.decrypt({
        message: encryptedMessage,
        decryptionKeys: [privateKey]
    });

    return decryptedData.data;
}

function Uint8ArrayToString(uint8Array) {
    let binaryString = '';
    uint8Array.forEach((byte) => {
        binaryString += String.fromCharCode(byte);
    });
    return binaryString;
}

async function getFileFromAPI(url) {
    const response = await axios.get(url, {responseType: 'arraybuffer'});
    return new Uint8Array(response.data);
}

async function processLink(link) {
    try {
        // Extract UID and Password from the base64 value in the link
        const base64 = link.substring(link.lastIndexOf('/') + 1);
        const decoded = decodeBase64Url(base64);
        const [uid, password] = decoded.split('.');

        // Fetch the encrypted private key from the API
        const privateKeyUrl = `http://localhost:7777/secret/${uid}`;
        const privateKeyResponse = await axios.get(privateKeyUrl);
        const encryptedPrivateKey = privateKeyResponse.data.secret.message;
        // Decrypt the private key
        const privateKey = decryptPrivateKey(encryptedPrivateKey, password);

        // Download the encrypted file from the API
        const fileUrl = `http://localhost:7777/file/${uid}`;
        const encryptedFile = await getFileFromAPI(fileUrl);
        console.log('Encrypted File:', encryptedFile);
        // Decrypt the file
        const decryptedFile = await decryptFile(encryptedFile, privateKey, password);
        console.log('Decrypted File:', decryptedFile.toString());

        // Save the decrypted file locally
        const filename = `decrypted-${uid}`;
        writeFileSync(filename, decryptedFile);
        console.log(`Decrypted file saved as ${filename}`);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

const link = 'http://localhost/f/d/MTkwMzUzOTAtNzVlYi00MGRiLThhMTItMjNlMzM0OTZkOTQ2Lko4YmhtVGJwUGdlUlhGVkZMelczS2VtcEhuTzl0NFZM';
processLink(link);