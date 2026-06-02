import { createConnection } from 'mysql2/promise';

async function test() {
  try {
    const connection = await createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'agenda_kelas_digital'
    });
    console.log('Connected successfully with mysql2');
    await connection.end();
  } catch (err) {
    console.error('Connection failed with mysql2:', err);
  }
}

test();
