import { verifyPayment } from './mercadopago.js';

async function testVerifyPayment() {
    const paymentId = '82213529032'; // Substitua pelo ID do pagamento que deseja verificar

    try {
        const paymentApproved = await verifyPayment(paymentId);
        console.log('Pagamento aprovado:', paymentApproved);
    } catch (error) {
        console.error('Erro ao verificar status do pagamento:', error.message);
    }
}

// Chama a função de teste
testVerifyPayment();
