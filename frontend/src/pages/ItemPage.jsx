import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../config';

const EMPTY = { item_code: '', item_name: '', fact_code: '' };

export default function ItemPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [facts, setFacts] = useState([]);
  const [mode, setMode] = useState('list');
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [itemRes, factRes] = await Promise.all([
        axios.get(`${API_BASE}/item`),
        axios.get(`${API_BASE}/fact`)
      ]);
      setRecords(itemRes.data);
      setFacts(factRes.data);
    } catch {
      setError('載入失敗');
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = records.filter(r =>
    (r.item_code || '').includes(search) || (r.item_name || '').includes(search)
  );

  const getFactName = (code) => {
    const f = facts.find(f => f.fact_code === code);
    return f ? f.fact_name : code;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'add') {
        await axios.post(`${API_BASE}/item`, form);
      } else {
        await axios.put(`${API_BASE}/item/${form.item_code}`, form);
      }
      setMode('list');
      load();
    } catch (err) {
      setError(err.response?.data?.error || '儲存失敗');
    }
  };

  const handleDelete = async (code) => {
    if (!window.confirm(`確定刪除商品 ${code}?`)) return;
    try {
      await axios.delete(`${API_BASE}/item/${code}`);
      load();
    } catch {
      alert('刪除失敗');
    }
  };

  if (mode !== 'list') {
    return (
      <div className="page">
        <div className="page-header">
          <h2>{mode === 'add' ? '新增商品' : '修改商品'}</h2>
        </div>
        <div className="form-card">
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>商品代碼</label>
              <input value={form.item_code}
                onChange={e => setForm({ ...form, item_code: e.target.value })}
                disabled={mode === 'edit'} required />
            </div>
            <div className="field">
              <label>商品名稱</label>
              <input value={form.item_name}
                onChange={e => setForm({ ...form, item_name: e.target.value })} required />
            </div>
            <div className="field">
              <label>主供應商</label>
              <select value={form.fact_code}
                onChange={e => setForm({ ...form, fact_code: e.target.value })}>
                <option value="">-- 請選擇 --</option>
                {facts.map(f => (
                  <option key={f.fact_code} value={f.fact_code}>{f.fact_code} - {f.fact_name}</option>
                ))}
              </select>
            </div>
            {error && <p className="error-msg">{error}</p>}
            <div className="btn-row">
              <button type="submit" className="btn-primary">儲存</button>
              <button type="button" className="btn-secondary" onClick={() => setMode('list')}>取消</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>商品資料維護</h2>
        <button className="btn-secondary" onClick={() => navigate('/main')}>返回</button>
      </div>
      <div className="toolbar">
        <input className="search" placeholder="搜尋代碼或名稱..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <button className="btn-primary" onClick={() => { setForm(EMPTY); setMode('add'); }}>新增</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>商品代碼</th><th>商品名稱</th><th>主供應商</th><th>操作</th></tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.item_code}>
                <td>{r.item_code}</td>
                <td>{r.item_name}</td>
                <td>{getFactName(r.fact_code)}</td>
                <td>
                  <button className="btn-sm" onClick={() => { setForm({ ...r }); setMode('edit'); }}>修改</button>
                  <button className="btn-sm danger" onClick={() => handleDelete(r.item_code)}>刪除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
