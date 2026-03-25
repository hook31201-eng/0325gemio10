const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../config/db');

router.post('/login', async (req, res) => {
  const { userid, pwd } = req.body;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('userid', sql.NVarChar, userid)
      .input('pwd', sql.NVarChar, pwd)
      .query('SELECT userid, username FROM users WHERE userid=@userid AND pwd=@pwd');
    if (result.recordset.length > 0) {
      res.json({ success: true, user: result.recordset[0] });
    } else {
      res.json({ success: false, message: '帳號或密碼錯誤' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
