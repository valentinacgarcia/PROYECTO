import React, { useState, useEffect } from 'react';
import './SeccionSituacionHabitacional.css';

const SeccionSituacionHabitacional = ({ onChange, initialData = {} }) => {
    const [selectedValues, setSelectedValues] = useState({
        tipoVivienda: initialData.tipoVivienda?.[0] || '',
        tenencia: initialData.tenencia?.[0] || '',
        patio: initialData.patio?.[0] || '',
        seguridad: initialData.seguridad?.[0] || ''
    });

    const handleSelect = (field, value) => {
        setSelectedValues(prev => {
            const newValues = {
                ...prev,
                [field]: prev[field] === value ? '' : value // Toggle selection
            };
            
            // Convertir a formato que espera el padre (arrays)
            const formatForParent = {
                tipoVivienda: newValues.tipoVivienda ? [newValues.tipoVivienda] : [],
                tenencia: newValues.tenencia ? [newValues.tenencia] : [],
                patio: newValues.patio ? [newValues.patio] : [],
                seguridad: newValues.seguridad ? [newValues.seguridad] : []
            };
            
            onChange(formatForParent);
            
            return newValues;
        });
    };

    const renderChipGroup = (field, question, options) => (
        <div className="pregunta">
            <h4 className="pregunta-texto">{question}</h4>
            <div className="chips-container">
                {options.map(option => (
                    <button
                        key={option.value}
                        type="button"
                        className={`chip ${selectedValues[field] === option.value ? 'chip-seleccionado' : ''}`}
                        onClick={() => handleSelect(field, option.value)}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
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