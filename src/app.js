import dotenv from 'dotenv';
dotenv.config();
import { createFlow, addKeyword } from '@builderbot/bot';
import { verifyPayment } from './functions/mercadopago.js';
import { createPix } from './functions/createpix.js';
import { generateTelegramLink } from './functions/telegramHandler.js';


// Fluxo de boas-vindas
const welcomeFlow = addKeyword(['hi', 'hello', 'hola'])
    .addAnswer([
        'Olá, bem-vindo!',
        'Digite a opção que deseja:',
        'Planos',
        'Encerrar contato',
        'Verificar pagamento',
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
                    return await flowDynamic('Opção inválida. Digite novamente.');
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
    .addAction(
        async (ctx, { flowDynamic, state, gotoFlow }) => {
            console.log('Recebeu mensagem:', ctx.body); // Log da mensagem recebida
            if (state.get('amount')) {
                await createPix(flowDynamic, state);
            } else {
                return gotoFlow(welcomeFlow);
            }
        }
    );

// Fluxo para verificar o pagamento
const verifyFlow = addKeyword(['verificar pagamento'])
    .addAnswer(
        'Digite o número do id da transação para confirmar o pagamento',
        { capture: true },
        async (ctx, { flowDynamic, state }) => {
            const transactionId = ctx.body.trim();
            const attempts = state.get('attempts') || 0;
            try {
                const approved = await verifyPayment(transactionId);
                if (approved) {
                    const plan = state.get('plan');
                    const telegramLink = await generateTelegramLink();
                    if (telegramLink) {
                        await flowDynamic(
                            `Parabéns, você adquiriu o plano ${plan}. Segue abaixo o seu link único do grupo no Telegram (cuidado com ele, você só consegue usar uma vez):\n${telegramLink}`
                        );
                    } else {
                        await flowDynamic(
                            `Parabéns, você adquiriu o plano ${plan}. No entanto, estamos enfrentando dificuldades para gerar o link do Telegram. Por favor, entre em contato com o suporte para receber seu link.`
                        );
                    }
                } else {
                    throw new Error('Pagamento não aprovado');
                }
            } catch (error) {
                if (attempts < 2) {
                    await state.update({ attempts: attempts + 1 });
                    await flowDynamic(
                        'Seu pagamento não foi aprovado. Digite novamente "verificar pagamento" ou digite "Suporte" para falar com o suporte.'
                    );
                } else {
                    await flowDynamic(
                        'Estamos com dificuldade de aprovar o seu pagamento. Digite "Suporte" para falar com o nosso suporte, nós o atenderemos o mais rápido possível.'
                    );
                }
            }
        }
    )

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
export const adapterFlow = createFlow([
    welcomeFlow,
    plansFlow,
    confirmFlow,
    verifyFlow,
    endFlow,
    supportFlow
]);
