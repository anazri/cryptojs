const fs = require("fs");
const openpgp = require('openpgp');
const axios = require('axios');
const CryptoJS = require('crypto-js');

const generateRandomPassword = (length) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return password;
};

(async () => {
    const password = generateRandomPassword(32);

    const {privateKey, publicKey, revocationCertificate} = await openpgp.generateKey({
        type: 'ecc', // Type of the key, defaults to ECC
        curve: 'curve25519', // ECC curve name, defaults to curve25519
        userIDs: [{name: 'Jon Smith', email: 'jon@example.com'}], // you can pass multiple user IDs
        passphrase: password, // protects the private key
        format: 'armored' // output key format, defaults to 'armored' (other options: 'binary' or 'object')
    });

    const privateKeyArmored = privateKey;
    const publicKeyArmored = publicKey;

    console.log('Password:', password);
    console.log('Private Key:', privateKeyArmored);
    console.log('Public Key:', publicKeyArmored);
    console.log('Revocation Certificate:', revocationCertificate);

    // Encrypt the private key with a random password
    const encryptedPrivateKey = CryptoJS.AES.encrypt(privateKeyArmored, password).toString();

    // Send the encrypted private key to the API
    const payload = {
        once: true,
        message: encryptedPrivateKey,
        expiration: 3600
    };

    axios.post('http://155.4.96.26:7777/secret', payload)
        .then(async (response) => {
            if (response.data.status === 'success') {
                const uid = response.data.data.uid;
                console.log('UID:', uid);
                const link = Buffer.from(uid + '.' + password).toString('base64');
                console.log('Link:', 'http://localhost/t/d/' + link)
                // Store the UID in a constant for further use

                const plainData = fs.readFileSync("present.pptx");
                console.log('Plain Data:', plainData)

                const publicKey = await openpgp.readKey({armoredKey: publicKeyArmored});
                const encrypted = await openpgp.encrypt({
                    message: await openpgp.createMessage({ binary: plainData }),
                    encryptionKeys: publicKey,
                });
                const apiUrl = 'http://155.4.96.26:7777/file'
                const payload = {
                    uid: uid,
                    message: encrypted.toString(), // Pass the encrypted data here
                };
                console.log('Payload:', payload)
                // Send the encrypted data to the API
                axios.post(apiUrl, payload)
                    .then((response) => {
                        // Handle the API response
                        console.log('API response:', response.data);
                    })
                    .catch((error) => {
                        // Handle any errors that occurred during the API request
                        console.error('API Error:', error);
                    });

            } else {
                console.log('Status is not success');
                // Handle the case when the status is not success
            }
        })
        .catch((error) => {
            console.error('API Error:', error);
        });
})();