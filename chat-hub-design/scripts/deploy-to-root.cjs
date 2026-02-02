/**
 * Деплой: восстанавливает index.html → сборка → копирование dist в корень.
 * Запуск: npm run deploy:local
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const sourceIndexPath = path.join(rootDir, 'index.html.source');

// 1. Восстанавливаем исходный index.html (нужен для сборки)
if (fs.existsSync(sourceIndexPath)) {
  fs.copyFileSync(sourceIndexPath, path.join(rootDir, 'index.html'));
  console.log('Восстановлен index.html из index.html.source');
}

// 2. Сборка
console.log('Запуск npm run build...');
execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });

// 3. Копирование dist в корень
function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    console.error('Папка dist не найдена.');
    process.exit(1);
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log('  ' + entry.name);
    }
  }
}

console.log('Копирование dist/ в корень проекта...');
copyRecursive(distDir, rootDir);
console.log('Готово! Сайт доступен по Document Root.');
