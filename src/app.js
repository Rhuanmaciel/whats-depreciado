import dotenv from 'dotenv';
dotenv.config();
import { createBot, createProvider, createFlow, addKeyword, EVENTS } from '@builderbot/bot';
import { MongoAdapter as Database } from '@builderbot/database-mongo';
import { BaileysProvider as Provider } from '@builderbot/provider-baileys';
import { createPixPayment, verifyPayment } from './mercadopago.js';

const PORT = process.env.PORT || 3008;

// Fluxo de boas-vindas
const welcomeFlow = addKeyword(['hi', 'hello', 'hola'])
    .addAnswer([
        'Olá, bem-vindo à maior plataforma de OnlyFans e Privacy do Brasil!',
        'Digite a opção que deseja:',
        'Planos',
        'Encerrar contato',
        'Suporte'
    ]);

// Fluxo para selecionar planos
const plansFlow = addKeyword(['planos'])
    .addAnswer(
        [
            'Escolha um plano:',
            '1 - Mensal R$ 10',
            '2 - Trimestral R$ 15',
            '3 - Semestral R$ 20',
            '4 - Vitalício R$ 30',
            'Digite o Número da opção que você deseja'
        ],
        { capture: true },
        async (ctx, { flowDynamic, state }) => {
            console.log('Recebeu mensagem:', ctx.body); // Log da mensagem recebida
            const message = ctx.body.trim();
            let plan, amount;
            switch (message) {
                case '1':
                    plan = 'Mensal';
                    amount = 10;
                    break;
                case '2':
                    plan = 'Trimestral';
                    amount = 15;
                    break;
                case '3':
                    plan = 'Semestral';
                    amount = 20;
                    break;
                case '4':
                    plan = 'Vitalício';
                    amount = 30;
                    break;
                default:
                    return flowDynamic('Opção inválida. Digite novamente.');
            }
            await state.update({ plan, amount });
            await flowDynamic([
                `Você está adquirindo o plano ${plan} por R$ ${amount}`,
                'Digite "confirmar" para gerar o PIX',
                'Digite "Planos" para ver os planos novamente',
                'Digite "encerrar contato" para terminar o contato'
            ]);
        }
    );

// Fluxo para confirmar o pagamento
const confirmFlow = addKeyword(['confirmar'])
    .addAnswer(
        'Abaixo segue o PIX copia e cola, copie ele e pague pelo seu banco!',
        { capture: true },
        async (ctx, { flowDynamic, state }) => {
            if (ctx.body.toLowerCase().trim() === 'confirmar') {
                console.log('Confirmação recebida'); 

                const { amount } = state.get();
                console.log('Valor da transação antes do parse:', amount); // Log do valor antes do parse

                // Certifique-se de que o valor seja numérico
                const parsedAmount = parseFloat(amount);

                if (isNaN(parsedAmount)) {
                    console.error('Erro: valor da transação inválido.');
                    return flowDynamic('Erro ao processar seu pedido. Por favor, tente novamente.');
                }

                console.log('Valor da transação após o parse:', parsedAmount); // Log do valor após o parse

                try {
                    console.log('Chamando createPixPayment...');
                    const { transactionId, pix } = await createPixPayment(parsedAmount, 'email@example.com', '12345678900'); 
                    console.log('PIX gerado:', pix); 
                    console.log('ID da transação:', transactionId); 

                    await state.update({ transactionId });
                    await flowDynamic([
                        `PIX copia e cola: ${pix}`, 
                        `Abaixo o seu id da transação: ${transactionId}`,
                        'Digite 0 pra confirmar o pagamento'
                    ]);
                } catch (error) {
                    console.error('Erro ao gerar o PIX:', error.message); 
                    console.error('Detalhes do erro:', error.response ? error.response.data : error); // Log da resposta da API
                    await flowDynamic('Erro ao gerar o PIX. Tente novamente ou entre em contato com o suporte.');
                }
            } 
        }
    );

// Fluxo para verificar o pagamento
const verifyFlow = addKeyword(['0'])
    .addAnswer(
        'Digite o número do id da transação para confirmar o pagamento',
        { capture: true },
        async (ctx, { flowDynamic, state }) => {
            const transactionId = ctx.body.trim();
            const attempts = state.get('attempts') || 0;
            try {
                const approved = await verifyPayment(transactionId);
                if (approved) {
                    const { plan } = state.get();
                    await flowDynamic(
                        `Parabéns, você adquiriu o plano ${plan}. Segue abaixo o seu link único do grupo no Telegram (cuidado com ele, você só consegue usar uma vez).`
                    );
                } else {
                    throw new Error('Pagamento não aprovado');
                }
            } catch (error) {
                if (attempts < 2) {
                    await state.update({ attempts: attempts + 1 });
                    await flowDynamic(
                        'Seu pagamento não foi aprovado. Digite novamente o id da transação ou digite "Suporte" para falar com o suporte.'
                    );
                } else {
                    await flowDynamic(
                        'Estamos com dificuldade de aprovar o seu pagamento. Digite "Suporte" para falar com o nosso suporte, nós o atenderemos o mais rápido possível.'
                    );
                }
            }
        }
    );

// Fluxo de encerramento de contato
const endFlow = addKeyword(['encerrar contato'])
    .addAnswer('Seu contato foi encerrado', async (ctx, { state }) => {
        state.reset();
    });

// Fluxo de suporte
const supportFlow = addKeyword(['suporte'])
    .addAnswer('Em alguns instantes um membro do suporte irá falar com você, aguarde.', async (ctx, { state }) => {
        state.reset();
    });

// Combina todos os fluxos
const adapterFlow = createFlow([
    welcomeFlow,
    plansFlow,
    confirmFlow,
    verifyFlow,
    endFlow,
    supportFlow
]);

const main = async () => {
    const adapterProvider = createProvider(Provider);
    const adapterDB = new Database({
        dbUri: process.env.MONGO_DB_URI,
        dbName: process.env.MONGO_DB_NAME,
    });

    const { handleCtx, httpServer } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });

    adapterProvider.server.post(
        '/v1/messages',
        handleCtx(async (bot, req, res) => {
            const { number, message, urlMedia } = req.body;
            await bot.sendMessage(number, message, { media: urlMedia ?? null });
            return res.end('sended');
        })
    );

    httpServer(+PORT);
}

main();
