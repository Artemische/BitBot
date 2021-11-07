const fs = require("fs");
const tress = require("tress");
const needle = require("needle");
const cheerio = require("cheerio");
const fileUtils = require("./file");

const webUtils = {
    parseUrl:  function(URL, bot, id) {
        const coursesMsg = this.coursesMsg
        const result = [];
        const q = tress(function (url, callback) {
            needle.get(url, function (err, res) {
                if (err || !res.body) {
                    fileUtils.readFileAsync("./resp.json")
                        .then( res => bot.sendMessage(id, `${coursesMsg(JSON.parse(res), false)}`))
                        .catch( err => bot.sendMessage(id, `Error ${err}`) );
                    //bot.sendMessage(id, 'Something wrong ... Could you try one more time?');
                    return
                }

                // парсим DOM
                const $ = cheerio.load(res.body);

                if ($('#content_table')) {
                    const tableBody = $('#content_table > tbody').contents();
                    const rows = [...tableBody].filter(el => el.name === 'tr');
                    const parseResult = rows.map(el => {
                        return {
                            chName: el.children[3].children[0].children[1].children[0].children[0].data,
                            send: `${el.children[4].children[0].children[0].data} ${el.children[4].children[0].children[1].children[0].data}`,
                            receive: `${el.children[6].children[0].data} ${el.children[6].children[1].children[0].data}`,
                            liveAmmount: el.children[8].children[0].data
                        }
                    });

                    result.push(...parseResult);
                }

                callback();
            });
        });

        q.drain = function () {
            bot.sendMessage(id, coursesMsg(result));

            fs.writeFile( "./resp.json", JSON.stringify(result), (err) => {                
                if (err) console.log(`write file error, ${err}`)
            });

            return result
        };

        q.push(URL);
    },

    coursesMsg: function(dataArray, success = true) {
        let resultString = `${success ? "Current" : "Previous "} course: \n`;
        
        dataArray.forEach(el => {
          resultString += `
            Обменник: ${el.chName},
            Отдаете: ${el.send},
            Получаете: ${el.receive},
            Резерв: ${el.liveAmmount}
          `
        });
      
        return resultString
    }
}

module.exports = webUtils