const axios = require('axios');
const CryptoJS = require('crypto-js');
const {writeFileSync, readFileSync, statSync} = require("fs");
const {readMessage, message, decrypt, decryptKey, readPrivateKey} = require("openpgp");

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
    const privateKey = await decryptKey({
        privateKey: await readPrivateKey({armoredKey: privateKeyArmored}),
        passphrase: password
    });

    const encryptedMessage = {
        message: await message.fromBinary(encryptedFile),
        privateKeys: [privateKey],
    };

    const decryptedData = await decrypt({
        message: encryptedMessage,
        privateKeys: [privateKey],
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
    const headers = response.headers;
    const fileData = new Uint8Array(response.data);
    console.log('File length:', fileData.length);
    return {
        headers: headers,
        data: fileData,
    };
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
        const {headers, data} = await getFileFromAPI(fileUrl);
        const ext = headers['x-ext']
        // Decrypt the file
        const decryptedFile = await decryptFile(data, privateKey, password);

        // Save the decrypted file locally
        const filename = `decrypted-${uid}${ext}`;
        writeFileSync(filename, decryptedFile, 'binary');
        console.log(`Decrypted file saved as ${filename}`);
        const fileSize = getFileSize(filename);
        console.log('File Size (KB):', fileSize.kilobytes);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

const readLinkFromOutputFile = (filePath) => {
    const content = readFileSync(filePath, 'utf8');
    const linkStartIndex = content.indexOf('Link: ') + 6;
    const linkEndIndex = content.indexOf('\n', linkStartIndex);
    return content.slice(linkStartIndex, linkEndIndex).trim();
};

const getFileSize = (filePath) => {
    const stats = statSync(filePath);
    const fileSizeInBytes = stats.size;
    const fileSizeInKB = fileSizeInBytes / 1024;
    return {
        kilobytes: fileSizeInKB
    };
};

const link = readLinkFromOutputFile('output.txt');
processLink(link);