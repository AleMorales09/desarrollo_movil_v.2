import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet,Image, StatusBar, ActivityIndicator } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../src/config/firebaseConfig';
import { db } from '../src/config/firebaseConfig'; // Importamos db para Firestore
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'; // Importamos funciones de Firestore
import { Ionicons,FontAwesome5,MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FlatList } from 'react-native';
import { useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomAlert from '../components/Alert';

const ALERT_SHOWN_KEY = '@AlertShownAfterSignUp';

// ==========================================================
// 💡 NUEVAS VARIABLES: Objetivos/Máximos para el cálculo de porcentaje
// ==========================================================
// Estos valores definen la altura máxima (100%) de la barra para cada métrica
const MAX_PACIENTES_SEMANA = 10; 
const MAX_TURNOS_ASIGNADOS = 30;
const MAX_TRATAMIENTOS_REALIZADOS = 20;

// Función auxiliar para obtener el inicio y fin de un día
const getDayBounds = (date) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    
    return {
        start: Timestamp.fromDate(start),
        end: Timestamp.fromDate(end),
    };
};

// ==========================================================
// 💡 NUEVO COMPONENTE: Gráfico de Barras Diarias Verticales
// ==========================================================
const DailyBarChart = React.memo(({ data, maxGlobalValue, color }) => {
    // maxLocalValue es solo para mostrar la etiqueta del valor más alto.
    const maxLocalValue = Math.max(...data.map(d => d.count), 0); 
    // maxChartValue define la escala del 100% de la altura del gráfico.
    const maxChartValue = Math.max(maxGlobalValue, maxLocalValue, 1); 
    
    return (
        <View style={chartStyles.chartContainer}>
            {data.map((item, index) => {
                const heightPercentage = Math.round((item.count / maxChartValue) * 100);
                const isMax = item.count > 0 && item.count === maxLocalValue;
                
                return (
                    <View key={index} style={chartStyles.barWrapper}>
                        {/* 💡 Etiqueta de valor para el punto más alto */}
                        {isMax && (
                            <Text style={[chartStyles.maxValueLabel, {color}]}>
                                {item.count}
                            </Text>
                        )}
                        <View style={chartStyles.barEje}>
                            <View style={[
                                chartStyles.barra, 
                                { 
                                    height: `${heightPercentage}%`, 
                                    backgroundColor: color 
                                }
                            ]}>
                                {/* 💡 Punto de Ojiva */}
                                <View style={[chartStyles.puntoOjiva, {backgroundColor: color}]} />
                            </View>
                        </View>
                        {/* Etiqueta del día (ej: 'MIE') */}
                        <Text style={chartStyles.dayLabel}>{item.day.slice(0,3).toUpperCase()}</Text>
                    </View>
                );
            })}
        </View>
    );
});


export default function Home({ navigation }) {

  const route = useRoute();
  const { isNewUser } = route.params || {};

  const [alertConfig, setAlertConfig] = useState({ visible: false, type: "info", title: "", message: "" });

  // ==========================================================
  // 💡 ESTADOS: Ahora guardan un ARRAY de 7 días
  // ==========================================================
  const [dailyPacientes, setDailyPacientes] = useState([]);
  const [dailyTurnos, setDailyTurnos] = useState([]);
  const [dailyTratamientos, setDailyTratamientos] = useState([]);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

  // 💡 CORRECCIÓN DEL ERROR: Funciones memoizadas con useCallback
  const showAlert = useCallback((type, title, message) => {
    setAlertConfig({ visible: true, type, title, message });
  }, []); 

  const closeAlert = useCallback(() => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  }, []); 

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
  }, [isNewUser, showAlert]);
  
  // ==========================================================
  // 💡 FUNCIÓN DE CARGA DE MÉTRICAS (Usa Firestore para datos reales por día)
  // ==========================================================
  const fetchMetrics = useCallback(async () => {
      setIsLoadingMetrics(true);
      try {
          const metrics = {
              pacientes: { stateSetter: setDailyPacientes, collectionName: "pacientes" },
              turnos: { stateSetter: setDailyTurnos, collectionName: "turnos" },
              tratamientos: { stateSetter: setDailyTratamientos, collectionName: "tratamientos" },
          };

          for (const metricKey in metrics) {
              let collectedData = [];
              const { stateSetter, collectionName } = metrics[metricKey];
              
              // Recorrer los últimos 7 días (i=6: hace 6 días, i=0: hoy)
              for (let i = 6; i >= 0; i--) {
                  const d = new Date();
                  d.setDate(d.getDate() - i); 
                  const { start, end } = getDayBounds(d);

                  const q = query(
                      collection(db, collectionName),
                      where("fechaCreacion", ">=", start),
                      where("fechaCreacion", "<=", end)
                  );
                  const snapshot = await getDocs(q);
                  
                  collectedData.push({
                      day: d.toLocaleDateString('es-ES', { weekday: 'short' }), // Usamos es-ES para el nombre corto
                      count: snapshot.size,
                      date: d // Mantenemos el objeto Date para ordenar
                  });
              }
              
              // 💡 CLAVE: Lógica de ordenamiento Lunes a Domingo
              // Mapear Domingo (0) -> 7, Lunes (1) -> 1, Sábado (6) -> 6
              const sortedData = collectedData.sort((a, b) => {
                  // getDay() retorna 0 para Domingo, 1 para Lunes, ..., 6 para Sábado
                  const getWeekDayIndex = (date) => (date.getDay() === 0 ? 7 : date.getDay());
                  return getWeekDayIndex(a.date) - getWeekDayIndex(b.date);
              });
              
              // Mapear a la estructura final y convertir a mayúsculas
              const finalData = sortedData.map(d => ({
                  // Solo tomamos las primeras 3 letras del día y convertimos a mayúsculas
                  day: d.day.slice(0, 3).toUpperCase(), 
                  count: d.count,
              }));
              
              stateSetter(finalData);
          }

      } catch (error) {
          console.error("Error al cargar métricas de Firestore:", error);
          showAlert("error", "Error de Datos", "No se pudieron cargar las métricas. Revisa la conexión y las colecciones en Firestore.");
      } finally {
          setIsLoadingMetrics(false);
      }
  }, [showAlert]); // Depende de showAlert, que ahora es estable

  useEffect(() => {
      fetchMetrics();
  }, [fetchMetrics]);
  
  // ==========================================================
  // 💡 Datos del carrusel (usa useMemo para estructurar los datos para el renderizado)
  // ==========================================================
  const carrucelData = useMemo(() => ([
    { 
      id: 'pacientes',
      titulo: "Pacientes Registrados",
      unidad: "Total: " + dailyPacientes.reduce((sum, d) => sum + d.count, 0) + " en 7 días",
      icono: "user-plus", 
      colorBarra: "#00bfa5",
      maximo: MAX_PACIENTES_SEMANA,
      data: dailyPacientes,
    },
    { 
      id: 'turnos',
      titulo: "Turnos Asignados",
      unidad: "Total: " + dailyTurnos.reduce((sum, d) => sum + d.count, 0) + " en 7 días",
      icono: "calendar-check", 
      colorBarra: "#3b82f6",
      maximo: MAX_TURNOS_ASIGNADOS,
      data: dailyTurnos,
    },
    { 
      id: 'tratamientos',
      titulo: "Tratamientos Realizados",
      unidad: "Total: " + dailyTratamientos.reduce((sum, d) => sum + d.count, 0) + " en 7 días",
      icono: "tooth", 
      colorBarra: "#ff6b6b",
      maximo: MAX_TRATAMIENTOS_REALIZADOS,
      data: dailyTratamientos,
    },
  ]), [dailyPacientes, dailyTurnos, dailyTratamientos]);
  
  // Render Item principal (ahora usa DailyBarChart)
  const renderCarrucelItem = ({item }) => (
    <LinearGradient
      colors={['#bbdadeff', '#1595a6ff']} 
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.carrucelFondoNuevo} 
    >
      <View style={styles.carrucelItemBlanco}>
          {/* Título y Unidad (Fijos) */}
          <View>
              <View style={styles.carrucelHeader}>
                  <FontAwesome5 name={item.icono} size={24} color={item.colorBarra} />
                  <Text style={styles.carrucelTituloNuevo}>{item.titulo}</Text>
              </View>
              <Text style={styles.carrucelUnidad}>{item.unidad}</Text>
          </View>

          {/* 💡 Contenedor del Gráfico Dinámico */}
          <View style={styles.dailyChartWrapper}>
              {isLoadingMetrics ? (
                  <View style={styles.loadingOverlay}>
                      <ActivityIndicator size="large" color={item.colorBarra} />
                      <Text style={[styles.carrucelTituloNuevo, {marginTop: 10}]}>Cargando datos...</Text>
                  </View>
              ) : (
                  <DailyBarChart 
                      data={item.data}
                      maxGlobalValue={item.maximo}
                      color={item.colorBarra}
                  />
              )}
          </View>
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

      {/* Carrucel con métricas */}
      <View style={{marginTop: 45}}>
        <FlatList
          data={carrucelData}
          renderItem={renderCarrucelItem}
          keyExtractor={item => item.id}
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

// ==========================================================
// 💡 ESTILOS ESPECÍFICOS DEL GRÁFICO (Componente DailyBarChart)
// ==========================================================
const chartStyles = StyleSheet.create({
    // Contenedor principal del gráfico: distribuye las 7 barras
    chartContainer: {
        flex: 1, 
        flexDirection: 'row',
        justifyContent: 'space-around', 
        alignItems: 'flex-end',
        paddingHorizontal: 5,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    // Contenedor de cada barra individual
    barWrapper: {
        alignItems: 'center',
        height: '100%', 
        justifyContent: 'flex-end',
    },
    // Eje estático (fondo gris)
    barEje: {
        height: '80%', 
        width: 15, // Ancho de la barra
        backgroundColor: '#eee',
        borderRadius: 3,
        overflow: 'hidden',
        justifyContent: 'flex-end', // La barra crece desde abajo
    },
    // Barra dinámica (color)
    barra: {
        width: '100%',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    // Punto de ojiva
    puntoOjiva: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        position: 'absolute',
        top: -3.5, 
        borderWidth: 1,
        borderColor: '#FFF',
    },
    // Etiqueta del día
    dayLabel: {
        fontSize: 10,
        color: '#777',
        marginTop: 4,
    },
    // Etiqueta del valor más alto
    maxValueLabel: {
        position: 'absolute',
        top: 0, 
        fontSize: 11,
        fontWeight: 'bold',
        zIndex: 10,
    },
});

//  Estilos de la pantalla (Sección del carrusel modificada)
const styles = StyleSheet.create({
  // Degradado de fondo
  gradient: {
    flex: 1,
  },
  // Contenedor de padding horizontal para el contenido que no es full-width
  paddingContainer: {
    paddingHorizontal: 20,
  },
  
  // =========================================================
  // 💡 ESTILOS DEL CARRUSEL DE GRÁFICOS (Ahora con gráfico multi-barra)
  // =========================================================
  carrucelFondoNuevo: {
    width: 330, // Aumentado el ancho para el gráfico de 7 barras
    height: 220, // Aumentada la altura
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
    padding: 3, 
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4,
  },
  
  carrucelItemBlanco: {
    backgroundColor: "#FFFFFF", 
    borderRadius: 12, 
    width: "100%",
    height: "100%",
    padding: 13, 
  },
  
  // 💡 NUEVO: Contenedor para el gráfico de 7 barras
  dailyChartWrapper: {
      flex: 1,
      marginTop: 5,
  },
  
  carrucelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  
  carrucelTituloNuevo: {
    fontSize: 16, 
    fontWeight: 'bold',
    marginLeft: 10,
    textAlign: 'left',
    color: '#333',
  },
  
  carrucelUnidad: {
    fontSize: 13, // Usada como el "Total en 7 días"
    color: '#555',
    marginBottom: 5,
    textAlign: 'left',
  },
  
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // =========================================================
  // FIN SECCIÓN CARRUSEL
  // =========================================================

  // ... (Resto de estilos)
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