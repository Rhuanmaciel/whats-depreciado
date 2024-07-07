import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Configurações do Mercado Pago
const accessToken = 'APP_USR-3002163124774467-061213-8b4f8d5ad884ad1468b846798edb5e64-395333440';
const baseURL = 'https://api.mercadopago.com/v1/payments';

/**
 * Função para criar um pagamento PIX com valor dinâmico e retornar o ID da transação e o código QR.
 * @param {number|string} transactionAmount - Valor da transação.
 * @returns {Promise<{transactionId: string, pix: string}>} - ID da transação e código QR do PIX.
 */
export async function createPixPayment(transactionAmount, payerEmail, payerDocument) {
    try {
        const idempotencyKey = uuidv4();
        const paymentData = {
            transaction_amount: parseFloat(transactionAmount),
            description: 'Pagamento via PIX',
            payment_method_id: 'pix',
            payer: {
                email: 'rhuanc01@gmail.com',
                identification: {
                    type: 'CPF',
                    number: '52788947844'
                }
            }
        };

        const config = {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': idempotencyKey
            }
        };

        const response = await axios.post(baseURL, paymentData, config);
        const pix = response.data.point_of_interaction?.transaction_data?.qr_code;
        if (!pix) {
            throw new Error('Código QR do PIX não encontrado na resposta.');
        }

        const transactionId = response.data.id;
        return { transactionId, pix };
    } catch (error) {
        console.error('Erro ao criar pagamento PIX:', error.response ? error.response.data : error.message);
        throw error;
    }
}

/**
 * Função para verificar o status do pagamento no Mercado Pago.
 * @param {string} paymentId - ID do pagamento a ser verificado.
 * @returns {Promise<boolean>} - Retorna true se o pagamento foi aprovado, caso contrário, false.
 */
export async function verifyPayment(paymentId) {
    try {
        const config = {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        };

        const response = await axios.get(`${baseURL}/${paymentId}`, config);
        const paymentStatus = response.data.status;
        return paymentStatus === 'approved';
    } catch (error) {
        console.error('Erro ao verificar status do pagamento:', error.response ? error.response.data : error.message);
        throw error;
    }
}
