const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

prisma.$connect()
  .then(() => {
    console.log('Database connected successfully!');
    return prisma.$queryRaw`SELECT 1 as test`;
  })
  .then((result) => {
    console.log('Query result:', result);
  })
  .catch((e) => {
    console.log('Error:', e.message);
  })
  .finally(() => {
    prisma.$disconnect();
  });
