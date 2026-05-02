const express = require('express');
const { generateStickerImage } = require('./routes/sticker');
const PORT = process.env.PORT || 3000;

const app = express();

app.get('/sticker', async (req, res) => {
  
  try {
    const buffer = await generateStickerImage(req.query);
    res.set('Content-Type', 'image/png');
    res.send(buffer);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error generando el sticker' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});