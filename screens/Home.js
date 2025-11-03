import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet,Image, StatusBar, } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../src/config/firebaseConfig';
import { Ionicons,FontAwesome5,MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FlatList } from 'react-native';
import { useRoute } from '@react-navigation/native'; // 💡 IMPORTACIÓN CLAVE
import AsyncStorage from '@react-native-async-storage/async-storage'; // 💡 IMPORTACIÓN CLAVE
import CustomAlert from '../components/Alert'; // 💡 Renombrado para evitar conflicto con RNAlert

const ALERT_SHOWN_KEY = '@AlertShownAfterSignUp';

export default function Home({ navigation }) {

  // 💡 OBTENER LOS PARÁMETROS DE LA RUTA
  const route = useRoute();
  const { isNewUser } = route.params || {}; // Destructurar isNewUser

  const [alertConfig, setAlertConfig] = useState({ visible: false, type: "info", title: "", message: "" });

  const showAlert = (type, title, message) => {
    setAlertConfig({ visible: true, type, title, message });
  };

  const closeAlert = () => {
    setAlertConfig({ ...alertConfig, visible: false });
  };

  // 💡 EFECTO PARA VERIFICAR Y MOSTRAR LA ALERTA
  useEffect(() => {
    const checkAndShowAlert = async () => {
      // 1. Si NO es un nuevo usuario, no hacemos nada
      if (!isNewUser) {
        return;
      }
      
      try {
        // 2. Comprobar si la alerta ya se ha mostrado
        const hasAlertBeenShown = await AsyncStorage.getItem(ALERT_SHOWN_KEY);

        if (hasAlertBeenShown === null) {
          // 3. Si NUNCA se ha mostrado, mostrarla
          showAlert(
            "success", 
            "¡Registro Exitoso!", 
            "Tu cuenta ha sido creada y has iniciado sesión automáticamente. ¡Bienvenido/a!"
          );
          
          // 4. Guardar el estado en AsyncStorage para que no se muestre de nuevo
          await AsyncStorage.setItem(ALERT_SHOWN_KEY, 'true');
        }
      } catch (error) {
        console.error("Error AsyncStorage:", error);
        // Opcional: mostrar una alerta nativa si falla la persistencia.
      }
    };

    checkAndShowAlert();
  }, [isNewUser]); // Se ejecuta cuando isNewUser cambia (que solo pasa al cargar la pantalla)

  const carrucelData = [
    { titulo: "Misión",
      descripcion: " Ofrecer atención personalizada \npara mejorar la salud y estética bucal.",
    },
    { titulo: "Visión",
      descripcion: "Líderes en odontología por excelencia clínica y \ncompromiso local.", 
    },
  ];

  const renderCarrucelItem = ({item }) => (
    <LinearGradient
      colors={['#bbdadeff', '#1595a6ff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.carrucelFondo}
    >
    <View style={styles.carrucelItem}>
      <Text style={styles.carrucelTitulo}>{item.titulo}</Text>
      <Text style={styles.carrucelDescripcion}>{item.descripcion}</Text>
    </View>
    </LinearGradient>
  );

  return (
    <LinearGradient colors={['#ffffff', '#67c4aaff']} style={styles.gradient}>
  
      <StatusBar barStyle="dark-content" />

      {/* Encabezado superior */}
      <LinearGradient
        colors={['#cef4e8', '#20d3c4ff']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
      <View style={styles.headerContent}>
        <View>
          <Text style={styles.welcomeText}>¡Bienvenido/a!</Text>
        </View>

        {/* Imagen del usuario o logo */}
        <Image
          source={require('../assets/logo.png')} // Usa tu logo local
          style={styles.avatar}
        />
      </View>
      </LinearGradient>

      {/* Carrucel con misión y visión */}
      <View style={{marginTop: 45}}>
        <FlatList
          data={carrucelData}
          renderItem={renderCarrucelItem}
          keyExtractor={(item, index) => index.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled= {false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          
        />
      </View>

      {/* Encabezado de la sección de opciones */}
      <View style={[styles.sectionHeader, styles.paddingContainer]}>
        <Text style={styles.sectionTitle}>Secciones</Text>
      </View>

      {/* Cuadrícula con las tarjetas de información */}
      <View style={[styles.cardsGrid, styles.paddingContainer]}>

        {/* Tarjeta: Pacientes */}
        <TouchableOpacity style={styles.cardWrapper} onPress={() => navigation.navigate('Pacientes')}>
          <LinearGradient 
            colors={['#f5f7f8ff', '#f9fcfaff']}
            style={styles.card}
          >
            <FontAwesome5 name="user" size={80} color="#46b0eeff" />
            <Text style={styles.cardTitle}>Pacientes</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Tarjeta: Personal */}
        <TouchableOpacity style={styles.cardWrapper}>
          <LinearGradient 
          colors={['#f5f7f8ff', '#f9fcfaff']} 
            style={styles.card}
          >
            <MaterialCommunityIcons name="account-group" size={80} color="#46b0eeff"/>
            <Text style={styles.cardTitle}>Personal</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Tarjeta: Tratamientos*/}
        <TouchableOpacity style={styles.cardWrapper}>
          <LinearGradient 
            colors={['#f5f7f8ff', '#f9fcfaff']}
            style={styles.card}
          >
            <FontAwesome5 name="tooth" size={80} color="#46b0eeff" />
            <Text style={styles.cardTitle}>Tratamientos</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Tarjeta: Turnos*/}
        <TouchableOpacity style={styles.cardWrapper} onPress={() => navigation.navigate('Turnos')}>
          <LinearGradient 
            colors={['#f5f7f8ff', '#f9fcfaff']}
            style={styles.card}
          >
            <Ionicons name="calendar" size={80} color="#46b0eeff" />
            <Text style={styles.cardTitle}>Turnos</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={closeAlert}
      />
    </LinearGradient>
  );
}

//  Estilos de la pantalla
const styles = StyleSheet.create({
  // Degradado de fondo
  gradient: {
    flex: 1,
  },
  // Contenedor de padding horizontal para el contenido que no es full-width
  paddingContainer: {
    paddingHorizontal: 20,
  },
  //Carrucel
  carrucelFondo: {
    width: 260, 
    height: 130,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 55,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4,
  },

  carrucelItem: {
    backgroundColor: "#fff",
    borderRadius: 40,
    width: "85%", // tarjeta más chica dentro del fondo degradado
    height: "75%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
    
    
  },
  carrucelTitulo: {
    fontSize: 16, 
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    color: '#333',
  },
  carrucelDescripcion: {
    fontSize: 13,
    color: '#444',
    textAlign: 'center',
    lineHeight: 18,
  },


  // Encabezado 
  header: {
    width: '100%',
    height: 85,
    justifyContent: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    borderTopWidth: 0,
    borderTopColor: 'transparent',
    shadowColor: '#000000ff',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  // Contenido dentro del encabezado
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 50,
    paddingTop: 50, 
    paddingBottom: 15,
  },

  // Estilo del texto de bienvenida
  welcomeText: {
    fontSize: 20,
    color: '#000000ff',
    fontWeight: 'bold',
  },

  // Imagen de perfil o logo
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 25,
    borderColor: '#000000d6',
    borderWidth: 2, 
    borderRadius: 50,
    padding: 15,
  },

  // Encabezado de la sección "Opciones"
  sectionHeader: {
    marginTop: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Título de la sección
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Contenedor de las tarjetas
  cardsGrid: {
    flexDirection: 'row',
    //rowGap: -50,
    flexWrap: 'wrap', 
    justifyContent: 'space-between',
    marginTop: 40,
  },

  // Estilo general de cada tarjeta (para LinearGradient)
  card: {
    width: '100%',
    //height: '65%',
    borderRadius: 15,
    padding: 20,
    marginBottom: '5%',
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#1595a6',
    borderWidth: 5,
  },
  // Estilo Wrapper para el TouchableOpacity (solo necesario para la primera tarjeta)
 // Estilo Wrapper para el TouchableOpacity 
  cardWrapper: {
    width: '48%', // Dos tarjetas por fila
    marginBottom: 20, // Espacio vertical consistente entre filas
    borderRadius: 15, 
    overflow: 'hidden', // Necesario para que el radio se vea bien
  },

  // Texto del título en cada tarjeta (Negro)
  cardTitle: {
    color:"#46b0eeff", // Color negro oscuro para mejor contraste
    fontSize: 19,
    marginTop: 10,
    fontWeight: 'bold',
  },
  cardTitleTrat: {
    color: '#2c0909ff', // Color negro oscuro para mejor contraste
    fontSize: 20,
    marginTop: 10,
    fontWeight: 'bold',
  },

  // Valor principal en cada tarjeta
  cardValue: {
    color: '#ffffffff', // Color negro oscuro para mejor contraste
    fontSize: 17,
    fontWeight: '700',
    marginTop: 4,
  },

  // Subtítulo en cada tarjeta
  cardSubtitle: {
    color: '#ffffffff', // Color negro oscuro para mejor contraste
    fontSize: 16,
    marginTop: 4,
  },
});