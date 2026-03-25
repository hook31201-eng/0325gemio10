import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../config';

const EMPTY = { cust_code: '', cust_name: '', remark: '' };

export default function CustPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [mode, setMode] = useState('list');
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const res = await axios.get(`${API_BASE}/cust`);
      setRecords(res.data);
    } catch {
      setError('載入失敗');
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = records.filter(r =>
    (r.cust_code || '').includes(search) || (r.cust_name || '').includes(search)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'add') {
        await axios.post(`${API_BASE}/cust`, form);
      } else {
        await axios.put(`${API_BASE}/cust/${form.cust_code}`, form);
      }
      setMode('list');
      load();
    } catch (err) {
      setError(err.response?.data?.error || '儲存失敗');
    }
  };

  const handleDelete = async (code) => {
    if (!window.confirm(`確定刪除客戶 ${code}?`)) return;
    try {
      await axios.delete(`${API_BASE}/cust/${code}`);
      load();
    } catch {
      alert('刪除失敗');
    }
  };

  if (mode !== 'list') {
    return (
      <div className="page">
        <div className="page-header">
          <h2>{mode === 'add' ? '新增客戶' : '修改客戶'}</h2>
        </div>
        <div className="form-card">
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>客戶代碼</label>
              <input value={form.cust_code}
                onChange={e => setForm({ ...form, cust_code: e.target.value })}
                disabled={mode === 'edit'} required />
            </div>
            <div className="field">
              <label>客戶名稱</label>
              <input value={form.cust_name}
                onChange={e => setForm({ ...form, cust_name: e.target.value })} required />
            </div>
            <div className="field">
              <label>備註說明</label>
              <input value={form.remark}
                onChange={e => setForm({ ...form, remark: e.target.value })} />
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
        <h2>客戶資料維護</h2>
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
            <tr><th>客戶代碼</th><th>客戶名稱</th><th>備註說明</th><th>操作</th></tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.cust_code}>
                <td>{r.cust_code}</td>
                <td>{r.cust_name}</td>
                <td>{r.remark}</td>
                <td>
                  <button className="btn-sm" onClick={() => { setForm({ ...r }); setMode('edit'); }}>修改</button>
                  <button className="btn-sm danger" onClick={() => handleDelete(r.cust_code)}>刪除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
