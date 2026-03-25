const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM users ORDER BY userid');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { userid, username, pwd } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('userid', sql.NVarChar, userid)
      .input('username', sql.NVarChar, username)
      .input('pwd', sql.NVarChar, pwd)
      .query('INSERT INTO users (userid, username, pwd) VALUES (@userid, @username, @pwd)');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { username, pwd } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('userid', sql.NVarChar, req.params.id)
      .input('username', sql.NVarChar, username)
      .input('pwd', sql.NVarChar, pwd)
      .query('UPDATE users SET username=@username, pwd=@pwd WHERE userid=@userid');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('userid', sql.NVarChar, req.params.id)
      .query('DELETE FROM users WHERE userid=@userid');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
