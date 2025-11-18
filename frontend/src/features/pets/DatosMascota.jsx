import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../../config/api';
import './DatosMascota.css';
import perroIcon from '../../assets/perro.png';
import gatoIcon from '../../assets/gato.png';
import { FaTrashAlt } from 'react-icons/fa'; 

const DatosMascota = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [mascota, setMascota] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [error, setError] = useState('');
    const [edicionExitosa, setEdicionExitosa] = useState(false);
    const [eliminacionExitosa, setEliminacionExitosa] = useState(false);

    const [formData, setFormData] = useState({
        tipo: '',
        nombre: '',
        sexo: '',
        fechaNacimiento: '',
        fechaRescate: '',
        esFechaRescate: false,
        tamaño: '',
        raza: '',
        coloresPelaje: [],
        largoPelo: '',
        descripcion: '',
        castrado: '',
        vacunasAlDia: '',
        compatibilidad: [],
        lugarEncontrado: '',
    });

    // Listas de razas según tipo
    const razasPerro = [
        'Mestizo', 'Caniche', 'Labrador Retriever', 'Golden Retriever', 'Bulldog Francés',
        'Shitzu', 'Dachshund (salchicha)', 'Beagle', 'Schnauzer', 'Boxer', 'Otro'
    ];
    const razasGato = [
        'Mestizo', 'Siames', 'Persa', 'Bengala', 'Maine Coon', 'Sphynx', 'Ragdoll', 'Otro'
    ];

    useEffect(() => {
        fetch(buildApiUrl(`/pet/detail/${id}`))
            .then((res) => res.json())
            .then((data) => {
                setMascota(data);
                setFormData({
                    tipo: data.type || '',
                    nombre: data.name || '',
                    sexo: data.gender || '',
                    fechaNacimiento: !data.rescue_date ? calcularFechaDesdeEdad(data.age_years, data.age_months) : '',
                    fechaRescate: data.rescue_date || '',
                    esFechaRescate: !!data.rescue_date,
                    tamaño: data.size || '',
                    raza: data.breed || '',
                    coloresPelaje: data.colors || [],
                    largoPelo: data.fur_length || '',
                    descripcion: data.description || '',
                    castrado: data.sterilized || '',
                    vacunasAlDia: data.vaccinated || '',
                    compatibilidad: data.compatibility || [],
                    lugarEncontrado: data.found_location || '',
                });
            })
            .catch((err) => console.error('Error al cargar datos de la mascota:', err));
    }, [id]);

    const calcularFechaDesdeEdad = (años, meses) => {
        const hoy = new Date();
        hoy.setFullYear(hoy.getFullYear() - (años ?? 0));
        hoy.setMonth(hoy.getMonth() - (meses ?? 0));
        return hoy.toISOString().split('T')[0];
    };

    const formatearFecha = (fechaISO) => {
        if (!fechaISO) return 'No informada';
        const fecha = new Date(fechaISO);
        return fecha.toLocaleDateString('es-AR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target; 
        if (type === 'checkbox' && name === 'coloresPelaje') {
            setFormData((prev) => ({
                ...prev,
                coloresPelaje: checked
                    ? [...prev.coloresPelaje, value]
                    : prev.coloresPelaje.filter((color) => color !== value),
            }));
        } else if (type === 'checkbox' && name === 'esFechaRescate') {
            setFormData((prev) => ({ ...prev, esFechaRescate: checked }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleTipoSelect = (tipo) => {
        setFormData((prev) => ({
            ...prev,
            tipo,
            raza: '' // Resetea la raza al cambiar el tipo
        }));
    };
    const handleSexoSelect = (sexo) => setFormData((prev) => ({ ...prev, sexo }));
    const handleTamañoSelect = (tamaño) => setFormData((prev) => ({ ...prev, tamaño }));
    const handleLargoPeloSelect = (largoPelo) => setFormData((prev) => ({ ...prev, largoPelo }));
    const handleCastradoSelect = (castrado) => setFormData((prev) => ({ ...prev, castrado }));
    const handleVacunasSelect = (vacunasAlDia) => setFormData((prev) => ({ ...prev, vacunasAlDia }));
    const handleCompatibilidadToggle = (item) => {
        setFormData((prev) => {
            const tiene = prev.compatibilidad.includes(item);
            return {
                ...prev,
                compatibilidad: tiene
                    ? prev.compatibilidad.filter((c) => c !== item)
                    : [...prev.compatibilidad, item],
            };
        });
    };

    const handleCancelar = () => {
        if (mascota) {
            setFormData({
                tipo: mascota.type || '',
                nombre: mascota.name || '',
                sexo: mascota.gender || '',
                fechaNacimiento: !mascota.rescue_date ? calcularFechaDesdeEdad(mascota.age_years, mascota.age_months) : '',
                fechaRescate: mascota.rescue_date || '',
                esFechaRescate: !!mascota.rescue_date,
                tamaño: mascota.size || '',
                raza: mascota.breed || '',
                coloresPelaje: mascota.colors || [],
                largoPelo: mascota.fur_length || '',
                descripcion: mascota.description || '',
                castrado: mascota.sterilized || '',
                vacunasAlDia: mascota.vaccinated || '',
                compatibilidad: mascota.compatibility || [],
                lugarEncontrado: mascota.found_location || '',
            });
        }
        setError('');
        setEditMode(false);
    };

    const handleEliminar = async () => {
        const confirmacion = window.confirm('¿Estás seguro que querés eliminar esta mascota? Esta acción no se puede deshacer.');
        if (!confirmacion) return;

        try {
            const response = await fetch(buildApiUrl(`/pet/delete/${id}`), {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Error al eliminar la mascota.');
            }

            setEliminacionExitosa(true);
        } catch (error) {
            console.error(error);
            setError('Hubo un error al eliminar la mascota.');
        }
    };

    const handleGuardar = async () => {
        if (
            !formData.tipo ||
            !formData.nombre ||
            !formData.sexo ||
            (!formData.fechaNacimiento && !formData.fechaRescate) ||
            !formData.tamaño
        ) {
            setError('Por favor, complete todos los campos obligatorios.');
            return;
        }

        const fechaBase = new Date(
            formData.esFechaRescate ? formData.fechaRescate : formData.fechaNacimiento
        );
        const hoy = new Date();
        let ageYears = hoy.getFullYear() - fechaBase.getFullYear();
        let ageMonths = hoy.getMonth() - fechaBase.getMonth();
        if (ageMonths < 0) {
            ageYears -= 1;
            ageMonths += 12;
        }

        setError(''); // Limpiar errores previos

        const dataJson = {
            type: formData.tipo,
            name: formData.nombre,
            gender: formData.sexo,
            age_years: ageYears,
            age_months: ageMonths,
            size: formData.tamaño,
            is_purebred: formData.raza !== '' && formData.raza !== 'no-raza',
            breed: formData.raza || '',
            colors: formData.coloresPelaje,
            fur_length: formData.largoPelo,
            sterilized: formData.castrado,
            vaccinated: formData.vacunasAlDia,
            compatibility: formData.compatibilidad,
            description: formData.descripcion,
            found_location: formData.lugarEncontrado || '',
            rescue_date: formData.esFechaRescate ? formData.fechaRescate : null,
            birth_date: !formData.esFechaRescate ? formData.fechaNacimiento : null,
        };

        try {
            const responseJson = await fetch(buildApiUrl(`/pet/edit/${id}`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataJson),
            });

            if (!responseJson.ok) {
                const errorData = await responseJson.json();
                throw new Error(errorData.message || 'Error al guardar los datos de la mascota.');
            }

            const updated = await fetch(buildApiUrl(`/pet/detail/${id}`));
            const updatedMascota = await updated.json();

            setMascota(updatedMascota);
            setEditMode(false);
            setError('');
            setEdicionExitosa(true);

        } catch (err) {
            console.error(err);
            setError(`Hubo un error al guardar los cambios: ${err.message || 'Error desconocido'}`);
        }
    };

    if (!mascota) return <div className="datos-container"><p>Cargando datos...</p></div>;

    // Seleccionar lista de razas según tipo
    const listaRazas = formData.tipo === 'Perro' ? razasPerro : formData.tipo === 'Gato' ? razasGato : [];

    return (
        <div className="datos-container">
            <div className="contenido-principal-horizontal">
                {/* Columna izquierda: Fotos */}
                <div className="columna foto-col">
                    <div className="profile-photo-container">
                        <img
                            src={mascota.photos?.[0] || '/placeholder.jpg'}
                            alt={mascota.name}
                            className="profile-photo"
                        />
                    </div>
                </div>

                {/* Contenedor central + derecho */}
                <div className="datos-central-derecha">
                    <h2 className="titulo-principal">Datos de {formData.nombre || mascota.name}</h2>
                    <div className="datos-columns">
                        {/* Columna central */}
                        <div className="columna principales-col">
                            {error && <p className="form-error">{error}</p>}

                            <label>Tipo de mascota:</label>
                            {editMode ? (
                                <div className="icon-selector">
                                    {['Perro', 'Gato'].map((tipo) => (
                                        <div
                                            key={tipo}
                                            className={`icon-option ${formData.tipo === tipo ? 'selected' : ''}`}
                                            onClick={() => handleTipoSelect(tipo)}
                                        >
                                            <img src={tipo === 'Perro' ? perroIcon : gatoIcon} alt={tipo} />
                                            <span>{tipo}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <input type="text" value={mascota.type || ''} disabled />
                            )}

                            <label>Nombre:</label>
                            {editMode ? (
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleInputChange}
                                    placeholder="Ej: Luna"
                                />
                            ) : (
                                <input type="text" value={mascota.name || ''} disabled />
                            )}

                            <label>Sexo:</label>
                            {editMode ? (
                                <div className="chip-selector">
                                    {['Macho', 'Hembra', 'No se'].map((sexo) => (
                                        <span
                                            key={sexo}
                                            className={`sexo-chip ${formData.sexo === sexo ? 'activo' : ''}`}
                                            onClick={() => handleSexoSelect(sexo)}
                                        >
                                            {sexo}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <input type="text" value={mascota.gender || ''} disabled />
                            )}

                            <label>{formData.esFechaRescate ? 'Fecha de rescate:' : 'Edad:'}</label>
                            {editMode ? (
                                <>
                                    <input
                                        type="date"
                                        name={formData.esFechaRescate ? 'fechaRescate' : 'fechaNacimiento'}
                                        value={formData.esFechaRescate ? formData.fechaRescate : formData.fechaNacimiento}
                                        onChange={handleInputChange}
                                    />
                                    <div className="checkbox-fecha">
                                        <input
                                            type="checkbox"
                                            name="esFechaRescate"
                                            checked={formData.esFechaRescate}
                                            onChange={handleInputChange}
                                            id="esFechaRescate"
                                        />
                                        <label htmlFor="esFechaRescate">No sé la fecha exacta, es la fecha de rescate</label>
                                    </div>
                                </>
                            ) : (
                                <input
                                    type="text"
                                    value={
                                        mascota.rescue_date
                                            ? `Rescatado el ${formatearFecha(mascota.rescue_date)}`
                                            : mascota.age_years === 0 && mascota.age_months === 0
                                                ? 'No informada'
                                                : `${mascota.age_years} año${mascota.age_years !== 1 ? 's' : ''} y ${mascota.age_months} mes${mascota.age_months !== 1 ? 'es' : ''}`
                                    }
                                    disabled
                                />
                            )}

                            <label>Tamaño:</label>
                            {editMode ? (
                                <div className="chip-selector">
                                    {['Pequeño', 'Mediano', 'Grande'].map((tam) => (
                                        <span
                                            key={tam}
                                            className={`tamano-chip ${formData.tamaño === tam ? 'activo' : ''}`}
                                            onClick={() => handleTamañoSelect(tam)}
                                        >
                                            {tam}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <input type="text" value={mascota.size || ''} disabled />
                            )}
                        </div>

                        {/* Columna derecha */}
                        <div className="columna secundarios-col">
                            <label>Raza:</label>
                            {editMode ? (
                                <select name="raza" value={formData.raza} onChange={handleInputChange}>
                                    <option value="">Seleccionar raza</option>
                                    {listaRazas.map((r) => (
                                        <option key={r.toLowerCase()} value={r.toLowerCase()}>
                                            {r}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input type="text" value={mascota.breed || 'No informada'} disabled />
                            )}

                            <label>Color del pelaje:</label>
                            {editMode ? (
                                <div className="checkbox-group">
                                    {['Blanco', 'Negro', 'Marrón', 'Tricolor', 'Otro'].map((color) => (
                                        <label key={color} className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                name="coloresPelaje"
                                                value={color.toLowerCase()}
                                                checked={formData.coloresPelaje.includes(color.toLowerCase())}
                                                onChange={handleInputChange}
                                            />
                                            {color}
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <input type="text" value={mascota.colors?.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ') || 'No informado'} disabled />
                            )}

                            <label>Largo del pelaje:</label>
                            {editMode ? (
                                <div className="chip-selector">
                                    {['Corto', 'Medio', 'Largo'].map((largo) => (
                                        <span
                                            key={largo}
                                            className={`largo-chip ${formData.largoPelo === largo ? 'activo' : ''}`}
                                            onClick={() => handleLargoPeloSelect(largo)}
                                        >
                                            {largo}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <input type="text" value={mascota.fur_length || 'No informado'} disabled />
                            )}

                            <label>Descripción:</label>
                            {editMode ? (
                                <textarea
                                    name="descripcion"
                                    value={formData.descripcion}
                                    onChange={handleInputChange}
                                    rows={4}
                                    placeholder="Contanos cómo es la mascota: personalidad, hábitos, etc."
                                />
                            ) : (
                                <textarea value={mascota.description || 'Sin descripción'} disabled />
                            )}

                            <label>Lugar donde encontraste la mascota:</label>
                            {editMode ? (
                                <input
                                    type="text"
                                    name="lugarEncontrado"
                                    value={formData.lugarEncontrado}
                                    onChange={handleInputChange}
                                    placeholder="Ej: Parque Sarmiento, Calle San Martín 500"
                                />
                            ) : (
                                <input type="text" value={mascota.found_location || 'No informado'} disabled />
                            )}

                            <label>Castrado/a:</label>
                            {editMode ? (
                                <div className="chip-selector">
                                    {['Sí', 'No', 'No sé'].map((opcion) => (
                                        <span
                                            key={opcion}
                                            className={`castrado-chip ${formData.castrado === opcion ? 'activo' : ''}`}
                                            onClick={() => handleCastradoSelect(opcion)}
                                        >
                                            {opcion}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <input type="text" value={mascota.sterilized === 'Sí' ? 'Sí' : mascota.sterilized === 'No' ? 'No' : 'No informado'} disabled />
                            )}

                            <label>Vacunas al día:</label>
                            {editMode ? (
                                <div className="chip-selector">
                                    {['Sí', 'No', 'No sé'].map((opcion) => (
                                        <span
                                            key={opcion}
                                            className={`vacunas-chip ${formData.vacunasAlDia === opcion ? 'activo' : ''}`}
                                            onClick={() => handleVacunasSelect(opcion)}
                                        >
                                            {opcion}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <input type="text" value={mascota.vaccinated === 'Sí' ? 'Sí' : mascota.vaccinated === 'No' ? 'No' : 'No informado'} disabled />
                            )}

                            <label>Compatibilidad:</label>
                            {editMode ? (
                                <div className="chip-selector multiple">
                                    {['Niños', 'Perros', 'Gatos'].map((comp) => (
                                        <span
                                            key={comp}
                                            className={`compat-chip ${formData.compatibilidad.includes(comp) ? 'activo' : ''}`}
                                            onClick={() => handleCompatibilidadToggle(comp)}
                                        >
                                            {comp}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <input type="text" value={mascota.compatibility?.join(', ') || 'No informada'} disabled />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modales y botones */}
            {edicionExitosa && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>¡Cambios guardados con éxito!</h3>
                        <p>La información de la mascota se actualizó correctamente.</p>
                        <button className="boton-aceptar" onClick={() => setEdicionExitosa(false)}>
                            Aceptar
                        </button>
                    </div>
                </div>
            )}

            {eliminacionExitosa && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Mascota eliminada con éxito</h3>
                        <p>La información de la mascota fue borrada correctamente.</p>
                        <button className="boton-aceptar" onClick={() => navigate('/registrar-mascota')}>
                            Aceptar
                        </button>
                    </div>
                </div>
            )}

            <div className="botones-container">
                <div className="botones-edicion">
                    {editMode ? (
                        <>
                            <button className="editar-button guardar" onClick={handleGuardar}>Guardar</button>
                            <button className="editar-button cancelar" onClick={handleCancelar}>Cancelar</button>
                        </>
                    ) : (
                        <button className="editar-button" onClick={() => setEditMode(true)}>Editar</button>
                    )}
                </div>
                {editMode && (
                    <div className="boton-eliminar">
                        <button className="editar-button eliminar" onClick={handleEliminar}>
                            <FaTrashAlt />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DatosMascota;