import { createBot, createProvider } from '@builderbot/bot';
import { MongoAdapter as Database } from '@builderbot/database-mongo';
import { BaileysProvider as Provider } from '@builderbot/provider-baileys';

import { adapterFlow } from './app.js';

const PORT = process.env.PORT || 3008;

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