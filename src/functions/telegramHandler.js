import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const telegramChatId = process.env.TELEGRAM_CHAT_ID;
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;

export async function generateTelegramLink() {
    try {
        const response = await axios.post(`https://api.telegram.org/bot${telegramBotToken}/createChatInviteLink`, {
            chat_id: telegramChatId,
            member_limit: 1 // Link de uso único
        });

        return response.data.result.invite_link;
    } catch (error) {
        console.error('Erro ao gerar link do Telegram:', error.message);
        return null;
    }
}

export default generateTelegramLink;
