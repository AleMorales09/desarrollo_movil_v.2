import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { auth } from '../src/config/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { LinearGradient } from "expo-linear-gradient";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Alert from '../components/Alert';
import { Database } from 'firebase/database';
import { collection, addDoc } from 'firebase/firestore';

export default function SignUp({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [dni, setDni] = useState('');
  const [telefono, setTelefono] = useState('');
  const [dniError, setDniError] = useState(false); // ⬅️ NUEVO: Estado de error para DNI
  const [telefonoError, setTelefonoError] = useState(false); // ⬅️ NUEVO: Estado de error para Teléfono
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
  });
  

  const showAlert = (type, title, message) => {
    setAlertConfig({ visible: true, type, title, message });
    if (type === "success") {
      setTimeout(() => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }, 3000);
    }
  };

  const closeAlert = () => {
    setAlertConfig({ ...alertConfig, visible: false });
  };

  // Función para validar que solo contenga letras y espacios
  const validateName = (text) => {
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;
    return nameRegex.test(text);
  };

  const handleDniChange = (text) => {
    // 🎯 MODIFICACIÓN CLAVE: Filtra cualquier cosa que NO sea un dígito (\D) o usa [^0-9]
    const filteredText = text.replace(/\D/g, ''); 
    setDni(filteredText);

    // La validación en tiempo real de si solo son números ya la haces con el replace.
    // Aquí podrías agregar una validación de *longitud* si es necesario.
    // Ejemplo:
    // setDniError(filteredText.length > 0 && filteredText.length < 7);
  };

  // Función para Teléfono (Solo números)
  const handleTelefonoChange = (text) => { // ⬅️ NUEVA FUNCIÓN
    // 🎯 MODIFICACIÓN CLAVE: Filtra cualquier cosa que NO sea un dígito (\D)
    const filteredText = text.replace(/\D/g, '');
    setTelefono(filteredText);
  };
    
  // Función para validar formato de correo
  const validateEmail = (text) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  };

  const handleAddressChange = (text) => {
    const addressRegex = /[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,\/-]/g;

    // Reemplaza todo lo que NO coincida con el patrón (es decir, caracteres especiales) por una cadena vacía.
    const filteredText = text.replace(addressRegex, '');

    setDireccion(filteredText); 
  };


  // Validar nombre cuando pierde el foco
  const handleFirstNameBlur = () => {
    if (firstName && !validateName(firstName)) {
      setFirstNameError(true);
    } else {
      setFirstNameError(false);
    }
  };

  // Validar apellido cuando pierde el foco
  const handleLastNameBlur = () => {
    if (lastName && !validateName(lastName)) {
      setLastNameError(true);
    } else {
      setLastNameError(false);
    }
  };


  // Validar correo cuando pierde el foco
  const handleEmailBlur = () => {
    if (email && !validateEmail(email)) {
      setEmailError(true);
    } else {
      setEmailError(false);
    }
  };


  // Validaciones en tiempo real para la contraseña
  // const passwordChecks = useMemo(() => ({
  //   hasCase: /[a-z]/.test(password),
  //   hasUppercase: /[A-Z]/.test(password),
  //   hasNumber: /\d/.test(password),
  //   hasMinLength: password.length >= 6,
  // }), [password]);

  const passwordsMatch = useMemo(() => {
    // Solo verificar si ambas contraseñas tienen algún valor y son iguales
    return password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  }, [password, confirmPassword]);

  const handleSignUp = async () => {
    if (!firstName || !lastName || !email || !telefono || !direccion) {
      showAlert("error", "Error", "Todos los campos son obligatorios.");
      return;
    }

    // Validar nombre y apellido antes de registrar
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

    // Validar correo antes de registrar
    if (!validateEmail(email)) {
      setEmailError(true);
      showAlert("error", "Error", "El formato del correo electrónico no es válido.");
      return;
    }

    if (password !== confirmPassword) {
      showAlert("error", "Error", "Las contraseñas no coinciden.");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,}$/;
    if (!passwordRegex.test(password)) {
      showAlert(
        "error",
        "Error",
        "La contraseña debe tener al menos 6 caracteres, incluyendo una letra mayúscula, una minúscula y un número."
      );
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      showAlert("success", "Registro exitoso", "Usuario registrado con éxito.");
    } catch (error) {
      let errorMessage = "Hubo un problema al registrar el usuario.";
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "El correo electrónico ya está en uso.";
          break;
        case 'auth/invalid-email':
          errorMessage = "El formato del correo electrónico no es válido.";
          break;
        case 'auth/weak-password':
          errorMessage = "La contraseña es demasiado débil.";
          break;
        case 'auth/network-request-failed':
          errorMessage = "Error de conexión, por favor intenta más tarde.";
          break;
      }
      showAlert("error", "Error", errorMessage);
    }
  };


  // --- NUEVA FUNCIÓN PARA MANEJAR EL CAMBIO DE TEXTO DEL NOMBRE ---
  const handleFirstNameChange = (text) => {
    const filteredText = text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''); // Elimina números y caracteres especiales
    setFirstName(filteredText);
    // Puedes mantener la validación de error en tiempo real o en onBlur
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

  // --- COMPONENTE AUXILIAR PARA EL MENSAJE DE COINCIDENCIA DE CONTRASEÑAS ---
  const PasswordMatchInfo = ({ meets }) => (
    <View style={styles.passwordMatchContainer}>
      <FontAwesome
        name={meets ? "check" : "times"} // Check si coinciden, X si no
        size={18}
        color={meets ? "#05f7c2" : "#ff6b6b"} // Verde si coinciden, rojo si no
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
        extraScrollHeight={100}
        enableAutomaticScroll={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.root}>
          {/* Degradado de fondo */}
          <LinearGradient
            colors={["#FFFFFF", "#9FE2CF"]}
            style={styles.gradient}
          >
            {/* Tarjeta blanca que contiene todo el formulario */}
            <View style={styles.card}>
              <Text style={styles.title}>Registrar nuevo paciente</Text>
              
              {/* Logo */}
              {/* <Image
                source={require("../assets/copia.png")}
                style={styles.logo}
                resizeMode="contain"
              /> */}

              <Text style={styles.label}>Nombre</Text>
              <View style={[styles.inputGroup, firstNameError && styles.inputGroupError]}>
                <TextInput
                  style={styles.input}
                  placeholder="Ingrese el nombre"
                  value={firstName}
                  // onChangeText={setFirstName}
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
                  // onChangeText={setLastName}
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
                  // onChangeText={setFirstName}
                  onChangeText={handleDniChange}
                  // onBlur={handleFirstNameBlur}
                  placeholderTextColor="#888"
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
                  // secureTextEntry={!showPassword}
                  // onFocus={() => setShowPasswordInfo(true)}
                  // onBlur={() => setShowPasswordInfo(false)}
                  placeholderTextColor="#888"
                />
                {/* <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <FontAwesome name={showPassword ? "eye-slash" : "eye"} size={18} color="#555" />
                </TouchableOpacity> */}
              </View>

              {/* Tarjeta de requisitos de contraseña */}
              {/* {showPasswordInfo && (
                <View style={styles.passwordCard}>
                  <Text style={styles.passwordCardTitle}>Requisitos de contraseña:</Text>
                    <View style={styles.passwordCheckRow}>
                    <FontAwesome
                      name="check"
                      size={18}
                      color={passwordChecks.hasMinLength ? "#05f7c2" : "#ccc"}
                      style={styles.passwordCheckIcon}
                    />
                    <Text style={[
                      styles.passwordCheckText,
                      passwordChecks.hasMinLength && styles.passwordCheckTextValid
                    ]}>
                      Mínimo 6 caracteres
                    </Text>
                  </View>
                  <View style={styles.passwordCheckRow}>
                    <FontAwesome
                      name="check"
                      size={18}
                      color={passwordChecks.hasUppercase ? "#05f7c2" : "#ccc"}
                      style={styles.passwordCheckIcon}
                    />
                    <Text style={[
                      styles.passwordCheckText,
                      passwordChecks.hasCase && styles.passwordCheckTextValid
                    ]}>
                      Al menos una letra minúscula
                    </Text>
                  </View>                 
                  <View style={styles.passwordCheckRow}>
                    <FontAwesome
                      name="check"
                      size={18}
                      color={passwordChecks.hasUppercase ? "#05f7c2" : "#ccc"}
                      style={styles.passwordCheckIcon}
                    />
                    <Text style={[
                      styles.passwordCheckText,
                      passwordChecks.hasUppercase && styles.passwordCheckTextValid
                    ]}>
                      Al menos una letra mayúscula
                    </Text>
                  </View>
                  <View style={styles.passwordCheckRow}>
                    <FontAwesome
                      name="check"
                      size={18}
                      color={passwordChecks.hasNumber ? "#05f7c2" : "#ccc"}
                      style={styles.passwordCheckIcon}
                    />
                    <Text style={[
                      styles.passwordCheckText,
                      passwordChecks.hasNumber && styles.passwordCheckTextValid
                    ]}>
                      Al menos un número
                    </Text>
                  </View>

                </View>
              )} */}
    

              <Text style={styles.label}>Dirección</Text>
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="Ingrese la dirección"
                  value={direccion}
                  onChangeText={handleAddressChange}
                  // secureTextEntry={!showConfirmPassword}
                  //onFocus={() => setShowPasswordInfo(false)}
                  placeholderTextColor="#888"
                  // onFocus={() => setShowPasswordMatchInfo(true)} // Mostrar al enfocar
                  // onBlur={() => setShowPasswordMatchInfo(false)} // Ocultar al perder el foco
                  //placeholderTextColor="#888"
                />
                {/* <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
                  <FontAwesome name={showConfirmPassword ? "eye-slash" : "eye"} size={18} color="#555" />
                </TouchableOpacity> */}
              </View>
    
                {/* --- NUEVO: Aviso de Contraseñas Coincidentes --- */}
                {/* {showPasswordMatchInfo && (confirmPassword.length > 0) && ( // Solo mostrar si hay texto en confirmar contraseña
                  <PasswordMatchInfo meets={passwordsMatch} /> )}
                
                {confirmPassword.length === 0 && <View style={{marginBottom: 10}}/>} */}

              <TouchableOpacity style={styles.button} onPress={handleSignUp}>
                <Text style={styles.buttonText}>REGISTRARSE</Text>
              </TouchableOpacity>

              {/* <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.signUpText}>
                  ¿Ya tenés cuenta?{" "}
                  <Text style={styles.subtitle}>Inicia sesión</Text>
                </Text>
              </TouchableOpacity> */}
            </View>
          </LinearGradient>
        </View>
      </KeyboardAwareScrollView>

      {/* Alerta Personalizada */}
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

  // --- NUEVOS ESTILOS PARA LA COINCIDENCIA DE CONTRASEÑAS ---
  passwordMatchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12, // Espacio después del mensaje
    marginTop: -5, // Para que esté más cerca del input
    paddingHorizontal: 10, // Alinear con el input
  },
  passwordMatchIcon: {
    marginRight: 8,
  },
  passwordMatchText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});