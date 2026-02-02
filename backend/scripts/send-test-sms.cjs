/**
 * Тестовая отправка SMS через SMSC.ru.
 * Запуск: node scripts/send-test-sms.cjs
 * Требует SMSC_LOGIN и SMSC_PASSWORD в .env или переменных окружения.
 *
 * Формат номера: маска +7 (999) 123-45-67 → SMSC ожидает 79991234567.
 * Номер 89897625658 нормализуется в 79897625658.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

function normalizePhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) {
    const last10 = digits.slice(-10);
    return '7' + last10;
  }
  return digits;
}

async function sendSms(phone, text) {
  const login = process.env.SMSC_LOGIN;
  const psw = process.env.SMSC_PASSWORD;

  if (!login || !psw) {
    console.error('Ошибка: SMSC_LOGIN и SMSC_PASSWORD должны быть в .env');
    process.exit(1);
  }

  const phones = normalizePhone(phone);
  console.log('Отправка SMS на:', phone, '→ нормализован:', phones);

  // POST с JSON — корректная передача UTF-8 (GET с кириллицей в URL даёт кракозябры)
  const url = 'https://smsc.ru/rest/send/';
  const body = { login, psw, phones, mes: text, charset: 'utf-8', fmt: 3 };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });
  const data = await res.json();

  return data;
}

const TEST_PHONE = process.argv[2] || '89897625658';
const TEST_MESSAGE = process.argv[3] || 'Messager: тестовое сообщение. Код подтверждения: 1234';

sendSms(TEST_PHONE, TEST_MESSAGE)
  .then((data) => {
    if (data.error || data.error_code) {
      console.error('Ошибка SMSC:', data.error || data.error_code, data);
      process.exit(1);
    }
    console.log('SMS отправлено успешно:', data);
  })
  .catch((err) => {
    console.error('Ошибка:', err);
    process.exit(1);
  });
