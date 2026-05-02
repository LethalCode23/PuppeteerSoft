const express = require('express');
const { generateStickerImage } = require('./routes/sticker');

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

app.listen(3000, () => {
  console.log('Servidor en http://localhost:3000');
});