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
    }
}

module.exports = fileUtils