import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; // Para usar iconos
// import Pacientes from '../screens/Pacientes';
// Importa otras pantallas que quieras en el menú inferior
// import Perfil from '../screens/Perfil'; 
// import Citas from '../screens/Citas';
import Home from '../screens/Home';
import Pacientes from '../screens/Pacientes';
import NuevoPaciente from '../screens/NuevoPaciente';
import Perfil from '../screens/Perfil';
import Turnos from '../screens/Turnos';


const Tab = createBottomTabNavigator();

// Este es el menú inferior que solo aparece DESPUÉS del login
function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } 
          // Agrega más rutas y sus iconos aquí si las tienes
          else if (route.name === 'Pacientes') {
            iconName = focused ? 'people' : 'people-outline';
          }
          else if (route.name === 'Perfil') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          }
          else if (route.name === 'Turnos') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          }

          // Puedes retornar cualquier componente
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'blue', // Color del icono y texto activo
        tabBarInactiveTintColor: 'gray', // Color del icono y texto inactivo
        headerShown: false, // Opcional: para que las pantallas internas no muestren el header
      })}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Pacientes" component={Pacientes} />
      {/* <Stack.Screen name="NuevoPaciente" component={NuevoPaciente} /> */}
      {/* <Tab.Screen name="Perfil" component={Perfil} /> */}
      <Tab.Screen name="Perfil" component={Perfil} />
      <Tab.Screen name="Turnos" component={Turnos} />
    </Tab.Navigator>
  );
}

export default AppTabs;