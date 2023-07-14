const fs = require('fs');

const readStream = fs.createReadStream('mount-safa.pdf');

readStream.on('data', (chunk) => {
    // Process each chunk of data
    console.log('Received chunk:', chunk);
});

readStream.on('end', () => {
    // Finished reading the file
    console.log('File read complete');
});

readStream.on('error', (error) => {
    // Handle any errors that occur during reading
    console.error('Error reading file:', error);
});