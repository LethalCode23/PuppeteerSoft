const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const { PDFDocument } = require('pdf-lib');

const TEMPLATE_PATH = path.join(__dirname, '../templates/sticker.html');
const CSS_PATH = path.join(__dirname, '../public/sticker.css');

function buildQrUrl(actRecSec, actRecDetSec) {
  const data = JSON.stringify({ ActRecSec: actRecSec, ActRecDetSec: actRecDetSec });
  return `https://api.qrserver.com/v1/create-qr-code/?size=700x700&data=${encodeURIComponent(data)}`;
}

function renderTemplate(template, vars) {
  return template.replace(/{{(\w+)}}/g, (_, key) => vars[key] ?? '');
}

async function generateStickerImage(params) {
  const { actRecSec, actRecDetSec, ActRecUni, ActRecFec, ActRecLotFec, ArtCod, ArtNom } = params;

  const [templateRaw, cssRaw] = await Promise.all([
    fs.promises.readFile(TEMPLATE_PATH, 'utf-8'),
    fs.promises.readFile(CSS_PATH, 'utf-8'),
  ]);

  const html = renderTemplate(templateRaw.replace('<link rel="stylesheet" href="{{CSS_PATH}}">', `<style>${cssRaw}</style>`), {
    actRecSec, actRecDetSec, ArtCod, ArtNom, ActRecFec, ActRecLotFec,
    ActRecUni: ActRecUni ? Math.round(parseFloat(ActRecUni)) : '1',
    qrUrl: buildQrUrl(actRecSec, actRecDetSec),
  });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    
    // Configuramos un viewport proporcional pero con alta densidad de píxeles
    await page.setViewport({ 
      width: 800, 
      height: 500, 
      deviceScaleFactor: 3 // Esto hace que la imagen sea nítida y grande
    });

    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Capturamos el elemento exacto, así no dependemos de un clip manual de px
    const element = await page.$('.sticker');
    return await element.screenshot({
      type: 'png',
      omitBackground: false,
    });
  } finally {
    await browser.close();
  }
}

async function generateStickersHtml(params) {
  const cantidad = Math.max(1, parseInt(params.cantidad) || 1);

  // Genera la imagen una sola vez y la reutiliza
  const imageBuffer = await generateStickerImage(params);
  const base64 = imageBuffer.toString('base64');

  const imgTag = `<img src="data:image/png;base64,${base64}" />`;
  const imagenes = Array(cantidad).fill(imgTag).join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: white; }
    img {
      width: 100%;
      display: block;
    }
    @media print {
      @page {
        size: 164mm 103mm;
        margin: 0;
      }
      img {
        width: 164mm;
        height: 103mm;
        page-break-after: always;
        display: block;
      }
    }
  </style>
</head>
<body>
  ${imagenes}
</body>
</html>`;
}

async function generateStickerPdf(params, copies = 1) {
  const { actRecSec, actRecDetSec, ActRecUni, ActRecFec, ActRecLotFec, ArtCod, ArtNom } = params;

  const [templateRaw, cssRaw] = await Promise.all([
    fs.promises.readFile(TEMPLATE_PATH, 'utf-8'),
    fs.promises.readFile(CSS_PATH, 'utf-8'),
  ]);

  const html = renderTemplate(
    templateRaw.replace('<link rel="stylesheet" href="{{CSS_PATH}}">', `<style>${cssRaw}</style>`),
    {
      actRecSec, actRecDetSec, ArtCod, ArtNom, ActRecFec, ActRecLotFec,
      ActRecUni: ActRecUni ? Math.round(parseFloat(ActRecUni)) : '1',
      qrUrl: buildQrUrl(actRecSec, actRecDetSec),
    }
  );

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Genera el PDF base (1 página)
    const singlePdfBytes = await page.pdf({
      width: '164mm',
      height: '103mm',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    if (copies === 1) return singlePdfBytes;

    const sourcePdf = await PDFDocument.load(singlePdfBytes);
    const outputPdf = await PDFDocument.create();
    const [sourcePage] = await outputPdf.copyPages(sourcePdf, [0]);

    for (let i = 0; i < copies; i++) {
      
      const [copiedPage] = await outputPdf.copyPages(sourcePdf, [0]);
      outputPdf.addPage(copiedPage);
    }

    return Buffer.from(await outputPdf.save());
  } finally {
    await browser.close();
  }
}

module.exports = { generateStickerImage, generateStickerPdf, generateStickersHtml };