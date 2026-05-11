const express = require('express');
const { generateStickerImage, generateStickerPdf, generateStickersHtml } = require('./routes/sticker');
const PORT = process.env.PORT || 3000;
const app = express();

// Imagen PNG

app.get('/sticker', async (req, res) => {

  try {
    const imageBuffer = await generateStickerImage(req.query);
    const base64 = imageBuffer.toString('base64');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: white; }
    img { display: block; width: 164mm; height: 103mm; }
    @media print {
      @page { size: 164mm 103mm; margin: 0; }
      img { width: 164mm; height: 103mm; }
    }
  </style>
</head>
<body>
  <img src="data:image/png;base64,${base64}" />
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    res.status(500).send(`<pre>ERROR: ${err.message}</pre>`);
  }
});

// Generar HTML con N imágenes

app.get('/sticker/print', async (req, res) => {
  try {
    const html = await generateStickersHtml(req.query);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send(`<pre>ERROR: ${err.message}\n${err.stack}</pre>`);
  }
});

/* Generar N PDF */

app.get('/sticker/pdf', async (req, res) => {
  try {
    const copies = Math.max(1, parseInt(req.query.copies) || 1); // mínimo 1
    const pdf = await generateStickerPdf(req.query, copies);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="sticker.pdf"');
    res.send(pdf);
  } catch (err) {
    console.error(err);
    res.status(500).send(`<pre>ERROR: ${err.message}\n${err.stack}</pre>`);
  }
});

/* Puerto a escuchar */

app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});