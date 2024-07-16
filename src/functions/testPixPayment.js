import { createPixPayment, verifyPayment } from './mercadopago.js'; // Certifique-se de que o caminho está correto

async function testPixPayment() {
    const transactionAmount = 100.00; // Valor da transação
    const payerEmail = 'email@exemplo.com'; // Email do pagador
    const payerDocument = '12345678901'; // CPF do pagador

    try {
        // Gerar pagamento PIX
        const { transactionId, pix } = await createPixPayment(transactionAmount, payerEmail, payerDocument);
        console.log('Transação ID:', transactionId);
        console.log('Código QR do PIX:', pix);

        // Verificar status do pagamento (exemplo)
        const paymentApproved = await verifyPayment(transactionId);
        console.log('Pagamento aprovado:', paymentApproved);
    } catch (error) {
        console.error('Erro durante o teste de pagamento PIX:', error.message);
    }
}

// Chama a função de teste
testPixPayment();
