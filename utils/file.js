const fs = require("fs");

const fileUtils = {
    readFileAsync: async (filePath) => {

        return new Promise((resolve, reject) => {
            fs.readFile(filePath, "utf-8", (err, data) => {
                if (err) {
                    reject(err);
                }

                if (data) {
                    resolve(data)
                }
            })
        })
    },

    checkUser: async (user, filePath) => {
        console.log("check start")
        fileUtils.readFileAsync(filePath).then( data => {
            data = JSON.parse(data);

            if (data && !(user.id in data)) {
                data[user.id] = user;
                fs.writeFile( filePath, JSON.stringify(data), (err) => {                
                    if (err) console.log(`write file error, ${err}`)
                });
            }
        }).catch( err => console.log(user, err + ' Err') )
    }
}

module.exports = fileUtils