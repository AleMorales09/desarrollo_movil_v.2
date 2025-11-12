import React from 'react';
import { PacientesList } from './Pacientes'; 

const PacientesInactivosScreen = ({ navigation }) => {
    return <PacientesList navigation={navigation} filterActive={false} />;
};

export default PacientesInactivosScreen;