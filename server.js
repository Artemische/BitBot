const TeleBot = require('telebot');
const { Client } = require('pg');
const axios = require('axios');
const fs = require("fs");
const webUtils = require("./utils/web");
const CONST = require("./utils/constants.json");
const { type } = require('os');
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  }
});
const BUTTONS = CONST.BUTTONS;
const timers = new Map();
const bot = new TeleBot({
  token: process.env.TELEB_KEY,
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

const state = {
  selectedCurrency: null,
  monitorAction: false,
}

bot.on(['/start', '/hello', '/return'], msg => {
  const replyMarkup = bot.keyboard([
    [
      BUTTONS.showcourse.label,
      BUTTONS.reiltoBtn.label,
    ],
    [
      BUTTONS.count.label,
      BUTTONS.buy.label
    ],
    [
      BUTTONS.notificate.label
    ]
  ], {resize: true});

  client.query(`SELECT * FROM test_table WHERE id = ${msg.from.id};`, (err, res) => {
    if (err) console.log('user check error: ' + err);
    if (res.rowCount === 0) client.query(
      `INSERT INTO test_table(id, first_name, last_name, username, lang) VALUES($1, $2, $3, $4, $5) RETURNING *`,
      [msg.from.id, msg.from.first_name, msg.from.last_name, msg.from.username, msg.from.language_code],
      (err, res) => {
      console.log(err ? "USER ADD ERROR" : `User ${res.rows[0].username || res.rows[0].first_name } was added (${res.rows[0].id}) `);
    })
    else console.log("user exist");
  })
  
  return bot.sendMessage(msg.from.id, msg.text !== '⬅️' ? 'Welcome!' : 'Main menu', {replyMarkup})
});

bot.on(['/showcourse'], msg => {
  const replyMarkup = bot.keyboard([
    [
      BUTTONS.BTC.label,
      BUTTONS.ETH.label,
      BUTTONS.BNB.label,
    ],
    [
      BUTTONS.SOL.label,
      BUTTONS.ADA.label,
      BUTTONS.XRP.label,
    ],
    [
      BUTTONS.return.label
    ]
  ], {resize: true});

  bot.sendMessage(msg.from.id, "Choose currency", {replyMarkup})
});

bot.on(['/getCourse'], msg => {
  if (state.monitorAction){
    state.monitorAction = false;
    return
  }

  axios.get(`${process.env.API_URL}/coins/${CONST.COISNS[msg.text].id}`).then( res => {
    bot.sendMessage(msg.from.id, res.data.market_data.current_price.usd);
  });
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

bot.on(['/notificate'], msg => {
  const replyMarkup = bot.keyboard([
    [
      BUTTONS.BTC.label,
      BUTTONS.ETH.label,
      BUTTONS.BNB.label,
    ],
    [
      BUTTONS.SOL.label,
      BUTTONS.ADA.label,
      BUTTONS.XRP.label,
    ],
    [
      BUTTONS.return.label
    ]
  ], {resize: true});

  bot.sendMessage(msg.from.id, 'Choose currency', {replyMarkup, ask: 'targetCoin'});
});

bot.on('ask.targetCoin', msg => {
  const userId = msg.from.id;

  state.selectedCurrency = CONST.COISNS[msg.text].id;
  state.monitorAction = true;
  bot.sendMessage(userId, 'Target price?', {ask: 'targetPrice', replyMarkup: 'hide'})
})

bot.on('ask.targetPrice', msg => {
  const resCourse = msg.text; // add reg exp 
  const replyMarkup = bot.keyboard([
    [
      BUTTONS.showcourse.label,
      BUTTONS.reiltoBtn.label,
    ],
    [
      BUTTONS.count.label,
      BUTTONS.buy.label
    ],
    [
      BUTTONS.notificate.label
    ]
  ], {resize: true});
  let interval;
  
  axios.get(`${process.env.API_URL}/coins/${state.selectedCurrency}`).then( res => {
    const price = res.data.market_data.current_price.usd;

    if (price < resCourse) {
      bot.sendMessage(msg.from.id, '🔔🔔🔔', {replyMarkup});
    } else {
      bot.sendMessage(msg.from.id, 'monitoring...', {replyMarkup});
      interval = setInterval( () => {
        const price = res.data.market_data.current_price.usd;

        axios.get(`${process.env.API_URL}/coins/${state.selectedCurrency}`).then( res => { 
          if (price < resCourse) {
            bot.sendMessage(msg.from.id, "🔔🔔🔔", {replyMarkup});
            clearInterval(interval);
          } else {
            console.log("next", price, resCourse)
          }
        })
      }, 5000 )
    } //проверка промежутка? больше/меньше
  });


})

client.connect();
bot.start();