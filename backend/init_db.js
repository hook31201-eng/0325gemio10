require('dotenv').config();
const sql = require('mssql');

const dbConfig = {
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PWD,
  options: { trustServerCertificate: true, encrypt: false }
};

async function main() {
  console.log('連線到資料庫...');
  const pool = await sql.connect(dbConfig);
  console.log('連線成功！\n');

  // 建立資料表
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='cust' AND xtype='U')
    CREATE TABLE cust (cust_code NVARCHAR(20) PRIMARY KEY, cust_name NVARCHAR(100) NOT NULL, remark NVARCHAR(200))
  `);
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='fact' AND xtype='U')
    CREATE TABLE fact (fact_code NVARCHAR(20) PRIMARY KEY, fact_name NVARCHAR(100) NOT NULL, remark NVARCHAR(200))
  `);
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='item' AND xtype='U')
    CREATE TABLE item (item_code NVARCHAR(20) PRIMARY KEY, item_name NVARCHAR(100) NOT NULL, fact_code NVARCHAR(20))
  `);
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
    CREATE TABLE users (userid NVARCHAR(20) PRIMARY KEY, username NVARCHAR(100) NOT NULL, pwd NVARCHAR(50) NOT NULL)
  `);
  console.log('✓ 四個資料表建立完成');

  // 清除舊資料
  await pool.request().query('DELETE FROM item');
  await pool.request().query('DELETE FROM cust');
  await pool.request().query('DELETE FROM fact');
  await pool.request().query('DELETE FROM users');
  console.log('✓ 舊資料清除完成');

  // 插入 50 筆 cust
  for (let i = 1; i <= 50; i++) {
    await pool.request()
      .input('a', sql.NVarChar, `C${String(i).padStart(3,'0')}`)
      .input('b', sql.NVarChar, `客戶${i}號`)
      .input('c', sql.NVarChar, `客戶備註${i}`)
      .query('INSERT INTO cust VALUES (@a,@b,@c)');
  }
  console.log('✓ cust 50筆插入完成');

  // 插入 50 筆 fact
  for (let i = 1; i <= 50; i++) {
    await pool.request()
      .input('a', sql.NVarChar, `F${String(i).padStart(3,'0')}`)
      .input('b', sql.NVarChar, `廠商${i}號`)
      .input('c', sql.NVarChar, `廠商備註${i}`)
      .query('INSERT INTO fact VALUES (@a,@b,@c)');
  }
  console.log('✓ fact 50筆插入完成');

  // 插入 50 筆 item
  for (let i = 1; i <= 50; i++) {
    const fcode = `F${String((i % 10) + 1).padStart(3,'0')}`;
    await pool.request()
      .input('a', sql.NVarChar, `I${String(i).padStart(3,'0')}`)
      .input('b', sql.NVarChar, `商品${i}號`)
      .input('c', sql.NVarChar, fcode)
      .query('INSERT INTO item VALUES (@a,@b,@c)');
  }
  console.log('✓ item 50筆插入完成');

  // 插入 50 筆 users
  for (let i = 1; i <= 50; i++) {
    await pool.request()
      .input('a', sql.NVarChar, `U${String(i).padStart(3,'0')}`)
      .input('b', sql.NVarChar, `用戶${i}號`)
      .input('c', sql.NVarChar, `pwd${i}`)
      .query('INSERT INTO users (userid,username,pwd) VALUES (@a,@b,@c)');
  }
  console.log('✓ users 50筆插入完成');

  // 確認筆數
  const r = await pool.request().query(`
    SELECT 'cust' AS tbl, COUNT(*) AS cnt FROM cust UNION ALL
    SELECT 'fact', COUNT(*) FROM fact UNION ALL
    SELECT 'item', COUNT(*) FROM item UNION ALL
    SELECT 'users', COUNT(*) FROM users
  `);
  console.log('\n=== 各資料表筆數 ===');
  r.recordset.forEach(x => console.log(`  ${x.tbl}: ${x.cnt} 筆`));

  await pool.close();
  console.log('\n完成！');
}

main().catch(err => {
  console.error('錯誤:', err.message);
  process.exit(1);
});
