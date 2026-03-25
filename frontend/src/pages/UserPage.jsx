import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../config';

const EMPTY = { userid: '', username: '', pwd: '' };

export default function UserPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [mode, setMode] = useState('list');
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const res = await axios.get(`${API_BASE}/user`);
      setRecords(res.data);
    } catch {
      setError('載入失敗');
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = records.filter(r =>
    (r.userid || '').includes(search) || (r.username || '').includes(search)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'add') {
        await axios.post(`${API_BASE}/user`, form);
      } else {
        await axios.put(`${API_BASE}/user/${form.userid}`, form);
      }
      setMode('list');
      load();
    } catch (err) {
      setError(err.response?.data?.error || '儲存失敗');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`確定刪除用戶 ${id}?`)) return;
    try {
      await axios.delete(`${API_BASE}/user/${id}`);
      load();
    } catch {
      alert('刪除失敗');
    }
  };

  if (mode !== 'list') {
    return (
      <div className="page">
        <div className="page-header">
          <h2>{mode === 'add' ? '新增用戶' : '修改用戶'}</h2>
        </div>
        <div className="form-card">
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>用戶代碼</label>
              <input value={form.userid}
                onChange={e => setForm({ ...form, userid: e.target.value })}
                disabled={mode === 'edit'} required />
            </div>
            <div className="field">
              <label>用戶名稱</label>
              <input value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })} required />
            </div>
            <div className="field">
              <label>用戶密碼</label>
              <input value={form.pwd}
                onChange={e => setForm({ ...form, pwd: e.target.value })} required />
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
        <h2>用戶資料維護</h2>
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
            <tr><th>用戶代碼</th><th>用戶名稱</th><th>用戶密碼</th><th>操作</th></tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.userid}>
                <td>{r.userid}</td>
                <td>{r.username}</td>
                <td>{r.pwd}</td>
                <td>
                  <button className="btn-sm" onClick={() => { setForm({ ...r }); setMode('edit'); }}>修改</button>
                  <button className="btn-sm danger" onClick={() => handleDelete(r.userid)}>刪除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
