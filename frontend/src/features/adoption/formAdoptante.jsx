import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../../config/api';
import { useNavigate } from 'react-router-dom';
import './FormAdoptante.css';
import profilePhoto from '../../assets/foto1.jpg';
import SeccionSituacionHabitacional from './SeccionSituacionHabitacional';
import SeccionComposicionHogar from './SeccionComposicionHogar';
import SeccionExperienciaAnimales from './SeccionExperienciaAnimales';
import SeccionCuidadosRutina from './SeccionCuidadosRutina';

const SeccionAcordeon = ({ title, children, isOpen, onToggle, isCompleted = false }) => {
    return (
        <div className={`accordion-section ${isOpen ? 'open' : ''}`}>
            <div className="accordion-header" onClick={onToggle}>
                <div className="accordion-title-container">
                    <h2>{title}</h2>
                    {isCompleted && <span className="completion-indicator">✓</span>}
                </div>
                <span className="accordion-icon">{isOpen ? '▼' : '►'}</span>
            </div>
            <div className="accordion-content" style={{ display: isOpen ? 'block' : 'none' }}>
                {children}
            </div>
        </div>
    );
};

const FormularioAdopcion = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState({});
    const [respuestas, setRespuestas] = useState({
        situacionHabitacional: { tipoVivienda: [], tenencia: [], patio: [], seguridad: [] },
        composicionHogar: { personas: '', hayNinos: '', alergias: '', acuerdo: '' },
        experienciaAnimales: { tuvoMascotasAntes: '', tieneMascotasActuales: '', mascotasVacunadas: '' },
        cuidadosRutina: { horasSolo: '', dondeDormira: '', responsableCuidados: '', dispuestoCastrarVacunar: '' }
    });
    const [openSection, setOpenSection] = useState('situacionHabitacional');
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
                id: user.id
            });
        }
    }, []);

    const isSectionCompleted = (sectionName) => {
        const sectionData = respuestas[sectionName];
        if (!sectionData) return false;

        switch (sectionName) {
            case 'situacionHabitacional':
                return sectionData.tipoVivienda?.length > 0 && 
                       sectionData.tenencia?.length > 0 && 
                       sectionData.patio?.length > 0 && 
                       sectionData.seguridad?.length > 0;
            case 'composicionHogar':
                return sectionData.personas && sectionData.hayNinos && sectionData.alergias && sectionData.acuerdo;
            case 'experienciaAnimales':
                const baseComplete = sectionData.tuvoMascotasAntes && sectionData.tieneMascotasActuales;
                if (sectionData.tieneMascotasActuales === 'SI') {
                    return baseComplete && sectionData.mascotasVacunadas;
                }
                return baseComplete;
            case 'cuidadosRutina':
                return sectionData.horasSolo && sectionData.dondeDormira && sectionData.responsableCuidados && sectionData.dispuestoCastrarVacunar;
            default:
                return false;
        }
    };

    const handleChangeSeccion = (sectionName, data) => {
        setRespuestas(prev => ({ ...prev, [sectionName]: data }));
    };

    const handleToggleSection = (sectionName) => {
        setOpenSection(prev => (prev === sectionName ? null : sectionName));
    };

    const validateForm = () => {
        const sections = ['situacionHabitacional', 'composicionHogar', 'experienciaAnimales', 'cuidadosRutina'];
        return sections.every(section => isSectionCompleted(section));
    };

    const handleEnviar = async () => {
        if (!validateForm()) {
            setSubmissionMessage('Por favor, completa todas las secciones antes de enviar.');
            return;
        }

        if (!userData.id) {
            setSubmissionMessage('Error: No se pudo identificar al usuario. Por favor, inicia sesión nuevamente.');
            return;
        }

        setIsSubmitting(true);
        setSubmissionMessage('');

        const requestData = {
            usuario: { id: userData.id },
            situacionHabitacional: {
                isHouse: respuestas.situacionHabitacional.tipoVivienda.includes('CASA'),
                isOwner: respuestas.situacionHabitacional.tenencia.includes('SOY PROPIETARIO'),
                hasYard: respuestas.situacionHabitacional.patio.includes('SI'),
                hasSecurity: respuestas.situacionHabitacional.seguridad.length > 0
            },
            composicionHogar: {
                householdMembers: parseInt(respuestas.composicionHogar.personas),
                hasChildren: respuestas.composicionHogar.hayNinos === 'SI',
                hasAllergies: respuestas.composicionHogar.alergias === 'SI',
                adoptionAgreement: respuestas.composicionHogar.acuerdo === 'SI'
            },
            experienciaAnimales: {
                hadPetsBefore: respuestas.experienciaAnimales.tuvoMascotasAntes === 'SI',
                hasCurrentPets: respuestas.experienciaAnimales.tieneMascotasActuales === 'SI',
                petsVaccinated: respuestas.experienciaAnimales.tieneMascotasActuales === 'SI' 
                    ? respuestas.experienciaAnimales.mascotasVacunadas === 'SI'
                    : null
            },
            cuidadosRutina: {
                hoursAlonePerDay: parseInt(respuestas.cuidadosRutina.horasSolo),
                sleepingLocation: respuestas.cuidadosRutina.dondeDormira === 'AFUERA' ? 'OUTSIDE' : 'INSIDE',
                caretaker: respuestas.cuidadosRutina.responsableCuidados,
                willNeuterVaccinate: respuestas.cuidadosRutina.dispuestoCastrarVacunar === 'SI'
            }
        };

        try {
            // Guardar formulario
            await axios.post(buildApiUrl('/adoption/submit'), requestData);

            // Solicitud de adopción con pet_id
            const petId = window.location.pathname.split('/').pop();
            await axios.post(buildApiUrl('/adoptions/request'), {
                pet_id: parseInt(petId),
                user_id: userData.id
            });

            setSubmissionMessage('¡Formulario enviado con éxito y solicitud de adopción creada! Redirigiendo al inicio...');

            // Resetear formulario
            setRespuestas({
                situacionHabitacional: { tipoVivienda: [], tenencia: [], patio: [], seguridad: [] },
                composicionHogar: { personas: '', hayNinos: '', alergias: '', acuerdo: '' },
                experienciaAnimales: { tuvoMascotasAntes: '', tieneMascotasActuales: '', mascotasVacunadas: '' },
                cuidadosRutina: { horasSolo: '', dondeDormira: '', responsableCuidados: '', dispuestoCastrarVacunar: '' }
            });

            setTimeout(() => navigate('/panel_adopcion'), 2000);

        } catch (error) {
            console.error('Error al enviar solicitud:', error);
            setSubmissionMessage(error.response?.data?.error || 'Hubo un problema al enviar la solicitud. Por favor, inténtalo de nuevo más tarde.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="formulario-adopcion-container">
            <h1>Formulario de Solicitud de Adopción</h1>
            <p className="form-intro">
                Gracias por tu interés en adoptar. Por favor, completa este formulario con tus datos y tus respuestas.
            </p>

            <hr className="divider" />

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

            <SeccionAcordeon
                title="1. Situación Habitacional"
                isOpen={openSection === 'situacionHabitacional'}
                onToggle={() => handleToggleSection('situacionHabitacional')}
                isCompleted={isSectionCompleted('situacionHabitacional')}
            >
                <SeccionSituacionHabitacional
                    onChange={(data) => handleChangeSeccion('situacionHabitacional', data)}
                    initialData={respuestas.situacionHabitacional}
                />
            </SeccionAcordeon>

            <SeccionAcordeon
                title="2. Composición del Hogar"
                isOpen={openSection === 'composicionHogar'}
                onToggle={() => handleToggleSection('composicionHogar')}
                isCompleted={isSectionCompleted('composicionHogar')}
            >
                <SeccionComposicionHogar
                    onChange={(data) => handleChangeSeccion('composicionHogar', data)}
                    initialData={respuestas.composicionHogar}
                />
            </SeccionAcordeon>

            <SeccionAcordeon
                title="3. Experiencia con Animales"
                isOpen={openSection === 'experienciaAnimales'}
                onToggle={() => handleToggleSection('experienciaAnimales')}
                isCompleted={isSectionCompleted('experienciaAnimales')}
            >
                <SeccionExperienciaAnimales
                    onChange={(data) => handleChangeSeccion('experienciaAnimales', data)}
                    initialData={respuestas.experienciaAnimales}
                />
            </SeccionAcordeon>

            <SeccionAcordeon
                title="4. Cuidados y Rutina"
                isOpen={openSection === 'cuidadosRutina'}
                onToggle={() => handleToggleSection('cuidadosRutina')}
                isCompleted={isSectionCompleted('cuidadosRutina')}
            >
                <SeccionCuidadosRutina
                    onChange={(data) => handleChangeSeccion('cuidadosRutina', data)}
                    initialData={respuestas.cuidadosRutina}
                />
            </SeccionAcordeon>

            <div className="boton-enviar-container">
                <button
                    className="boton-enviar"
                    onClick={handleEnviar}
                    disabled={isSubmitting || !validateForm()}
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
