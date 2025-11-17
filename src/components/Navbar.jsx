import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Navbar() {
  const navigate = useNavigate();

  async function logout() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error', err);
    }
    navigate('/login');
  }

  return (
    <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderBottom: '2px solid var(--color-primary, #ff6b35)', padding: '12px 16px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        <a href="/" style={{ textDecoration: 'none', fontWeight: 'bold', color: 'var(--color-primary, #ff6b35)', fontSize: 16 }}>Dashboard</a>
        <a href="/inventory" style={{ textDecoration: 'none', color: '#333', fontSize: 14, transition: 'color 0.3s' }} onMouseEnter={e => e.target.style.color = 'var(--color-primary, #ff6b35)'} onMouseLeave={e => e.target.style.color = '#333'}>Inventory</a>
        <a href="/billing" style={{ textDecoration: 'none', color: '#333', fontSize: 14, transition: 'color 0.3s' }} onMouseEnter={e => e.target.style.color = 'var(--color-primary, #ff6b35)'} onMouseLeave={e => e.target.style.color = '#333'}>Billing</a>
        <a href="/closeouts" style={{ textDecoration: 'none', color: '#333', fontSize: 14, transition: 'color 0.3s' }} onMouseEnter={e => e.target.style.color = 'var(--color-primary, #ff6b35)'} onMouseLeave={e => e.target.style.color = '#333'}>Closeouts</a>
        <a href="/changeorder" style={{ textDecoration: 'none', color: '#333', fontSize: 14, transition: 'color 0.3s' }} onMouseEnter={e => e.target.style.color = 'var(--color-primary, #ff6b35)'} onMouseLeave={e => e.target.style.color = '#333'}>Change Order</a>
      </div>
      <button onClick={logout} style={{ background: 'var(--color-primary, #ff6b35)', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>Logout</button>
    </nav>
  );
}
