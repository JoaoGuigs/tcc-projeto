const bcrypt = require('bcryptjs');

const senhaPura = '123456';
const salt = bcrypt.genSaltSync(10)
const hash = bcrypt.hashSync(senhaPura, salt);

console.log('Senha Pura:', senhaPura);
console.log('Hash Gerado:', hash);