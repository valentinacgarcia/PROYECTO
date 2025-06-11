import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';

import RegisterForm from './features/auth/Register/RegisterForm';
import LoginForm from './features/auth/Login/LoginForm';
import Home from './features/dashboard/Home';
import Datos from './features/upd/Datos';
import Navbar from './components/Navbar';

const AppRoutes = ({ isLoggedIn, setIsLoggedIn }) => {
  const navigate = useNavigate();

  const handleLoginSimulado = () => {
    setIsLoggedIn(true);
    navigate('/home');
  };

  const handleLogoutSimulado = () => {
    setIsLoggedIn(false);
    navigate('/home'); // <-- esto es lo que querías
  };

  return (
    <>
      <Navbar isLoggedIn={isLoggedIn} handleLogout={handleLogoutSimulado} />
      <Routes>
        <Route path="/datos" element={<Datos />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<LoginForm onLogin={handleLoginSimulado} />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </>
  );
};

export default AppRoutes;