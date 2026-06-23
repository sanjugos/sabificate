import { useState } from 'react';

export default function Login({ onLogin }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (user === 'gbitse' && pass === 'hrleads2026!') {
      localStorage.setItem('gbitse-session', JSON.stringify({ user, loginAt: Date.now() }));
      onLogin();
    } else { setErr('Invalid credentials'); }
  };

  return (
    <div className="min-h-screen bg-brand-900 flex items-center justify-center p-4">
      <div className="card p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-brand-800 font-bold text-xl">G</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Gbitse CRM</h1>
          <p className="text-sm text-gray-500 mt-1">Nigeria HR/OD Lead Intelligence</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="input" placeholder="Username" value={user} onChange={e => setUser(e.target.value)} />
          <input className="input" type="password" placeholder="Password" value={pass} onChange={e => setPass(e.target.value)} />
          {err && <p className="text-red-600 text-sm">{err}</p>}
          <button type="submit" className="btn-primary w-full">Sign in</button>
        </form>
      </div>
    </div>
  );
}
