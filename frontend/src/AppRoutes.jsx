import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';

import RegisterForm from './features/auth/Register/RegisterForm';
import LoginForm from './features/auth/Login/LoginForm';
import Home from './features/pages/Home';
import Datos from './features/upd/Datos';
import Navbar from './components/Navbar';
import MisMascotas from './features/pets/Mascotas';
import RegistrarMascota from './features/pets/RegistrarMascota';
import DatosMascota from './features/pets/DatosMascota';
import Panel_Adopcion from './features/pages/Panel_Adopcion';

const AppRoutes = ({ isLoggedIn, setIsLoggedIn }) => {
  const navigate = useNavigate();

  const handleLoginSimulado = () => {
    setIsLoggedIn(true);
    navigate('/home');
  };

  const handleLogoutSimulado = () => {
    setIsLoggedIn(false);
    navigate('/home'); 
  };

  return (
    <>
      <Navbar isLoggedIn={isLoggedIn} handleLogout={handleLogoutSimulado} />
      <Routes>
        <Route path="/datos" element={<Datos />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/home" element={<Home />} />
        <Route path="/registrar-mascota" element={<MisMascotas />} />
        <Route path="/registrar-mascota/nueva" element={<RegistrarMascota />} />
        <Route path="/login" element={<LoginForm onLogin={handleLoginSimulado} />} />
        <Route path="/mis-mascotas/:id" element={<DatosMascota />} />
        <Route path="*" element={<Home />} />
        <Route path="/panel_adopcion" element={<Panel_Adopcion />} />
      </Routes>
    </>
  );
};

export default AppRoutes;