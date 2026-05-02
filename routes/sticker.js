const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

const TEMPLATE_PATH = path.join(__dirname, '../templates/sticker.html');
const CSS_PATH = path.join(__dirname, '../public/sticker.css');

function buildQrUrl(actRecSec, actRecDetSec) {
  const data = JSON.stringify({ ActRecSec: actRecSec, ActRecDetSec: actRecDetSec });
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(data)}`;
}

function renderTemplate(template, vars) {
  return template.replace(/{{(\w+)}}/g, (_, key) => vars[key] ?? '');
}

async function generateStickerImage(params) {
  const { actRecSec, actRecDetSec, actRecNro, ActRecUni, ActRecFec, ActRecLotFec, ArtCod, ArtNom } = params;

  const [templateRaw, cssRaw] = await Promise.all([
    fs.promises.readFile(TEMPLATE_PATH, 'utf-8'),
    fs.promises.readFile(CSS_PATH, 'utf-8'),
  ]);

  // Inyectar el CSS inline para que Puppeteer no dependa de rutas externas
  const htmlWithCss = templateRaw.replace(
    '<link rel="stylesheet" href="{{CSS_PATH}}">',
    `<style>${cssRaw}</style>`
  );

  const html = renderTemplate(htmlWithCss, {
    actRecSec,
    actRecDetSec,
    actRecNro,
    ActRecUni: ActRecUni ?? '1',
    ActRecFec,
    ActRecLotFec,
    ArtCod,
    ArtNom,
    qrUrl: buildQrUrl(actRecSec, actRecDetSec),
  });

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 325, height: 600, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const element = await page.$('.sticker');
  const buffer = await element.screenshot({ type: 'png' });

  await browser.close();
  return buffer;
}

module.exports = { generateStickerImage };