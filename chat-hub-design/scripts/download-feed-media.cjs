/**
 * Скрипт для скачивания фото и видео из mock-данных ленты.
 * Запуск: node scripts/download-feed-media.cjs
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const MEDIA_DIR = path.join(__dirname, '..', 'public', 'media', 'feed');

const images = {
  nature1: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
  nature2: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80',
  nature3: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
  sunset: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800&q=80',
  beach: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
  mountains: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
  city1: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80',
  city2: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80',
  city3: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&q=80',
  moscow: 'https://images.unsplash.com/photo-1513326738677-b964603b136d?w=800&q=80',
  spb: 'https://images.unsplash.com/photo-1556610961-2fecc5927173?w=800&q=80',
  code: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80',
  laptop: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
  office: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
  conference: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
  coffee: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80',
  breakfast: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=80',
  food1: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  books: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80',
  reading: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=800&q=80',
  people1: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80',
  selfie: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80',
  team: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',
  avatar1: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
  avatar2: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
  avatar3: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
  avatar4: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80',
  avatar5: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80',
  avatar6: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80',
};

const videos = {
  nature: 'https://www.w3schools.com/html/mov_bbb.mp4',
  coding: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  travel: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
};

function download(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const request = protocol.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return download(response.headers.location).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode} for ${url}`));
        return;
      }
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    });
    request.on('error', reject);
  });
}

async function main() {
  const imagesDir = path.join(MEDIA_DIR, 'images');
  const videosDir = path.join(MEDIA_DIR, 'videos');
  fs.mkdirSync(imagesDir, { recursive: true });
  fs.mkdirSync(videosDir, { recursive: true });

  console.log('Downloading images...');
  for (const [name, url] of Object.entries(images)) {
    try {
      const ext = url.includes('unsplash') ? '.jpg' : '.png';
      const filepath = path.join(imagesDir, name + ext);
      const data = await download(url);
      fs.writeFileSync(filepath, data);
      console.log(`  OK: ${name}${ext}`);
    } catch (err) {
      console.error(`  FAIL: ${name} - ${err.message}`);
    }
  }

  console.log('Downloading videos...');
  for (const [name, url] of Object.entries(videos)) {
    try {
      const ext = '.mp4';
      const filepath = path.join(videosDir, name + ext);
      const data = await download(url);
      fs.writeFileSync(filepath, data);
      console.log(`  OK: ${name}${ext}`);
    } catch (err) {
      console.error(`  FAIL: ${name} - ${err.message}`);
    }
  }

  console.log('Done!');
}

main().catch(console.error);
