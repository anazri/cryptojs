const { createMessage, readMessage, encrypt, decrypt } = require('openpgp');
const { v4: uuidv4 } = require('uuid');
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

const encryptMessage = async (data, password) => {
    try {
        const message = await createMessage({ text: data });
        return await encrypt({ message, passwords: [password] });
    } catch (error) {
        console.error('Encryption failed:', error);
        throw error;
    }
};

// Usage example
const data = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sit amet pretium dui. Nulla aliquam placerat leo. Vestibulum sit amet interdum odio. Quisque dapibus ullamcorper fringilla. Suspendisse euismod eros a ipsum aliquet tempus. Fusce bibendum feugiat arcu ac fringilla. Cras at elit nec justo vestibulum auctor. Sed laoreet tellus ut ligula commodo tristique. Nam eu mauris nec turpis viverra luctus. Etiam eleifend, nulla eget convallis rhoncus, nunc lectus consequat leo, vitae cursus tortor eros id ex. Sed sed neque eget sem eleifend facilisis. Mauris feugiat sollicitudin mi, eu efficitur nulla gravida ac. Mauris finibus tortor eu eros volutpat scelerisque. Proin ullamcorper eros a urna aliquam vestibulum. Suspendisse et orci ut erat fermentum bibendum.";
// const data = data2 + data2
const password = generateRandomPassword(32);
// const uuid = uuidv4()
// const identity = Buffer.from(uuid + '.' + password).toString('base64');
const randomPIN = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;

encryptMessage(data, password)
    .then((encrypted) => {
        console.log('Data Length :', data.length);
        console.log('Password:', password);

        const payload = {
            once: true,
            message: JSON.stringify(encrypted),
            expiration: 3600
        };

        axios.post('http://localhost:7777/secret', payload)
            .then((response) => {
                if (response.data.status === 'success') {
                    const uid = response.data.data.uid;
                    // const decryptedMessage = decryptMessage(uid, password);
                    // console.log('Decrypted Message:', decryptedMessage)
                    console.log('UID:', uid);
                    const link = Buffer.from(uid + '.' + password).toString('base64');
                    console.log('Link:', 'http://localhost/t/d/' + link)
                    // Perform further actions with the uid
                    console.log('PIN:', randomPIN);
                    const encryptedLink = CryptoJS.AES.encrypt(link, randomPIN.toString()).toString().replace(/=/g, '');
                    console.log('Encrypted Link: ', 'http://localhost/t/d/p/' + encryptedLink);
                    console.log('Decrypted Link: ', CryptoJS.AES.decrypt(encryptedLink, randomPIN.toString()).toString(CryptoJS.enc.Utf8));
                } else {
                    console.log('Status is not success');
                    // Handle the case when the status is not success
                }
            })
            .catch((error) => {
                console.error('API Error:', error);
            });
    })
    .catch((error) => {
        console.error('Error:', error);
    });

const decryptMessage = async (uid, password, format = 'utf8') => {
    try {
        const { data } = await axios.get('http://localhost:7777/secret/' + uid);
        // console.log('Response payload: ', data)
        const encryptedMsg = JSON.parse(data.secret.message);
        console.log('Encrypted Message: ', encryptedMsg)
        const message = await readMessage({ armoredMessage: encryptedMsg });
        const decrypted = await decrypt({ message, passwords: [password], format });
        console.log('Decrypted Message: ', decrypted.data)
        return decrypted.data;
    } catch (error) {
        console.error('Decryption failed:', error);
        throw error;
    }
};
