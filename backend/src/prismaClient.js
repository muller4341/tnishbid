const { PrismaClient } = require('@prisma/client');
const { generateUserId } = require('./utils/generateId');
const { getNowEAT } = require('./utils/dateHelper');

const prisma = new PrismaClient();

// Automatically generate a 6-digit alphanumeric ID for any new User if not explicitly provided
prisma.$use(async (params, next) => {
  if (params.model === 'User') {
    if (params.action === 'create' && params.args?.data && !params.args.data.id) {
      params.args.data.id = generateUserId(6);
    } else if (params.action === 'upsert' && params.args?.create && !params.args.create.id) {
      params.args.create.id = generateUserId(6);
    }
  }

  // If created_at is explicitly passed as a JS Date, anchor it to Africa/Addis_Ababa GMT
  if (params.action === 'create' && params.args?.data && params.args.data.created_at instanceof Date) {
    params.args.data.created_at = getNowEAT();
  }

  return next(params);
});

module.exports = prisma;
