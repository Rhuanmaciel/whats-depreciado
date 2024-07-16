import { createPixPayment } from './mercadopago.js';

export async function createPix(flowDynamic, state) {
  const amount = state.get('amount');
  console.log('Valor da transação antes do parse:', amount); // Log do valor antes do parse

  // Certifique-se de que o valor seja numérico
  const parsedAmount = parseFloat(amount);

  if (isNaN(parsedAmount)) {
    console.error('Erro: valor da transação inválido.');
    return await flowDynamic('Erro ao processar seu pedido. Por favor, tente novamente.');
  }

  console.log('Valor da transação após o parse:', parsedAmount); // Log do valor após o parse

  try {
    console.log('Chamando createPixPayment...');
    const { transactionId, pix } = await createPixPayment(parsedAmount);
    console.log('PIX gerado:', pix);
    console.log('ID da transação:', transactionId);

    await state.update({ transactionId });
    await flowDynamic([
      pix,
      `Abaixo o seu id da transação: ${transactionId}`,
      'Digite "verificar pagamento" pra confirmar o pagamento'
    ]);
  } catch (error) {
    console.error('Erro ao gerar o PIX:', error.message);
    console.error('Detalhes do erro:', error.response ? error.response.data : error); // Log da resposta da API
    await flowDynamic('Erro ao gerar o PIX. Tente novamente ou entre em contato com o suporte.');
  }
}
