import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../config';

const EMPTY = { fact_code: '', fact_name: '', remark: '' };

export default function FactPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [mode, setMode] = useState('list');
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const res = await axios.get(`${API_BASE}/fact`);
      setRecords(res.data);
    } catch {
      setError('載入失敗');
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = records.filter(r =>
    (r.fact_code || '').includes(search) || (r.fact_name || '').includes(search)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'add') {
        await axios.post(`${API_BASE}/fact`, form);
      } else {
        await axios.put(`${API_BASE}/fact/${form.fact_code}`, form);
      }
      setMode('list');
      load();
    } catch (err) {
      setError(err.response?.data?.error || '儲存失敗');
    }
  };

  const handleDelete = async (code) => {
    if (!window.confirm(`確定刪除廠商 ${code}?`)) return;
    try {
      await axios.delete(`${API_BASE}/fact/${code}`);
      load();
    } catch {
      alert('刪除失敗');
    }
  };

  if (mode !== 'list') {
    return (
      <div className="page">
        <div className="page-header">
          <h2>{mode === 'add' ? '新增廠商' : '修改廠商'}</h2>
        </div>
        <div className="form-card">
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>廠商代碼</label>
              <input value={form.fact_code}
                onChange={e => setForm({ ...form, fact_code: e.target.value })}
                disabled={mode === 'edit'} required />
            </div>
            <div className="field">
              <label>廠商名稱</label>
              <input value={form.fact_name}
                onChange={e => setForm({ ...form, fact_name: e.target.value })} required />
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
        <h2>廠商資料維護</h2>
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
            <tr><th>廠商代碼</th><th>廠商名稱</th><th>備註說明</th><th>操作</th></tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.fact_code}>
                <td>{r.fact_code}</td>
                <td>{r.fact_name}</td>
                <td>{r.remark}</td>
                <td>
                  <button className="btn-sm" onClick={() => { setForm({ ...r }); setMode('edit'); }}>修改</button>
                  <button className="btn-sm danger" onClick={() => handleDelete(r.fact_code)}>刪除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
