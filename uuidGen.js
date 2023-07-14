const { v4: uuidv4 } = require('uuid');

// Generate a UUID
const uuid = uuidv4();

console.log('Generated UUID:', uuid);

const no_hyphens = uuidv4().replace(/-/g, '');

console.log('UUID Without hyphens:', no_hyphens);