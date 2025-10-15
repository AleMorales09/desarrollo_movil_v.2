import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; 
import Home from '../screens/Home';
import Perfil from '../screens/Perfil';
import Turnos from '../screens/Turnos'; // Mantenemos el import por si se usa en otro lado, pero eliminamos la pantalla de la barra inferior.

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
          else if (route.name === 'Perfil') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          }
          // Lógica para 'Turnos' eliminada de aquí.

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'blue', 
        tabBarInactiveTintColor: 'gray', 
        headerShown: false, 
      })}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Perfil" component={Perfil} />
      {/* Eliminado: <Tab.Screen name="Turnos" component={Turnos} /> */}
    </Tab.Navigator>
  );
}

export default AppTabs;