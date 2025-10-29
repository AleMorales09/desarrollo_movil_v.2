import React, { useState, useMemo, useEffect } from 'react'; 
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from "expo-linear-gradient";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Alert from '../components/Alert';
import { db } from '../src/config/firebaseConfig';
// MODIFICADO: Agregando query, where, y getDocs para la verificación
import { collection, addDoc, doc, updateDoc, query, where, getDocs } from 'firebase/firestore'; 
import { useRoute } from '@react-navigation/native'; 

export default function NuevoPaciente({ navigation }) {
  const route = useRoute(); 
  const patientData = route.params?.patientData || null; 

  const [id, setId] = useState(null); 
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [dni, setDni] = useState('');
  const [telefono, setTelefono] = useState('');
  const [dniError, setDniError] = useState(false); 
  const [telefonoError, setTelefonoError] = useState(false); 
  const [direccion, setDireccion] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordInfo, setShowPasswordInfo] = useState(false);
  const [firstNameError, setFirstNameError] = useState(false);
  const [lastNameError, setLastNameError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [showPasswordMatchInfo, setShowPasswordMatchInfo] = useState(false);

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
      
      navigation.setOptions({ title: 'Editar Paciente' });
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

  }, [patientData, navigation]);


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
    const filteredText = text.replace(/\D/g, ''); 
    setDni(filteredText);
    setDniError(false); // Limpiar error al escribir
  };

  const handleTelefonoChange = (text) => { 
    const filteredText = text.replace(/\D/g, '');
    setTelefono(filteredText);
    setTelefonoError(false); // Limpiar error al escribir
  };
    
  const validateEmail = (text) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  };

  const handleAddressChange = (text) => {
    const addressRegex = /[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,\/-]/g;

    const filteredText = text.replace(addressRegex, '');

    setDireccion(filteredText); 
  };


  const handleFirstNameBlur = () => {
    if (firstName && !validateName(firstName)) {
      setFirstNameError(true);
    } else {
      setFirstNameError(false);
    }
  };

  const handleLastNameBlur = () => {
    if (lastName && !validateName(lastName)) {
      setLastNameError(true);
    } else {
      setLastNameError(false);
    }
  };


  const handleEmailBlur = () => {
    if (email && !validateEmail(email)) {
      setEmailError(true);
    } else {
      setEmailError(false);
    }
  };

  const handleFirstNameChange = (text) => {
    const filteredText = text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''); 
    setFirstName(filteredText);
    if (filteredText && !validateName(filteredText)) {
      setFirstNameError(true);
    } else {
      setFirstNameError(false);
    }
  };

  const handleLastNameChange = (text) => {
    const filteredText = text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''); 
    setLastName(filteredText);
    if (filteredText && !validateName(filteredText)) {
      setLastNameError(true);
    } else {
      setLastNameError(false);
    }
  };
    
  // LÓGICA MODIFICADA PARA GUARDAR/ACTUALIZAR CON VERIFICACIÓN DE DNI
  const handleNewPaciente = async () => {
    // 1. Validaciones de campos obligatorios/formato
    if (!firstName || !lastName || !dni || !email || !telefono || !direccion) {
      showAlert("error", "Error", "Todos los campos son obligatorios.");
      return;
    }

    if (!validateName(firstName)) {
      setFirstNameError(true);
      showAlert("error", "Error", "El nombre solo debe contener letras.");
      return;
    }

    if (!validateName(lastName)) {
      setLastNameError(true);
      showAlert("error", "Error", "El apellido solo debe contener letras.");
      return;
    }
    if (dni.length !== 8) {
      setDniError(true);
      showAlert("error", "DNI Inválido", "El DNI debe tener 8 dígitos.");
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
        // Consulta para buscar pacientes con el mismo DNI
        const q = query(pacientesRef, where("dni", "==", dni));
        const querySnapshot = await getDocs(q);
        
        // Si encontramos documentos (pacientes con ese DNI)
        if (!querySnapshot.empty) {
            
            // Si estamos en MODO EDICIÓN, verificamos si el DNI es el del paciente actual
            if (id) {
                let dniConflict = false;
                querySnapshot.forEach(doc => {
                    // Si el DNI encontrado pertenece a otro paciente (ID diferente)
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
                // MODO CREACIÓN: El DNI ya existe, es un conflicto directo
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
        nombre: firstName,
        apellido: lastName,
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
      // Nota: No limpiamos el ID aquí, se limpia al salir de la pantalla gracias al useEffect
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

  const buttonText = id ? "ACTUALIZAR" : "GUARDAR"; 

  const PasswordMatchInfo = ({ meets }) => (
    <View style={styles.passwordMatchContainer}>
      <FontAwesome
        name={meets ? "check" : "times"} 
        size={18}
        color={meets ? "#05f7c2" : "#ff6b6b"} 
        style={styles.passwordMatchIcon}
      />
      <Text style={[styles.passwordMatchText, { color: meets ? "#05f7c2" : "#ff6b6b" }]}>
        {meets ? "Las contraseñas coinciden" : "Las contraseñas no coinciden"}
      </Text>
    </View>
  );

  return (
    <>
      <StatusBar barStyle="light-content" />
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid={true}
        extraScrollHeight={60}
        enableAutomaticScroll={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.root}>
          <LinearGradient
            colors={["#FFFFFF", "#9FE2CF"]}
            style={styles.gradient}
          >
            <View style={styles.card}>
              <Text style={styles.title}>{id ? "Editar paciente" : "Registrar nuevo paciente"}</Text>
              
              <Text style={styles.label}>Nombre</Text>
              <View style={[styles.inputGroup, firstNameError && styles.inputGroupError]}>
                <TextInput
                  style={styles.input}
                  placeholder="Ingrese el nombre"
                  value={firstName}
                  onChangeText={handleFirstNameChange}
                  onBlur={handleFirstNameBlur}
                  placeholderTextColor="#888"
                />
              </View>
              {firstNameError && (
                <Text style={styles.errorText}>El nombre solo debe contener letras</Text>
              )}

              <Text style={styles.label}>Apellido</Text>
              <View style={[styles.inputGroup, lastNameError && styles.inputGroupError]}>
                <TextInput
                  style={styles.input}
                  placeholder="Ingrese el apellido"
                  value={lastName}
                  onChangeText={handleLastNameChange}
                  onBlur={handleLastNameBlur}
                  placeholderTextColor="#888"
                />
              </View>
              {lastNameError && (
                <Text style={styles.errorText}>El apellido solo debe contener letras</Text>
              )}

              <Text style={styles.label}>DNI</Text>
              <View style={[styles.inputGroup, dniError && styles.inputGroupError]}>
                <TextInput
                  style={styles.input}
                  placeholder="Ingrese el DNI"
                  value={dni}
                  onChangeText={handleDniChange}
                  placeholderTextColor="#888"
                  keyboardType="numeric"
                />
              </View>

              <Text style={styles.label}>Correo</Text>
              <View style={[styles.inputGroup, emailError && styles.inputGroupError]}>
                <TextInput
                  style={styles.input}
                  placeholder="Ingrese su correo"
                  value={email}
                  onChangeText={setEmail}
                  onBlur={handleEmailBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#888"
                />
              </View>
              {emailError && (
                <Text style={styles.errorText}>Formato de correo inválido (ej: usuario@dominio.com)</Text>
              )}

              <Text style={styles.label}>Teléfono</Text>
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="Ingrese el teléfono"
                  value={telefono}
                  onChangeText={handleTelefonoChange}
                  placeholderTextColor="#888"
                  keyboardType="numeric"
                />
              </View>
    

              <Text style={styles.label}>Dirección</Text>
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="Ingrese la dirección"
                  value={direccion}
                  onChangeText={handleAddressChange}
                  placeholderTextColor="#888"
                />
              </View>

              <TouchableOpacity style={styles.button} onPress={handleNewPaciente}>
                <Text style={styles.buttonText}>{buttonText}</Text>
              </TouchableOpacity>
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
  logo: {
    width: 100,
    height: 100,
    alignSelf: "center",
    marginBottom: 10,
    borderColor: "#4ae4c2d6",
    borderWidth: 4,
    borderRadius: 50,
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
  eyeButton: {
    padding: 5,
  },
  button: {
    backgroundColor: "#05f7c2",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 20,
    width: '60%',
    alignSelf: "center",
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  signUpText: {
    marginTop: 20,
    color: "#555",
    textAlign: "center",
    fontSize: 16,
  },
  subtitle: {
    fontSize: 17,
    fontStyle: "italic",
    color: "#05f7c2",
    fontWeight: "bold",
  },
  passwordCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    marginTop: -5,
    width: "100%",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  passwordCardTitle: {
    fontWeight: "bold",
    fontSize: 15,
    marginBottom: 8,
    color: "#333",
  },
  passwordCheckRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  passwordCheckIcon: {
    marginRight: 8,
  },
  passwordCheckText: {
    color: "#888",
    fontSize: 14,
  },
  passwordCheckTextValid: {
    color: "#05f7c2",
    fontWeight: "bold",
  },

  passwordMatchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12, 
    marginTop: -5, 
    paddingHorizontal: 10, 
  },
  passwordMatchIcon: {
    marginRight: 8,
  },
  passwordMatchText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});