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
import Panel_Adopcion from './features/adoption/Panel_Adopcion';
import VistaMascota from './features/adoption/Pet_View';
import FormularioAdopcion from './features/adoption/formAdoptante';
import FormularioNuevaAdopcion from './features/adoption/FormAdopcion';
import PostulacionesPanel from './features/adopters/PostulacionesPanel';
import Panel_Recomendations from './features/adoption/Panel_Recomendations';
import RegistrarServicio from './features/services/RegistrarServicio';
import PanelServicios from './features/services/PanelServicios';

const AppRoutes = ({ isLoggedIn, setIsLoggedIn }) => {
  const navigate = useNavigate();

  // Función que activa sesión al loguearse
  const handleLoginSimulado = () => {
    setIsLoggedIn(true);
    navigate('/home');
  };

  // Función de logout real, borra localStorage
  const handleLogoutSimulado = () => {
    localStorage.removeItem('user'); 
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
        <Route path="/adopcion/:id" element={<VistaMascota />} />
        <Route path="/formulario_adopcion/:id" element={<FormularioAdopcion isLoggedIn={isLoggedIn} />} />
        <Route path="/postulaciones" element={<PostulacionesPanel  isLoggedIn={isLoggedIn} />} />
        <Route path="/formulario_nueva_adopcion" element={<FormularioNuevaAdopcion />} />
        <Route path="/recomendaciones" element={<Panel_Recomendations  isLoggedIn={isLoggedIn} />} />
        <Route path="/registrar_servicio" element={<RegistrarServicio />} isLoggedIn={isLoggedIn} />
        <Route path="/panel_servicios" element={<PanelServicios />} isLoggedIn={isLoggedIn} />
      </Routes>
    </>
  );
};

export default AppRoutes;