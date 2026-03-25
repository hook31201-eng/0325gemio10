const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM item ORDER BY item_code');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { item_code, item_name, fact_code } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('item_code', sql.NVarChar, item_code)
      .input('item_name', sql.NVarChar, item_name)
      .input('fact_code', sql.NVarChar, fact_code || '')
      .query('INSERT INTO item (item_code, item_name, fact_code) VALUES (@item_code, @item_name, @fact_code)');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:code', async (req, res) => {
  const { item_name, fact_code } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('item_code', sql.NVarChar, req.params.code)
      .input('item_name', sql.NVarChar, item_name)
      .input('fact_code', sql.NVarChar, fact_code || '')
      .query('UPDATE item SET item_name=@item_name, fact_code=@fact_code WHERE item_code=@item_code');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:code', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('item_code', sql.NVarChar, req.params.code)
      .query('DELETE FROM item WHERE item_code=@item_code');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
