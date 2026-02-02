#!/usr/bin/env node
/**
 * Полный деплой: сборка → git commit & push → запрос на сервер (webhook).
 * Сервер по запросу выполняет git pull и обновление (см. server-pull-and-deploy.sh).
 *
 * Использование:
 *   npm run deploy
 *   DEPLOY_WEBHOOK_URL=https://post-ads.ru/deploy.php?token=SECRET npm run deploy
 *   node scripts/deploy.cjs "сообщение коммита"
 */
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const https = require('https');
const http = require('http');

const rootDir = path.join(__dirname, '..');
const commitMsg = process.argv[2] || `Deploy ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`;

// Загрузка .env.deploy (DEPLOY_WEBHOOK_URL), если есть
const envDeployPath = path.join(rootDir, '.env.deploy');
if (fs.existsSync(envDeployPath)) {
  const content = fs.readFileSync(envDeployPath, 'utf8');
  content.split('\n').forEach((line) => {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  });
}
const webhookUrl = process.env.DEPLOY_WEBHOOK_URL || '';

function run(cmd, options = {}) {
  execSync(cmd, { cwd: rootDir, stdio: 'inherit', ...options });
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === 'https:' ? https : http;
    const req = lib.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode, data }));
    });
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function main() {
  console.log('=== 1. Сборка (deploy:local) ===');
  run('node scripts/deploy-to-root.cjs');

  console.log('\n=== 2. Git: add, commit, push ===');
  run('git add -A');
  try {
    run('git commit -m ' + JSON.stringify(commitMsg));
  } catch (e) {
    const code = e.status ?? e.code;
    const out = (e.stdout || e.stderr || e.message || '').toString();
    if (code === 1 && /nothing to commit|no changes added/.test(out)) {
      console.log('Нет изменений для коммита, только push.');
    } else {
      throw e;
    }
  }
  run('git push origin main');

  if (webhookUrl) {
    console.log('\n=== 3. Запрос на сервер (обновление из git) ===');
    try {
      const { statusCode, data } = await fetchUrl(webhookUrl);
      const body = (data || '').trim();
      const isOk = statusCode >= 200 && statusCode < 300 && (body.includes('DEPLOY_OK') || body.includes('Готово'));
      const isQueued = statusCode >= 200 && statusCode < 300 && body.includes('DEPLOY_QUEUED');
      const isFail = statusCode >= 400 || body.includes('DEPLOY_FAIL');

      if (isOk) {
        console.log('Сервер: обновление успешно.');
        if (body) console.log(body.slice(-500));
      } else if (isQueued) {
        console.log('Сервер: обновление поставлено в очередь (выполнится в течение минуты по cron).');
      } else if (isFail) {
        console.error('Сервер: обновление неуспешно.');
        console.error('Ответ:', statusCode, body || '(пусто)');
        process.exitCode = 1;
      } else {
        console.log('Ответ:', statusCode, body ? body.slice(0, 300) : '');
      }
    } catch (err) {
      console.error('Сервер: обновление неуспешно.', err.message);
      process.exitCode = 1;
    }
  } else {
    console.log('\n=== 3. Webhook не задан ===');
    console.log('Чтобы сервер обновился по запросу, задайте DEPLOY_WEBHOOK_URL, например:');
    console.log('  DEPLOY_WEBHOOK_URL=https://post-ads.ru/deploy.php?token=YOUR_SECRET npm run deploy');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
