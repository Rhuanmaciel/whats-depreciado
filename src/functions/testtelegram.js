import generateTelegramLink from './telegramHandler.js';

async function main() {
    const link = await generateTelegramLink();
    if (link) {
        console.log('Link de convite do Telegram gerado:', link);
    } else {
        console.log('Falha ao gerar o link de convite.');
    }
}

main();
