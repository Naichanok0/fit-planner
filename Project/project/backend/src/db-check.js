const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'mysql.env') });
const mysql = require('mysql2/promise');

(async () => {
  try {
    console.log('DB_HOST=', process.env.DB_HOST);
    console.log('DB_PORT=', process.env.DB_PORT);
    console.log('DB_USER=', process.env.DB_USER);
    console.log('DB_NAME=', process.env.DB_NAME);

    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    });

    const [ping] = await conn.query('SELECT 1 AS ok');
    console.log('Ping DB =>', ping[0]); // { ok: 1 }
    await conn.end();
    process.exit(0);
  } catch (e) {
    console.error('DB connect failed:', e.code || e.message);
    console.error(e);
    process.exit(1);
  }
})();
