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
import Pacientes from '../screens/Pacientes';
import Turnos from '../screens/Turnos';

const Stack = createStackNavigator();

function Navigation() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setIsAuthenticated(!!user); 
      setLoading(false); 
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return null; // Mostrar pantalla de carga o Splash Screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          // === ESTADO AUTENTICADO: STACK PRINCIPAL (CON TABS) ===
          <>
            {/* 💡 MODIFICACIÓN CLAVE: Pasar los parámetros de la ruta (incluido isNewUser) a AppTabs */}
            <Stack.Screen 
              name="App" 
              component={({ route }) => <AppTabs initialRouteParams={route.params} />} 
            />
            <Stack.Screen 
              name="NuevoPaciente" 
              component={NuevoPaciente} 
              options={{presentation: 'modal'}}
            />
            <Stack.Screen name="Pacientes" component={Pacientes} />
            <Stack.Screen name="Turnos" component={Turnos} />
          </>
        ) : (
          // === ESTADO NO AUTENTICADO: STACK DE AUTENTICACIÓN ===
          <>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="SignUp" component={SignUp} />
            <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default Navigation;