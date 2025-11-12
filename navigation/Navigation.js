import React, { useState, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../src/config/firebaseConfig';
import Login from '../screens/Login';
import SignUp from '../screens/SignUp';
import NuevoPaciente from '../screens/NuevoPaciente';
import AppTabs from './AppTabs'; // Contiene el Bottom Tab Navigator
import ForgotPassword from '../screens/ForgotPassword';
// 💡 CAMBIO CLAVE: Importamos el componente específico para activos
import { PacientesActivosScreen } from '../screens/Pacientes'; 
// 💡 NUEVA LÍNEA: Importamos la nueva pantalla de inactivos
import PacientesInactivosScreen from '../screens/PacientesInactivos'; 
import Turnos from '../screens/Turnos';
import Home from '../screens/Home';

const Stack = createStackNavigator();

function Navigation() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        setIsAuthenticated(true); 
      } else {
        setIsAuthenticated(false); 
      }
    });

    return () => unsubscribe();
  }, []);

  // if (loading) {
  //   return null; // Mostrar pantalla de carga o Splash Screen
  // }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={isAuthenticated ? "App" : "Login"} screenOptions={{ headerShown: false }}>
            <Stack.Screen name="App" component={AppTabs} />
            <Stack.Screen 
              name="NuevoPaciente" 
              component={NuevoPaciente} 
              options={{presentation: 'modal'}}
            />
            {/* 💡 CAMBIO: Usamos PacientesActivosScreen para la ruta "Pacientes" */}
            <Stack.Screen name="Pacientes" component={PacientesActivosScreen} /> 
            {/* 💡 NUEVA RUTA: Para la lista de inactivos */}
            <Stack.Screen name="PacientesInactivos" component={PacientesInactivosScreen} />
            <Stack.Screen name="Turnos" component={Turnos} />
            <Stack.Screen name="Personal" component={Home} /> 
            <Stack.Screen name="Tratamientos" component={Home} />
    
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="SignUp" component={SignUp} />
            <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default Navigation;