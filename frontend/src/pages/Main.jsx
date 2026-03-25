import { useNavigate } from 'react-router-dom';

export default function Main() {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    navigate('/');
  };

  const menus = [
    { label: '客戶資料維護', icon: '👥', path: '/cust' },
    { label: '廠商資料維護', icon: '🏭', path: '/fact' },
    { label: '商品資料維護', icon: '📦', path: '/item' },
    { label: '用戶資料維護', icon: '👤', path: '/user' },
  ];

  return (
    <div className="main-wrap">
      <div className="main-header">
        <div>
          <div style={{ fontSize: 14, opacity: 0.8 }}>歡迎</div>
          <h2>{user.username || user.userid}</h2>
        </div>
        <button className="logout-btn" onClick={handleLogout}>登出</button>
      </div>
      <div className="main-grid">
        {menus.map(m => (
          <button key={m.path} className="main-btn" onClick={() => navigate(m.path)}>
            <span className="main-icon">{m.icon}</span>
            <span>{m.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
