import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, Image, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from "expo-linear-gradient";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { collection, addDoc } from 'firebase/firestore';
import { database} from '../src/config/firebaseConfig';

export default function Add({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [dni, setDni] = useState('');
  const [telefono, setTelefono] = useState('');
  const [dniError, setDniError] = useState(false);
  const [telefonoError, setTelefonoError] = useState(false);
  const [direccion, setDireccion] = useState('');
  const [firstNameError, setFirstNameError] = useState(false);
  const [lastNameError, setLastNameError] = useState(false);
  const [emailError, setEmailError] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: "info",
    title: "",
    message: "",
  });

  const showAlert = (type, title, message) => {
    setAlertConfig({ visible: true, type, title, message });
    if (type === "success") {
      setTimeout(() => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
        if (navigation) navigation.goBack();
      }, 2000);
    }
  };

  const closeAlert = () => {
    setAlertConfig({ ...alertConfig, visible: false });
  };

  const validateName = (text) => {
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;
    return nameRegex.test(text);
  };

  // --- ¡ESTAS SON LAS FUNCIONES QUE FALTABAN Y CAUSABAN EL ERROR! ---
  const handleFirstNameChange = (text) => {
    const filteredText = text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''); // Elimina números y caracteres especiales
    setFirstName(filteredText);
    if (filteredText && !validateName(filteredText)) {
      setFirstNameError(true);
    } else {
      setFirstNameError(false);
    }
  };

  const handleLastNameChange = (text) => {
    const filteredText = text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''); // Elimina números y caracteres especiales
    setLastName(filteredText);
    if (filteredText && !validateName(filteredText)) {
      setLastNameError(true);
    } else {
      setLastNameError(false);
    }
  };
  // --- FIN DE LAS FUNCIONES FALTANTES ---


  const handleDniChange = (text) => {
    const filteredText = text.replace(/\D/g, '');
    setDni(filteredText);
    setDniError(filteredText.length > 0 && filteredText.length !== 8);
  };

  const handleTelefonoChange = (text) => {
    const filteredText = text.replace(/\D/g, '');
    setTelefono(filteredText);
    setTelefonoError(filteredText.length > 0 && filteredText.length < 7);
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

  const handleSavePatient = async () => {
    if (!firstName || !lastName || !dni || !email || !telefono || !direccion) {
      showAlert("error", "Error de Campos", "Todos los campos son obligatorios.");
      return;
    }
    if (!validateName(firstName)) {
      setFirstNameError(true);
      showAlert("error", "Nombre Inválido", "El nombre solo debe contener letras.");
      return;
    }
    if (!validateName(lastName)) {
      setLastNameError(true);
      showAlert("error", "Apellido Inválido", "El apellido solo debe contener letras.");
      return;
    }
    if (dni.length !== 8) {
      setDniError(true);
      showAlert("error", "DNI Inválido", "El DNI debe tener 8 dígitos.");
      return;
    }
    if (!validateEmail(email)) {
      setEmailError(true);
      showAlert("error", "Email Inválido", "El formato del correo electrónico no es válido.");
      return;
    }
    if (telefono.length < 7) {
      setTelefonoError(true);
      showAlert("error", "Teléfono Inválido", "El teléfono debe tener al menos 7 dígitos.");
      return;
    }

    try {
      const newPatient = {
        nombre: firstName,
        apellido: lastName,
        dni: dni,
        email: email,
        telefono: telefono,
        direccion: direccion,
        fechaCreacion: new Date(),
      };

      await addDoc(collection(db, "pacientes"), newPatient);

      showAlert("success", "Paciente Registrado", "El paciente ha sido guardado correctamente.");
      
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
      console.error("Error al guardar el paciente:", error);
      showAlert("error", "Error al Guardar", "No se pudo guardar el paciente. Inténtalo de nuevo.");
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid={true}
        extraScrollHeight={100}
        enableAutomaticScroll={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.root}>
          <LinearGradient
            colors={["#FFFFFF", "#9FE2CF"]}
            style={styles.gradient}
          >
            <View style={styles.card}>
              <Text style={styles.title}>Registrar nuevo paciente</Text>
              
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
                  maxLength={8}
                />
              </View>
              {dniError && dni.length > 0 && (
                <Text style={styles.errorText}>El DNI debe tener 8 dígitos</Text>
              )}

              <Text style={styles.label}>Correo</Text>
              <View style={[styles.inputGroup, emailError && styles.inputGroupError]}>
                <TextInput
                  style={styles.input}
                  placeholder="Ingrese el correo"
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
              <View style={[styles.inputGroup, telefonoError && styles.inputGroupError]}>
                <TextInput
                  style={styles.input}
                  placeholder="Ingrese el teléfono"
                  value={telefono}
                  onChangeText={handleTelefonoChange}
                  placeholderTextColor="#888"
                  keyboardType="phone-pad"
                  maxLength={15}
                />
              </View>
              {telefonoError && telefono.length > 0 && (
                <Text style={styles.errorText}>El teléfono debe tener al menos 7 dígitos</Text>
              )}

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
            
              <TouchableOpacity style={styles.button} onPress={handleSavePatient}>
                <Text style={styles.buttonText}>GUARDAR PACIENTE</Text>
              </TouchableOpacity>

              {navigation && (
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                  <Text style={styles.backButtonText}>Volver</Text>
                </TouchableOpacity>
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
  backButton: {
    marginTop: 15,
    alignSelf: 'center',
  },
  backButtonText: {
    color: '#555',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
});