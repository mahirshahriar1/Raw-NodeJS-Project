// module scaffolding
const crypto = require("crypto");
const utilities = {};
const environments = require("./environments");

// parse JSON string to object
utilities.parseJSON = (jsonString) => {
  let output;

  try {
    output = JSON.parse(jsonString);
  } catch {
    output = {};
  }

  return output;
};

// hash string
utilities.hash = (str) => {
  if (typeof str === "string" && str.length > 0) {
    const hash = crypto.createHmac("sha256", environments.secretKey).update(str).digest("hex");
    return hash;
    }
    else{
        return false;
    }
};

// create random string
utilities.createRandomString = (strLength) => {
    let length = strLength;
    length = typeof strLength === 'number' && strLength > 0 ? strLength : false;
    if(length){
        const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let output = '';
        for(let i = 1; i <= length; i++){
            const randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            output += randomCharacter;
        }
        return output;
    }
    else{
        return false;
    }
};

// export module
module.exports = utilities;
