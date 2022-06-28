const bcrypt = require('bcrypt');

// Encrypting the Password

const encryptPass = async () => {

    await bcrypt.hash("blah", 12, (err, hash) => {

        if (err) {
            console.log(err);
            throw err;
        } else {
            console.log(hash.length);
            console.log(`hash ${hash}`);
            // encryptedPass = hash;

            bcrypt.compare("none", hash, (err, results) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log(`Compare:${results}`);
                }
            });
        }
    })
}

encryptPass();


// Encrypting Password
// var encryptedPassword = "";
// bcrypt.hash("password", 12, (err, hash) => {

//     if (err) {
//         console.log(err);
//         throw err;
//     } else {
//         console.log(hash.length);
//         encryptedPassword = hash;
//         console.log(`hash ${encryptedPassword}`);
//     }
// });

// console.log(`encryptedPass ${encryptedPass}`);
// comparePass(encryptedPass);