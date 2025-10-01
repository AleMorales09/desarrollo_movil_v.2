
import React, { useState, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { onAuthStateChanged } from 'firebase/auth';  
import { auth } from '../src/config/firebaseConfig';  
import Login from '../screens/Login';
import SignUp from '../screens/SignUp';
import NuevoPaciente from '../screens/NuevoPaciente';
// Importa el nuevo componente que contiene el menú inferior
import AppTabs from './AppTabs';
import ForgotPassword from '../screens/ForgotPassword';

const Stack = createStackNavigator();

function Navigation() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setIsAuthenticated(!!user); // Simplifica la asignación
      setLoading(false); 
    });

    return () => unsubscribe();
  }, []);

  // Muestra una pantalla de carga mientras Firebase verifica el estado inicial
  if (loading) {
    return null; // En una app real, aquí va un Splash Screen o Spinner
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          // === ESTADO AUTENTICADO: MUESTRA LA APLICACIÓN PRINCIPAL ===
          // Renderiza el AppTabs, que contiene el Bottom Tab Navigator.
          // Cualquier navegación dentro de AppTabs tendrá el menú inferior.
          <>
            <Stack.Screen name="App" component={AppTabs} />
            <Stack.Screen name="NuevoPaciente" component={NuevoPaciente} />
          </>
        ) : (
          // === ESTADO NO AUTENTICADO: MUESTRA EL STACK DE AUTENTICACIÓN ===
          // Estas pantallas NO tendrán el menú inferior.
          <>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="SignUp" component={SignUp} />
            <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
            {/* <Stack.Screen name="NuevoPaciente" component={NuevoPaciente} /> */}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default Navigation;

