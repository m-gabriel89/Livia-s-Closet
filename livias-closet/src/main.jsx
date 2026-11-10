import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Admin from './admin/Admin';
import './styles.css';

// A gestão fica em  /#admin  (sem biblioteca de rotas, funciona no GitHub Pages)
function Root() {
  const [admin, setAdmin] = useState(location.hash === '#admin');
  const prev = useRef(admin);
  useEffect(() => {
    const f = () => {
      const a = location.hash === '#admin';
      if (a !== prev.current) { prev.current = a; setAdmin(a); window.scrollTo(0, 0); }
    };
    addEventListener('hashchange', f);
    return () => removeEventListener('hashchange', f);
  }, []);
  return admin ? <Admin /> : <App />;
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
