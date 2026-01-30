const path = require('path');
if (!process.env.DATABASE_URL) {
  try {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env.production') });
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
  } catch (_) {}
}
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('123123123', 10);
  const r = await prisma.user.updateMany({
    where: { email: 'dsc-23@yandex.ru' },
    data: { passwordHash: hash },
  });
  console.log('Updated', r.count, 'user(s). Password set to 123123123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
