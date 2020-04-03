'use strict';
const crypto = require('crypto');

function hashPassword(password, salt) { //promise
  if (!salt) salt = crypto.randomBytes(32).toString("base64"); //при проверке пароля указываем salt
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 10000, 32, 'sha256', function (err, hash) {
      if (err) {
        return reject(err);
      }
      return resolve(salt + '.' + hash.toString("base64"));
    })
  })
}

hashPassword('sdflksdf').then(passHash => {
  console.log(passHash)
});