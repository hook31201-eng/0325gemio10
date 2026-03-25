import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../config';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ userid: '', pwd: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, form);
      if (res.data.success) {
        sessionStorage.setItem('user', JSON.stringify(res.data.user));
        navigate('/main');
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError('連線失敗，請確認後端服務是否啟動');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>TriSys</h1>
        <p className="subtitle">三層式資料維護系統</p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>用戶代碼</label>
            <input
              value={form.userid}
              onChange={e => setForm({ ...form, userid: e.target.value })}
              placeholder="請輸入用戶代碼"
              required
              autoFocus
            />
          </div>
          <div className="field">
            <label>用戶密碼</label>
            <input
              type="password"
              value={form.pwd}
              onChange={e => setForm({ ...form, pwd: e.target.value })}
              placeholder="請輸入密碼"
              required
            />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <div style={{ marginTop: '20px' }}>
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px' }} disabled={loading}>
              {loading ? '登入中...' : '登入'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
