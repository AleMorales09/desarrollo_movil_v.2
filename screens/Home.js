import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet,Image, StatusBar, } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../src/config/firebaseConfig';
import { Ionicons,FontAwesome5,MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FlatList } from 'react-native-web';


// const turnosData = [
//   { id: "1", hora: "17:30 hs", paciente: "Ricardo Perez", tratamiento: "Endodoncia" },
//   { id: "2", hora: "18:00 hs", paciente: "Sofia Martinez", tratamiento: "Limpieza" },
//   { id: "3", hora: "18:30 hs", paciente: "Elena Diaz", tratamiento: "Control Ortodoncia" },
//   { id: "4", hora: "19:00 hs", paciente: "Javier Gerardo Milei", tratamiento: "Fotocurado" },
//   { id: "5", hora: "19:30 hs", paciente: "Lautaro Puca", tratamiento: "Fotocurado" },
// ];
// const TurnoCard = ({ hora, paciente, tratamiento }) => (
//   <View style={styles.turnoCard}>
//     <View style={styles.cardHeader}>
//     <Ionicons name="time-outline" size={28} color="#109beb" />
//     <Text style={styles. turnoHora}>{hora}</Text>
//     </View>
//     <Text style={styles.turnoPaciente}>{paciente}</Text>
//     <Text style={styles.turnoTratamiento}>{tratamiento}</Text>
//   </View>
// );

export default function Home({ navigation }) {
  const handleLogOut = async () => {
    try {
      await signOut(auth);
      Alert.alert("Sesión cerrada", "Has cerrado sesión correctamente.");
      navigation.replace('Login');
    } catch (error) {
      Alert.alert("Error", "Hubo un problema al cerrar sesión.");
    }
  };

  const carrucelData = [
    { titulo: "Mision",
      descripcion: " Ofrece atención personalizada \npara mejorar la salud y estética bucal.",
    },
    { titulo: "Vision",
      descripcion: "Líderes en odontología por excelencia clínica y \ncompromiso local..", 
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
  
      <StatusBar barStyle="dark-content" /> {/* Barra de estado clara */}

      {/*  Encabezado superior */}
      <LinearGradient
        colors={['#cef4e8', '#20d3c4ff']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
      <View style={styles.headerContent}>
        <View>
          <Text style={styles.welcomeText}>¡Bienvenido!</Text>
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

      {/*  Encabezado de la sección de opciones */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Opciones</Text>
      </View>

      {/* Cuadrícula con las tarjetas de información */}
      <View style={styles.cardsGrid}>

        {/* Tarjeta: Pacientes */}
        {/* <TouchableOpacity onPress={() => navigation.navigate('Pacientes')}> */}
          <LinearGradient colors={['#e6746aff', '#7e716fff']} style={styles.card}>
            <FontAwesome5 name="user" size={28} color="#000000ff" />
            <Text style={styles.cardTitle}>Pacientes</Text>
            <Text style={styles.cardValue}>1,857 atendidos</Text>
            <Text style={styles.cardSubtitle}>Última consulta registrada hace 15 minutos</Text>
          </LinearGradient>
        {/* </TouchableOpacity> */}

        {/* Tarjeta: Personal */}
        <LinearGradient colors={['#d081c0ff', '#6c396eff']} style={styles.card}>
          <MaterialCommunityIcons name="account-group" size={28} color="#000000ff" />
          <Text style={styles.cardTitle}>Personal</Text>
          <Text style={styles.cardValue}>8 profesionales activos</Text>
          <Text style={styles.cardSubtitle}>Última incorporación: hace 2 días</Text>
        </LinearGradient>

        {/* Tarjeta: Tratamientos */}
        <LinearGradient colors={['#a0b9ff', '#1d2652ff']} style={styles.card}>
          <FontAwesome5 name="procedures" size={28} color="#000000ff" />
          <Text style={styles.cardTitleTrat}>Tratamientos</Text>
          <Text style={styles.cardValue}>Tratamientos en curso: 3.</Text>
          <Text style={styles.cardSubtitle}>Revicion dental completada hoy</Text>
        </LinearGradient>

        {/* Tarjeta: Turnos */}
        <LinearGradient colors={['#7d9e43ff', '#566721ff']} style={styles.card}>
          <Ionicons name="calendar" size={28} color="#000000ff" />
          <Text style={styles.cardTitle}>Turnos</Text>
          <Text style={styles.cardValue}>Turnos programados: 12</Text>
          <Text style={styles.cardSubtitle}>Actualizado hace 5 minutos.</Text>
        </LinearGradient>
      </View>
    </LinearGradient>
  );
}

//  Estilos de la pantalla
const styles = StyleSheet.create({
  // Degradado de fondo
  gradient: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  //Carrucel
  carrucelFondo: {
    width: 260, 
    height: 130,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    
 
  },
  // Contenido dentro del encabezado
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 50,
    paddingTop: 20,
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
    flexWrap: 'wrap', // Permite que las tarjetas pasen a la siguiente fila
    justifyContent: 'space-between',
    marginTop: 15,
  },

  // Estilo general de cada tarjeta
  card: {
    width: '48%', // Dos tarjetas por fila
    borderRadius: 16,
    padding: 16,
    marginBottom: 30,
    
  },

  // Texto del título en cada tarjeta
  cardTitle: {
    color: '#2c0909ff',
    fontSize: 20,
    marginTop: 10,
    fontWeight: 'bold',
  },
  cardTitleTrat: {
    color: '#2c0909ff',
    fontSize: 18,
    marginTop: 10,
    fontWeight: 'bold',
  },

  // Valor principal en cada tarjeta
  cardValue: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 4,
  },

  // Subtítulo en cada tarjeta
  cardSubtitle: {
    color: '#f0f0f0',
    fontSize: 16,
    marginTop: 4,
  },


});