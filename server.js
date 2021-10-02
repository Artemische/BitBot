const TeleBot = require('telebot');
const axios = require('axios');
const tress = require("tress");
const needle = require("needle");
const cheerio = require("cheerio");
const resolve = require("url").resolve;
const fs = require("fs");

const BUTTONS = {
  hello: {
      label: '💵 Show course',
      command: '/showcourse'
  },
  world: {
      label: '🤑 How much in BTC',
      command: '/howmuch'
  },
  buy: {
    label: '💰 Buy BTC',
    command: '/buyBTC'
},
};

const TOKEN = "799020342:AAFsrpLz0kLGWoOoU4e_WUGIk0zL9dhk-5Q";
const bot = new TeleBot({
  token: TOKEN,
  usePlugins: ['askUser', 'commandButton', 'floodProtection', 'namedButtons'],
  pluginConfig: {
    floodProtection: {
        interval: 1,
        message: 'Too many messages, relax!'
    },
    namedButtons: {
      buttons: BUTTONS
    }
  }
});

bot.on(['/start', '/hello'], msg => {
  const replyMarkup = bot.keyboard([
    [
        // First row with command callback button
      BUTTONS.hello.label,
      BUTTONS.world.label
    ],
    [
      BUTTONS.buy.label
    ]
  ], {resize: true});
  
  return bot.sendMessage(msg.from.id, 'Welcome!', {replyMarkup})
});

bot.on(['/showcourse'], msg => {
  parseUrl('https://www.bestchange.ru/visa-mastercard-usd-to-bitcoin.html');
  axios.get(`https://blockchain.info/ticker`).then( res => bot.sendMessage(msg.from.id, `1 BTC = ${res.data.USD.last} $`));
  fs.readFile('resp.json', 'utf8', function(err, data){
    let resultString = '';
    
    console.log(JSON.parse(data).length)

    JSON.parse(data).forEach(el => {
      resultString += `
        Обменник: ${el.chName},
        Отдаете: ${el.send},
        Получаете: ${el.receive},
        Резерв: ${el.liveAmmount}
      `

      bot.sendMessage(msg.from.id, resultString)
    });
  });
});

bot.on(['/howmuch'], msg => bot.sendMessage(msg.from.id, "How many $ do you have?", {ask: 'number'}));

bot.on(['/buyBTC'], msg => {
  bot.sendMessage(msg.from.id, "Looking for online sellers...");
  setTimeout(() => {
    bot.sendMessage(msg.from.id, "Please contact @artemis4e");
  }, 2000)
})

bot.on('callbackQuery', (msg) => bot.answerCallbackQuery(msg.id));

bot.on('ask.number', msg => /^\d+$/.test(msg.text) ?
  axios.get(`https://blockchain.info/tobtc?currency=USD&value=${msg.text}`).then( res => bot.sendMessage(msg.from.id, `${res.data} BTC`)) : 
  bot.sendMessage(msg.from.id, `WTF?`)
);

bot.start();


const parseUrl = (URL) => {
  const result = [];
  const q = tress(function (url, callback) {
    needle.get(url, function (err, res) {
      if (err) throw err;

      // парсим DOM
      const $ = cheerio.load(res.body);
      
      if ($('#content_table')){
        const tableBody = $('#content_table > tbody').contents();
        const rows = [...tableBody].filter( el => el.name === 'tr');
        const parseResult = rows.map( el => {
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
    fs.writeFileSync("./resp.json", JSON.stringify(result));
    return result
  };

  q.push(URL);
};