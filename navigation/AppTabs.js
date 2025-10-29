import React, { useRef, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; 
import { Animated } from 'react-native'; // 🔑 Importación de Animated
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import Home from '../screens/Home';
import Perfil from '../screens/Perfil';
import Turnos from '../screens/Turnos';

const Tab = createBottomTabNavigator();

// --- Componente auxiliar para el ícono animado ---
const AnimatedIcon = ({ iconName, size, color, focused }) => {
    // 🔑 Creamos un valor animado para la escala
    const scaleAnim = useRef(new Animated.Value(focused ? 1.5 : 0.8)).current;

    useEffect(() => {
        // Ejecutamos la animación de escala cuando el foco cambia
        Animated.spring(scaleAnim, {
            toValue: focused ? 2.3 : 1, // 1.2 para rebote, 1 para estado normal
            friction: 5, // Determina la 'elasticidad' del rebote
            useNativeDriver: true,
        }).start();
    }, [focused, scaleAnim]);

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Ionicons name={iconName} size={size} color={color} />
        </Animated.View>
    );
};
// ----------------------------------------------------


// Este es el menú inferior que solo aparece DESPUÉS del login
function AppTabs() {
  // 🔑 Hook para obtener los insets (márgenes seguros) del sistema
  const insets = useSafeAreaInsets();
  
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

          // 🔑 Usamos el componente AnimatedIcon en lugar del Ionicons directo
          return (
            <AnimatedIcon 
              iconName={iconName} 
              size={size} 
              color={color} 
              focused={focused} 
            />
          );
        },
        
        // --- PROPIEDADES DE ESTILO PARA TODAS LAS PANTALLAS ---
        tabBarActiveTintColor: '#05f7c2', 
        tabBarInactiveTintColor: '#888',
        headerShown: false, 
        
        // 🔑 PROPIEDAD CLAVE: ESTILO DEL CONTENEDOR DE LA BARRA
        tabBarStyle: {
          backgroundColor: '#f5f2f2ff',
          //borderTopWidth: 2,
          paddingBottom: 1,  
          height: 60,
          position: 'absolute',
          margin: 25,
          marginBottom: 38,
          borderRadius: 16,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 2,
          borderColor: '#05f7c2',
        },
        
        // 🔑 PROPIEDAD CLAVE: ESTILO DE LAS ETIQUETAS DE TEXTO
        tabBarLabelStyle: {
          fontSize: 13,
          marginTop: 7,
        },
      })}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Perfil" component={Perfil} />
    </Tab.Navigator>
  );
}

export default AppTabs;