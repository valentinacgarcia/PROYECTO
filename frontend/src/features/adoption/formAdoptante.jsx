import React, { useState, useEffect } from 'react';
import './FormAdoptante.css';
import profilePhoto from '../../assets/foto1.jpg'; 

// Importa tus componentes de sección
import SeccionSituacionHabitacional from './SeccionSituacionHabitacional';
import SeccionComposicionHogar from './SeccionComposicionHogar';
import SeccionExperienciaAnimales from './SeccionExperienciaAnimales';
import SeccionCuidadosRutina from './SeccionCuidadosRutina';

// --- Nuevo Componente: SeccionAcordeon ---
const SeccionAcordeon = ({ title, children, isOpen, onToggle }) => {
    return (
        <div className="accordion-section">
            <div className="accordion-header" onClick={onToggle}>
                <h2>{title}</h2>
                <span className={`accordion-icon ${isOpen ? 'open' : ''}`}>&#9660;</span> {/* Flecha hacia abajo/arriba */}
            </div>
            {isOpen && (
                <div className="accordion-content">
                    {children}
                </div>
            )}
        </div>
    );
};
// --- Fin Nuevo Componente ---

const FormularioAdopcion = () => {
    const [userData, setUserData] = useState({});
    const [respuestas, setRespuestas] = useState({});
    const [openSection, setOpenSection] = useState(null); 
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionMessage, setSubmissionMessage] = useState('');

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            setUserData({
                nombre: user.name || '',
                apellido: user.last_name || '',
                email: user.email || '',
                telefono: user.phone || '',
                direccion: user.address || '',
            });
        }
    }, []);

    // Manejador genérico para las respuestas de las secciones
    const handleChangeSeccion = (sectionName, data) => {
        setRespuestas((prev) => ({
            ...prev,
            [sectionName]: data
        }));
    };

    // Manejador para alternar la visibilidad de una sección
    const handleToggleSection = (sectionName) => {
        setOpenSection(prevOpenSection =>
            prevOpenSection === sectionName ? null : sectionName
        );
    };

    const handleEnviar = async () => {
        setIsSubmitting(true);
        setSubmissionMessage('');

        const datosFinales = {
            usuario: userData,
            ...respuestas,
        };

        console.log('📌 Datos enviados:', datosFinales);

        try {
            /*
            const response = await fetch('http://localhost:8000/adopcion/formulario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosFinales),
            });
            if (!response.ok) {
                throw new Error('Error al enviar la solicitud.');
            }
            const data = await response.json();
            setSubmissionMessage('¡Tu solicitud ha sido enviada con éxito! Nos pondremos en contacto pronto.');
            // Aquí podrías limpiar el formulario o redirigir
            */
            // Simular API
            await new Promise(resolve => setTimeout(resolve, 1500));
            setSubmissionMessage('¡Tu solicitud ha sido enviada con éxito! Nos pondremos en contacto pronto.');
            // Opcional: limpiar respuestas o establecer openSection a null
            // setRespuestas({});
            // setOpenSection(null);

        } catch (err) {
            console.error('Error al enviar solicitud:', err);
            setSubmissionMessage('Hubo un problema al enviar la solicitud. Por favor, inténtalo de nuevo más tarde.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="formulario-adopcion-container">
            <h1>Formulario de Solicitud de Adopción</h1>
            <p className="form-intro">
                Gracias por tu interés en adoptar. Por favor, completa este formulario con tus datos y tus respuestas para ayudarnos a encontrar el mejor hogar para nuestros animales.
            </p>

            <hr className="divider" />

            {/* --- DATOS DEL USUARIO --- */}
            <div className="usuario-info-card">
                <h3>Tus Datos Personales</h3>
                <div className="user-profile-display">
                    <img src={profilePhoto} alt="Foto de perfil" className="foto-usuario" />
                    <div className="datos-usuario">
                        <p><strong>Nombre:</strong> {userData.nombre} {userData.apellido}</p>
                        <p><strong>Email:</strong> {userData.email}</p>
                        <p><strong>Teléfono:</strong> {userData.telefono}</p>
                        <p><strong>Dirección:</strong> {userData.direccion}</p>
                    </div>
                </div>
            </div>

            <hr className="divider" />

            {/* --- SECCIONES RETRÁCTILES --- */}
            <SeccionAcordeon
                title="1. Situación Habitacional"
                isOpen={openSection === 'situacionHabitacional'}
                onToggle={() => handleToggleSection('situacionHabitacional')}
            >
                <SeccionSituacionHabitacional
                    onChange={(data) => handleChangeSeccion('situacionHabitacional', data)}
                />
            </SeccionAcordeon>

            <SeccionAcordeon
                title="2. Composición del Hogar"
                isOpen={openSection === 'composicionHogar'}
                onToggle={() => handleToggleSection('composicionHogar')}
            >
                <SeccionComposicionHogar
                    onChange={(data) => handleChangeSeccion('composicionHogar', data)}
                />
            </SeccionAcordeon>

            <SeccionAcordeon
                title="3. Experiencia con Animales"
                isOpen={openSection === 'experienciaAnimales'}
                onToggle={() => handleToggleSection('experienciaAnimales')}
            >
                <SeccionExperienciaAnimales
                    onChange={(data) => handleChangeSeccion('experienciaAnimales', data)}
                />
            </SeccionAcordeon>

            <SeccionAcordeon
                title="4. Cuidados y Rutina"
                isOpen={openSection === 'cuidadosRutina'}
                onToggle={() => handleToggleSection('cuidadosRutina')}
            >
                <SeccionCuidadosRutina
                    onChange={(data) => handleChangeSeccion('cuidadosRutina', data)}
                />
            </SeccionAcordeon>

            <div className="boton-enviar-container">
                <button
                    className="boton-enviar"
                    onClick={handleEnviar}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
                </button>
            </div>

            {submissionMessage && (
                <p className={`submission-message ${submissionMessage.includes('éxito') ? 'success' : 'error'}`}>
                    {submissionMessage}
                </p>
            )}
        </div>
    );
};

export default FormularioAdopcion;