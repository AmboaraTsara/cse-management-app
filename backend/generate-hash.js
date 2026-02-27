const bcrypt = require('bcrypt');

const password = 'admin123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds).then(hash => {
  console.log('Mot de passe:', password);
  console.log('Hash bcrypt:', hash);
  
  bcrypt.compare(password, hash).then(result => {
    console.log('Vérification:', result ? ' OK' : ' Échec');
  });
});
