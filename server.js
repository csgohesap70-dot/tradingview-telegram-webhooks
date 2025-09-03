const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// JSON parse middleware
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

// Telegram Bot Token ve Channel ID
const TELEGRAM_BOT_TOKEN = '7924362902:AAHh6v3GB8OueHnsWtqe3Ymj7DVdby_e-rw';
const TELEGRAM_CHANNEL_ID = '@mertbotscalper_bot';

// Telegram'a mesaj gönderme fonksiyonu
async function sendToTelegram(message) {
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const payload = {
            chat_id: TELEGRAM_CHANNEL_ID,
            text: message,
            parse_mode: 'HTML'
        };
        
        const response = await axios.post(url, payload);
        console.log('Telegram mesajı gönderildi:', response.data);
        return true;
    } catch (error) {
        console.error('Telegram gönderim hatası:', error.response?.data || error.message);
        return false;
    }
}

// Test endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'Webhook servisi çalışıyor!',
        time: new Date().toISOString(),
        endpoints: ['/webhook', '/test']
    });
});

// Test mesajı endpoint
app.get('/test', async (req, res) => {
    const testMessage = `🧪 <b>TEST MESAJI</b>\n\n📊 Webhook servisi aktif\n⏰ ${new Date().toLocaleString('tr-TR')}`;
    
    const success = await sendToTelegram(testMessage);
    
    if (success) {
        res.json({ status: 'Test mesajı gönderildi!' });
    } else {
        res.status(500).json({ error: 'Test mesajı gönderilemedi' });
    }
});

// TradingView webhook endpoint
app.post('/webhook', async (req, res) => {
    try {
        console.log('Webhook tetiklendi:', req.body);
        
        let message = '';
        
        // TradingView'den gelen mesajı kontrol et
        if (req.body && typeof req.body === 'string') {
            message = req.body;
        } else if (req.body && req.body.message) {
            message = req.body.message;
        } else if (req.body && req.body.text) {
            message = req.body.text;
        } else {
            message = JSON.stringify(req.body);
        }
        
        // Mesajı güzelleştir
        const formattedMessage = formatMessage(message);
        
        // Telegram'a gönder
        const success = await sendToTelegram(formattedMessage);
        
        if (success) {
            res.json({ status: 'Sinyal gönderildi!', message: formattedMessage });
        } else {
            res.status(500).json({ error: 'Telegram gönderim hatası' });
        }
        
    } catch (error) {
        console.error('Webhook hatası:', error);
        res.status(500).json({ error: 'Webhook işlem hatası' });
    }
});

// Mesaj formatlama fonksiyonu
function formatMessage(rawMessage) {
    const timestamp = new Date().toLocaleString('tr-TR', {
        timeZone: 'Europe/Istanbul',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // BUY sinyali formatla
    if (rawMessage.includes('BUY') || rawMessage.includes('buy')) {
        return `🟢 <b>ALIM SİNYALİ</b>\n\n${rawMessage}\n\n⏰ ${timestamp}\n📈 AI SWING Algo`;
    }
    
    // SELL sinyali formatla
    if (rawMessage.includes('SELL') || rawMessage.includes('sell')) {
        return `🔴 <b>SATIM SİNYALİ</b>\n\n${rawMessage}\n\n⏰ ${timestamp}\n📉 AI SWING Algo`;
    }
    
    // Genel mesaj formatla
    return `📊 <b>TRADİNG SİNYALİ</b>\n\n${rawMessage}\n\n⏰ ${timestamp}`;
}

// Hata yakalama
app.use((error, req, res, next) => {
    console.error('Sunucu hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
});

// Sunucuyu başlat
app.listen(PORT, () => {
    console.log(`Webhook servisi ${PORT} portunda çalışıyor`);
    console.log(`Webhook URL: https://yourapp.railway.app/webhook`);
});

module.exports = app;
