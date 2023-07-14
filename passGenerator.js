function generateRandomPassword(length, includeSymbols) {
    // Define the characters and symbols that will be used to generate the password
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const symbols = '!@#$%^&*()-_=+[{]};:,<.>/?';

    let password = '';

    // Create a pool of characters based on the symbol option
    const pool = includeSymbols ? characters + symbols : characters;

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        password += pool.charAt(randomIndex);
    }
    return password;
}

// Usage example:
const passwordLength = process.argv[2];
const includeSymbols = process.argv[3] === 'true';

console.log('Generating a random password with the following parameters:');
const randomPassword = generateRandomPassword(passwordLength, includeSymbols);
console.log(randomPassword);