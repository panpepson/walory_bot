const TelegramBot = require('node-telegram-bot-api');
const { RestClientV5 } = require('bybit-api');
require('dotenv').config();

const TELEGRAM_TOKEN = process.env.TELETOKEN;
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
const bybitClient = new RestClientV5({ testnet: false, });

function getEmoji(symbol) {
    switch (symbol) {
        case 'BTCUSDT':
            return '🟡'; // Emotikon dla BTC (żółty)
        case 'MATICUSDT':
            return '🟢'; // Emotikon dla MATIC (zielony)
        case 'XRPUSDT':
            return '🔴'; // Emotikon dla XRP (czerwony)
        case 'NEARUSDT':
            return '🔵'; // Emotikon dla NEAR (niebieski)
        default:
            return ''; // Domyślny kolor
    }
}

function getBybitPrice(symbol, chatId) {
    bybitClient.getOrderbook({
        category: 'linear',
        symbol: symbol,
    })
    .then((response) => {
        const sellPrice = response.result.a[0][0];
        const buyPrice = response.result.b[0][0];

        const emoji = getEmoji(symbol);

        const symbolWithoutUSDT = symbol.slice(0, -4);
        const message = `${emoji} ${symbolWithoutUSDT} - ${sellPrice}\n`;


        bot.sendMessage(chatId, message);
    })
    .catch((error) => {
        const errorMessage = `Nie udało się pobrać danych z Bybit. Spróbuj ponownie później. Błąd: ${error.message}`;
        bot.sendMessage(chatId, errorMessage);
    });
}

// Dodaj przyciski
const keyboard = [
    [{ text: 'BTC' }, { text: 'MATIC' }],
    [{ text: 'XRP' }, { text: 'NEAR' }],
];

// Utwórz opcje klawiatury
const options = {
    reply_markup: JSON.stringify({
        keyboard: keyboard,
        resize_keyboard: true,
        one_time_keyboard: true,
    }),
};

// Obsługa zdarzenia 'message'
bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    // Sprawdź, czy wiadomość zawiera tekst komendy
    if (msg.text.startsWith('/start')) {
        bot.sendMessage(chatId, 'Witaj! Wybierz kryptowalutę za pomocą przycisków poniżej, lub wpisując symbol w takim formacie "@ bat" ', options);
    } else if (msg.text.startsWith('@')) {
        const symbol = msg.text.split(' ')[1].toUpperCase() + 'USDT';
        getBybitPrice(symbol, chatId);
    } else if (msg.text === 'XRP' || msg.text === 'MATIC' || msg.text === 'BTC' || msg.text === 'NEAR') {
        getBybitPrice(msg.text + 'USDT', chatId);
    }
});

