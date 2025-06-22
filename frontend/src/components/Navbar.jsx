import React, {useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';
import logo from '../assets/logo.png'; 


const Navbar = ({isLoggedIn, handleLogout}) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [isLoggedIn]);
  
  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleRegisterClick = () => {
    navigate('/register');
  };

  const handleProfileClick = () => {
    setMenuOpen((prev) => !prev);
  };

  const handleDatosClick = () => {
    setMenuOpen(false);
    navigate('/datos');
  };

  //Metodo para borrar el usuario loggeado
  const handleDeleteAccount = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      alert('No se encontró usuario logueado.');
      return;
    }

    if (!window.confirm('¿Estás seguro que querés eliminar tu cuenta? Esta acción es irreversible.')) {
      return;
    }

    fetch(`http://localhost:8000/user/${user.id}`, {
      method: 'DELETE',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Error al eliminar la cuenta');
        }
        return response.json();
      })
      .then(() => {
        // Limpio localStorage y estado de sesión
        localStorage.removeItem('user');
        handleLogout(); // Para actualizar estado en el padre y UI
        navigate('/login');
      })
      .catch((error) => {
        console.error(error);
        alert('Hubo un error al eliminar la cuenta. Intente más tarde.');
      });
  };


  const handleHomeClick = () => {
    navigate ('/home');
  }

  return (
    <nav className="navbar" >
      <div className="navbar-left" onClick={handleHomeClick} style={{ cursor: 'pointer' }}>
        <img src={logo} alt="Logo" className="logo" />
        <span className="brand-name">PetMatch</span>
      </div>

      <div className="navbar-center">
        <span className="nav-item">Inicio</span>
        <span className="nav-item">Adopta</span>
        <span className="nav-item">Da en adopción</span>
        <span className="nav-item">Servicios</span>
        <span className="nav-item">Nosotros</span>
      </div>

      <div className="navbar-right">
        {!isLoggedIn ? (
          <>
            <button className="nav-button" onClick={handleLoginClick}>Iniciar sesión</button>
            <button className="nav-button register" onClick={handleRegisterClick}>Registrarse</button>
          </>
        ) : (
          <div className="perfil-container">
            <button className="nav-button profile" onClick={handleProfileClick}>
              Perfil
            </button>
            {menuOpen && (
              <div className="perfil-dropdown">
                <span onClick={handleDatosClick}>Datos</span>
                <span onClick={handleDeleteAccount}>Eliminar cuenta</span>
                <hr className="dropdown-separator" />
                <span onClick={handleLogout}>Cerrar sesión</span>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;