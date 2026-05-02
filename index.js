const express = require('express');
const { generateStickerHtml } = require('./routes/sticker'); // 👈 nombre actualizado
const PORT = process.env.PORT || 3000;
const app = express();

app.get('/sticker', async (req, res) => {
  try {
    const html = await generateStickerHtml(req.query); // 👈 html en vez de buffer
    res.setHeader('Content-Type', 'text/html; charset=utf-8'); // 👈 tipo html
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error generando el sticker' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});