import React, { useState, useMemo, useEffect } from 'react'; 
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from "expo-linear-gradient";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Alert from '../components/Alert';
import { db } from '../src/config/firebaseConfig';
import { collection, addDoc, doc, updateDoc, query, where, getDocs } from 'firebase/firestore'; 
import { useRoute } from '@react-navigation/native'; 

export default function NuevoPaciente({ navigation }) {
  const route = useRoute(); 
  const patientData = route.params?.patientData || null; 
  // Bandera de modo solo lectura
  const isViewMode = route.params?.isViewMode || false; 

  const [id, setId] = useState(null); 
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [dni, setDni] = useState('');
  const [telefono, setTelefono] = useState('');
  const [dniError, setDniError] = useState(false); 
  const [telefonoError, setTelefonoError] = useState(false); 
  const [direccion, setDireccion] = useState('');
  const [password, setPassword] = useState(''); // Se mantienen para evitar errores
  const [confirmPassword, setConfirmPassword] = useState(''); // Se mantienen para evitar errores
  const [showPassword, setShowPassword] = useState(false); // Se mantienen para evitar errores
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Se mantienen para evitar errores
  const [showPasswordInfo, setShowPasswordInfo] = useState(false); // Se mantienen para evitar errores
  const [firstNameError, setFirstNameError] = useState(false);
  const [lastNameError, setLastNameError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [showPasswordMatchInfo, setShowPasswordMatchInfo] = useState(false); // Se mantienen para evitar errores

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: "info",
    title: "",
    message: "",
    }
  );

  useEffect(() => {
    if (patientData) {
      setId(patientData.id);
      setFirstName(patientData.firstName || '');
      setLastName(patientData.lastName || '');
      setEmail(patientData.email || '');
      setDni(patientData.dni || '');
      setTelefono(patientData.telefono || '');
      setDireccion(patientData.direccion || '');
      
      // NUEVO: Cambiar el título basado en el modo
      if (isViewMode) {
        navigation.setOptions({ title: 'Detalles del Paciente' });
      } else {
        navigation.setOptions({ title: 'Editar Paciente' });
      }
    } else {
      setId(null); 
      setFirstName('');
      setLastName('');
      setEmail('');
      setDni('');
      setTelefono('');
      setDireccion('');
      navigation.setOptions({ title: 'Nuevo Paciente' });
    }
    // Limpiamos los errores al cambiar de modo
    setFirstNameError(false);
    setLastNameError(false);
    setDniError(false);
    setEmailError(false);
    setTelefonoError(false);
  }, [patientData, navigation, isViewMode]); // Agregar isViewMode a dependencias

  // Función para manejar la cancelación / volver a la lista
  const handleCancel = () => {
      navigation.goBack();
  };

  const showAlert = (type, title, message) => {
    setAlertConfig({ visible: true, type, title, message });
    if (type === "success") {
      setTimeout(() => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
        navigation.goBack(); 
      }, 3000);
    }
  };

  const closeAlert = () => {
    setAlertConfig({ ...alertConfig, visible: false });
  };

  const validateName = (text) => {
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;
    return nameRegex.test(text);
  };

  const handleDniChange = (text) => {
    if (!isViewMode) { // Solo permitir cambios en modo edición
      const filteredText = text.replace(/\D/g, ''); 
      setDni(filteredText);
      setDniError(false); 
    }
  };

  const handleTelefonoChange = (text) => { 
    if (!isViewMode) { // Solo permitir cambios en modo edición
      const filteredText = text.replace(/\D/g, '');
      setTelefono(filteredText);
      setTelefonoError(false); 
    }
  };
    
  const validateEmail = (text) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  };

  const handleAddressChange = (text) => {
    if (!isViewMode) { // Solo permitir cambios en modo edición
      const addressRegex = /[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,\/-]/g;
      const filteredText = text.replace(addressRegex, '');
      setDireccion(filteredText); 
    }
  };


  const handleFirstNameBlur = () => {
    if (firstName && !validateName(firstName) && !isViewMode) {
      setFirstNameError(true);
    } else {
      setFirstNameError(false);
    }
  };

  const handleLastNameBlur = () => {
    if (lastName && !validateName(lastName) && !isViewMode) {
      setLastNameError(true);
    } else {
      setLastNameError(false);
    }
  };


  const handleEmailBlur = () => {
    if (email && !validateEmail(email) && !isViewMode) {
      setEmailError(true);
    } else {
      setEmailError(false);
    }
  };

  const handleFirstNameChange = (text) => {
    if (!isViewMode) {
      const filteredText = text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''); 
      setFirstName(filteredText);
      if (filteredText && !validateName(filteredText)) {
        setFirstNameError(true);
      } else {
        setFirstNameError(false);
      }
    }
  };

  const handleLastNameChange = (text) => {
    if (!isViewMode) {
      const filteredText = text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''); 
      setLastName(filteredText);
      if (filteredText && !validateName(filteredText)) {
        setLastNameError(true);
      } else {
        setLastNameError(false);
      }
    }
  };
    
  const handleNewPaciente = async () => {
    if (isViewMode) return; 

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    // 1. Validaciones de campos obligatorios/formato
    if (!trimmedFirstName || !trimmedLastName || !dni || !email || !telefono || !direccion) {
      showAlert("error", "Error", "Todos los campos son obligatorios.");
      return;
    }

    if (!validateName(trimmedFirstName)) { 
      setFirstNameError(true);
      showAlert("error", "Error", "El nombre solo debe contener letras.");
      return;
    }

    if (trimmedFirstName.length < 2) { 
      setFirstNameError(true);
      showAlert("error", "Error", "El nombre es demasiado corto.");
      return;
    }

    if (!validateName(trimmedLastName)) { 
      setLastNameError(true);
      showAlert("error", "Error", "El apellido solo debe contener letras.");
      return;
    }

    if (trimmedLastName.length < 2) { 
      setLastNameError(true);
      showAlert("error", "Error", "El apellido es demasiado corto.");
      return;
    }

    if (!(dni.length === 7 || dni.length === 8)) {
      setDniError(true);
      showAlert("error", "DNI Inválido", "El DNI debe tener 7 u 8 dígitos.");
      return;
    }
    
    if (!validateEmail(email)) {
      setEmailError(true);
      showAlert("error", "Error", "El formato del correo electrónico no es válido.");
      return;
    }
    if (telefono.length < 7) {
      setTelefonoError(true);
      showAlert("error", "Teléfono Inválido", "El teléfono debe tener al menos 7 dígitos.");
      return;
    }
    
    // 2. Verificación de DNI duplicado
    try {
        const pacientesRef = collection(db, "pacientes");
        const q = query(pacientesRef, where("dni", "==", dni));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            
            if (id) {
                let dniConflict = false;
                querySnapshot.forEach(doc => {
                    if (doc.id !== id) {
                        dniConflict = true;
                    }
                });
                
                if (dniConflict) {
                    setDniError(true);
                    showAlert("error", "DNI Duplicado", "Ya existe otro paciente registrado con este número de DNI.");
                    return;
                }
            } else {
                setDniError(true);
                showAlert("error", "DNI Duplicado", "Ya existe un paciente registrado con este número de DNI.");
                return;
            }
        }
    } catch (error) {
        console.error("Error al verificar DNI:", error);
        showAlert("error", "Error de Base de Datos", "Ocurrió un error al verificar la existencia del DNI. Inténtalo de nuevo.");
        return;
    }


    // 3. Proceso de Guardado o Actualización
    try {
      const patientDataToSave = {
        nombre: trimmedFirstName,
        apellido: trimmedLastName,
        dni: dni,
        email: email,
        telefono: telefono,
        direccion: direccion,
      };

      if (id) {
        // Modo Edición: Actualizar documento existente
        const patientRef = doc(db, "pacientes", id);
        await updateDoc(patientRef, patientDataToSave);

        showAlert("success", "Paciente Actualizado", "El paciente ha sido actualizado correctamente.");
      } else {
        // Modo Creación: Agregar nuevo documento
        const newPatient = {
            ...patientDataToSave,
            fechaCreacion: new Date(),
        };
        await addDoc(collection(db, "pacientes"), newPatient);

        showAlert("success", "Paciente Registrado", "El paciente ha sido guardado correctamente.");
      }
      
      // Limpiar estados
      setFirstName('');
      setLastName('');
      setDni('');
      setEmail('');
      setTelefono('');
      setDireccion('');
      setFirstNameError(false);
      setLastNameError(false);
      setDniError(false);
      setEmailError(false);
      setTelefonoError(false);

    } catch (error) {
      console.error("Error al guardar/actualizar el paciente:", error);
      showAlert("error", "Error al Guardar", "No se pudo guardar/actualizar el paciente. Inténtalo de nuevo.");
    }
  };

  const titleText = isViewMode ? "Detalles del paciente" : (id ? "Editar paciente" : "Registrar nuevo paciente");
  const buttonText = id ? "ACTUALIZAR" : "GUARDAR"; 
  
  // Función para aplicar estilos condicionales al input
  const inputGroupStyle = (error) => ([
      styles.inputGroup, 
      error && styles.inputGroupError,
      isViewMode && styles.readOnlyInputGroup, // Aplica estilo de solo lectura
  ]);


  return (
    <>
      <StatusBar barStyle="light-content" />
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid={true}
        extraScrollHeight={50}
        enableAutomaticScroll={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.root}>
          <LinearGradient
            colors={["#FFFFFF", "#9FE2CF"]}
            style={styles.gradient}
          >
            <View style={styles.card}>
              <Text style={styles.title}>{titleText}</Text>
              
              <Text style={styles.label}>Nombre</Text>
              <View style={inputGroupStyle(firstNameError)}>
                <TextInput
                  style={styles.input}
                  placeholder="Ingrese el nombre"
                  value={firstName}
                  onChangeText={handleFirstNameChange}
                  onBlur={handleFirstNameBlur}
                  placeholderTextColor="#888"
                  maxLength={30}
                  editable={!isViewMode} // <-- SOLO LECTURA
                />
              </View>
              {firstNameError && !isViewMode && (
                <Text style={styles.errorText}>El nombre es demasiado corto</Text>
              )}

              <Text style={styles.label}>Apellido</Text>
              <View style={inputGroupStyle(lastNameError)}>
                <TextInput
                  style={styles.input}
                  placeholder="Ingrese el apellido"
                  value={lastName}
                  onChangeText={handleLastNameChange}
                  onBlur={handleLastNameBlur}
                  placeholderTextColor="#888"
                  maxLength={30}
                  editable={!isViewMode} // <-- SOLO LECTURA
                />
              </View>
              {lastNameError && !isViewMode && (
                <Text style={styles.errorText}>El apellido es demasiado corto</Text>
              )}

              <Text style={styles.label}>DNI</Text>
              <View style={inputGroupStyle(dniError)}>
                <TextInput
                  style={styles.input}
                  placeholder="Ingrese el DNI"
                  value={dni}
                  onChangeText={handleDniChange}
                  placeholderTextColor="#888"
                  keyboardType="numeric"
                  maxLength={8}
                  editable={!isViewMode} // <-- SOLO LECTURA
                />
              </View>

              <Text style={styles.label}>Correo</Text>
              <View style={inputGroupStyle(emailError)}>
                <TextInput
                  style={styles.input}
                  placeholder="Ingrese su correo"
                  value={email}
                  onChangeText={setEmail}
                  onBlur={handleEmailBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#888"
                  maxLength={50}
                  editable={!isViewMode} // <-- SOLO LECTURA
                />
              </View>
              {emailError && !isViewMode && (
                <Text style={styles.errorText}>Formato de correo inválido (ej: usuario@dominio.com)</Text>
              )}

              <Text style={styles.label}>Teléfono</Text>
              <View style={inputGroupStyle(telefonoError)}>
                <TextInput
                  style={styles.input}
                  placeholder="Ingrese el teléfono"
                  value={telefono}
                  onChangeText={handleTelefonoChange}
                  placeholderTextColor="#888"
                  keyboardType="numeric"
                  maxLength={15}
                  editable={!isViewMode} // <-- SOLO LECTURA
                />
              </View>
    

              <Text style={styles.label}>Dirección</Text>
              <View style={inputGroupStyle(false)}>
                <TextInput
                  style={styles.input}
                  placeholder="Ingrese la dirección"
                  value={direccion}
                  onChangeText={handleAddressChange}
                  placeholderTextColor="#888"
                  maxLength={30}
                  editable={!isViewMode} // <-- SOLO LECTURA
                />
              </View>
              
              {/* RENDERIZACIÓN CONDICIONAL DE BOTONES */}
              {isViewMode ? (
                // MODO SOLO LECTURA: Botón único de volver (Color GUARDAR/ACEPTAR)
                <View style={styles.buttonContainerOnlyOne}>
                    <TouchableOpacity style={styles.buttonBack} onPress={handleCancel}>
                        <Text style={styles.buttonText}>VOLVER A LA LISTA</Text>
                    </TouchableOpacity>
                </View>
              ) : (
                // MODO EDICIÓN/CREACIÓN: Botones Guardar/Actualizar y Cancelar
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                        <Text style={styles.buttonText}>CANCELAR</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.button} onPress={handleNewPaciente}>
                        <Text style={styles.buttonText}>{buttonText}</Text>
                    </TouchableOpacity>
                </View>
              )}

            </View>
          </LinearGradient>
        </View>
      </KeyboardAwareScrollView>
      
      <Alert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={closeAlert}
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#fff",
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 30,
    justifyContent: 'center',
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 10,
    textAlign: "center",
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
    marginTop: 5,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  inputGroupError: {
    borderColor: "#ff6b6b",
    borderWidth: 2,
  },
  readOnlyInputGroup: {
    backgroundColor: '#f0f0f0', 
    borderColor: '#ccc',
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 12,
    marginBottom: 8,
    marginTop: -3,
  },
  input: {
    flex: 1,
    height: 45,
    fontSize: 14,
    color: "#333",
  },
  // ESTILOS DE BOTONES MODO EDICIÓN/CREACIÓN
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
    width: '100%',
  },
  button: {
    // Color principal: #05f7c2 (GUARDAR/ACTUALIZAR)
    backgroundColor: "#05f7c2", 
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    width: '48%', 
    marginTop: 0, 
    alignSelf: "auto", 
  },
  cancelButton: {
    // Color de Eliminación: #ff6b6b (CANCELAR) <-- MODIFICADO
    backgroundColor: "#ff6b6b", 
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    width: '48%',
  },
  // NUEVOS ESTILOS PARA EL BOTÓN ÚNICO DE VOLVER
  buttonContainerOnlyOne: {
    marginTop: 25,
    alignItems: 'center',
    width: '100%',
  },
  buttonBack: {
    // Color principal: #05f7c2 (VOLVER A LA LISTA) <-- MODIFICADO
    backgroundColor: '#05f7c2', 
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    width: '80%', 
  },
  buttonText: {
    color: "#fff", 
    fontSize: 16,
    fontWeight: "bold",
  },
});