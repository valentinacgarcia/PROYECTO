import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './AppRoutes';

function App() {
  console.log('✅ App.jsx recargado');

  // Inicializar el estado según si hay un usuario en localStorage
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem('user');
  });

  return (
    <Router>
      <AppRoutes isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
    </Router>
  );
}

export default App;
