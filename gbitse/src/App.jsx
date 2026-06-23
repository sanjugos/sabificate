import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CompanyList from './pages/CompanyList';
import CompanyDetail from './pages/CompanyDetail';
import ContactList from './pages/ContactList';
import DossierList from './pages/DossierList';
import Pipeline from './pages/Pipeline';


function isLoggedIn() {
  try {
    const s = JSON.parse(localStorage.getItem('gbitse-session'));
    if (!s) return false;
    return Date.now() - s.loginAt < 7 * 24 * 60 * 60 * 1000;
  } catch { return false; }
}

export default function App() {
  const [authed, setAuthed] = useState(isLoggedIn());

  if (!authed) return <Login onLogin={() => setAuthed(true)} />;

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout onLogout={() => { localStorage.removeItem('gbitse-session'); setAuthed(false); }} />}>
          <Route index element={<Dashboard />} />
          <Route path="companies" element={<CompanyList />} />
          <Route path="companies/:id" element={<CompanyDetail />} />
          <Route path="contacts" element={<ContactList />} />
          <Route path="dossiers" element={<DossierList />} />
          <Route path="pipeline" element={<Pipeline />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
