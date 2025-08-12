import React, { useState, useEffect } from 'react';
import './SeccionSituacionHabitacional.css';

const SeccionSituacionHabitacional = ({ onChange, initialData = {} }) => {
    const [formData, setFormData] = useState({
        tipoVivienda: initialData.tipoVivienda || [],
        tenencia: initialData.tenencia || [],
        patio: initialData.patio || [],
        seguridad: initialData.seguridad || []
    });

    useEffect(() => {
        setFormData({
            tipoVivienda: initialData.tipoVivienda || [],
            tenencia: initialData.tenencia || [],
            patio: initialData.patio || [],
            seguridad: initialData.seguridad || []
        });
    }, [initialData]);

    const handleSelect = (field, value) => {
        setFormData((prev) => {
            const currentValues = prev[field];
            let updatedValues;

            if (currentValues.includes(value)) {
                updatedValues = currentValues.filter((item) => item !== value);
            } else {
                updatedValues = [...currentValues, value];
            }

            const updatedFormData = { ...prev, [field]: updatedValues };
            if (onChange) {
                onChange(updatedFormData);
            }
            return updatedFormData;
        });
    };

    const renderChipGroup = (field, question, options) => (
        <fieldset className="pregunta">
            <legend className="pregunta-texto">{question}</legend>
            <div className="chips-container" role="group" aria-labelledby={`${field}-question`}>
                {options.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        className={`chip ${formData[field].includes(option.value) ? 'chip-seleccionado' : ''}`}
                        onClick={() => handleSelect(field, option.value)}
                        aria-checked={formData[field].includes(option.value)}
                        role="checkbox"
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </fieldset>
    );

    return (
        <div className="seccion-container">
            {renderChipGroup(
                'tipoVivienda',
                'Tipo de vivienda:',
                [
                    { value: 'CASA', label: 'CASA' },
                    { value: 'DPTO', label: 'DEPARTAMENTO' }
                ]
            )}

            {renderChipGroup(
                'tenencia',
                '¿Alquila o es propietario?',
                [
                    { value: 'ALQUILO', label: 'ALQUILO' },
                    { value: 'SOY PROPIETARIO', label: 'SOY PROPIETARIO' }
                ]
            )}

            {renderChipGroup(
                'patio',
                '¿Cuenta con patio o jardín?',
                [
                    { value: 'SI', label: 'SÍ' },
                    { value: 'NO', label: 'NO' }
                ]
            )}

            {renderChipGroup(
                'seguridad',
                '¿La vivienda está segura para un animal?',
                [
                    { value: 'POSEE RED EN EL BALCÓN', label: 'Posee red en el balcón' },
                    { value: 'VIVIENDA CERRADA', label: 'Es una vivienda cerrada (sin balcón/patio)' }
                ]
            )}
        </div>
    );
};

export default SeccionSituacionHabitacional;