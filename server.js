const TeleBot = require('telebot');
const { Client } = require('pg');
const axios = require('axios');
const fs = require("fs");
const webUtils = require("./utils/web");
const fileUtils = require("./utils/file");
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  }
});

const BUTTONS = {
  hello: {
      label: '💵 Show course',
      command: '/showcourse'
  },
  reiltoBtn: {
    label: '🏦 Rialto cousrse',
    command: '/rialtocourse'
  },
  world: {
      label: '🤑 How much in BTC',
      command: '/howmuch'
  },
  buy: {
    label: '💰 Buy BTC',
    command: '/buybtc'
},
};

const bot = new TeleBot({
  token: process.env.TELEB_KEY || fs.readFileSync("token.txt").toString(),
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
      BUTTONS.reiltoBtn.label,
    ],
    [
      BUTTONS.world.label,
      BUTTONS.buy.label
    ]
  ], {resize: true});

  client.query(`SELECT * FROM test_table WHERE id = ${msg.from.id};`, (err, res) => {
    if (err) console.log('user check error: ' + err);
    if (res.rowCount === 0) client.query(
      `INSERT INTO test_table(id, first_name, last_name, username, lang) VALUES($1, $2, $3, $4, $5) RETURNING *`,
      [msg.from.id, msg.from.first_name, msg.from.last_name, msg.from.username, msg.from.language_code],
      (err, res) => {
      console.log(err ? "USER ADD ERROR" : `User ${res.rows[0].username} was added`);
    })
    else console.log("user exist");
  })
  fileUtils.checkUser(msg.from, "./users.json");
  return bot.sendMessage(msg.from.id, 'Welcome!', {replyMarkup})
});

bot.on(['/showcourse'], msg => {
  axios.get(`https://blockchain.info/ticker`).then( res => bot.sendMessage(msg.from.id, `1 BTC = ${res.data.USD.last} $`));
});

bot.on(['/rialtocourse'], msg => {
  bot.sendMessage(msg.from.id, "Give me a second...");
  webUtils.parseUrl('https://www.bestchange.ru/visa-mastercard-usd-to-bitcoin.html',bot ,msg.from.id);
});

bot.on(['/howmuch'], msg => bot.sendMessage(msg.from.id, "How many $ do you have?", {ask: 'number'}));

bot.on(['/buybtc'], msg => {
  bot.sendMessage(msg.from.id, "Looking for online sellers...");
  setTimeout(() => {
    bot.sendMessage(msg.from.id, "Please contact @artemis4e");
  }, 2000)
})

//bot.on('callbackQuery', (msg) => bot.answerCallbackQuery(msg.id));

bot.on('ask.number', msg => /^\d+$/.test(msg.text) ?
  axios.get(`https://blockchain.info/tobtc?currency=USD&value=${msg.text}`).then( res => bot.sendMessage(msg.from.id, `${res.data} BTC`)) : 
  bot.sendMessage(msg.from.id, `WTF?`)
);

client.connect();
bot.start();