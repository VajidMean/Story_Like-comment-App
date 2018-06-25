const bcrypt = require('bcrypt');

let hash = '$2b$10$4XcpaPXm9Wf3jxz3K8qahe1gEnwUBd.uYCEWZTRGbY/JfB8Uo1liW';
let pass = 1111111111111;


bcrypt.compare(pass, hash, function(err, res) {
    if(res ){
        console.log("differ");
    }
});