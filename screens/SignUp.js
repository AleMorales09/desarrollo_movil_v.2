import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Modal, Animated, ScrollView, StatusBar } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { auth } from '../src/config/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { LinearGradient } from "expo-linear-gradient";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

// Componente de Alerta Personalizada (igual que en Login.js)
const CustomAlert = ({ visible, type, title, message, onClose }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const getIconAndColor = () => {
    switch (type) {
      case "success":
        return { icon: "check-circle", color: "#05f7c2", iconColor: "#00d9a6" };
      case "error":
        return { icon: "exclamation-circle", color: "#ff6b6b", iconColor: "#ff5252" };
      default:
        return { icon: "info-circle", color: "#64bae8", iconColor: "#4a9ed9" };
    }
  };

  const { icon, color, iconColor } = getIconAndColor();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.alertOverlay}>
        <Animated.View
          style={[
            styles.alertContainer,
            {
              opacity: fadeAnim,
              transform: [
                {
                  scale: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={["#ffffff", "#f8f9fa"]}
            style={styles.alertContent}
          >
            <View style={[styles.alertIconContainer, { backgroundColor: color + "20" }]}>
              <FontAwesome name={icon} size={40} color={iconColor} />
            </View>
            <Text style={styles.alertTitle}>{title}</Text>
            <Text style={styles.alertMessage}>{message}</Text>
            <TouchableOpacity
              style={[styles.alertButton, { backgroundColor: color }]}
              onPress={onClose}
            >
              <Text style={styles.alertButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default function SignUp({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordInfo, setShowPasswordInfo] = useState(false);

  // Estado para la alerta personalizada
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

  // Validaciones en tiempo real para la contraseña
  const passwordChecks = useMemo(() => ({
    hasUppercase: /[A-Z]/.test(password),
    hasMinLength: password.length >= 6,
  }), [password]);

  const handleSignUp = async () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      showAlert("error", "Error", "Todos los campos son obligatorios.");
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

  return (
    <>
      <StatusBar barStyle="light-content" />
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid={true}
        extraScrollHeight={20}
      >
        <LinearGradient
          colors={["#ffffffff", "#9fe2cfff"]}
          style={styles.gradient}
        >
          <View style={styles.card}>
            <CustomAlert
              visible={alertConfig.visible}
              type={alertConfig.type}
              title={alertConfig.title}
              message={alertConfig.message}
              onClose={closeAlert}
            />
            <Text style={styles.title}>Regístrate</Text>

            <Text style={styles.label}>Nombre</Text>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                placeholder="Ingrese su nombre"
                value={firstName}
                onChangeText={setFirstName}
                placeholderTextColor="#888"
              />
            </View>

            <Text style={styles.label}>Apellido</Text>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                placeholder="Ingrese su apellido"
                value={lastName}
                onChangeText={setLastName}
                placeholderTextColor="#888"
              />
            </View>

            <Text style={styles.label}>Correo</Text>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                placeholder="Ingrese su correo"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#888"
              />
            </View>

            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                placeholder="Ingrese su contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setShowPasswordInfo(true)}
                onBlur={() => setShowPasswordInfo(false)}
                placeholderTextColor="#888"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <FontAwesome name={showPassword ? "eye-slash" : "eye"} size={18} color="#555" />
              </TouchableOpacity>
            </View>

            {/* Tarjeta de requisitos de contraseña */}
            {showPasswordInfo && (
              <View style={styles.passwordCard}>
                <Text style={styles.passwordCardTitle}>Requisitos de la contraseña:</Text>
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
              </View>
            )}

            <Text style={styles.label}>Confirmar Contraseña</Text>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                placeholder="Confirme su contraseña"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                onFocus={() => setShowPasswordInfo(false)}
                placeholderTextColor="#888"
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
                <FontAwesome name={showConfirmPassword ? "eye-slash" : "eye"} size={18} color="#555" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSignUp}>
              <Text style={styles.buttonText}>Registrarse</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.signUpText}>
                ¿Ya tienes cuenta?{" "}
                <Text style={styles.subtitle}>Inicia sesión</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </KeyboardAwareScrollView>
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
    paddingTop: 130, // Subir el formulario más arriba
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#ffffffff",
    borderRadius: 8,
    padding: 20,
    elevation: 4,
    marginTop: 0, // El formulario inicia más arriba
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 16,
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
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
    marginTop: 10,
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  signUpText: {
    marginTop: 20,
    color: "#555",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    fontStyle: "italic",
    color: "#05f7c2",
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  passwordCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    marginTop: -5,
    width: "100%",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  passwordCardTitle: {
    fontWeight: "bold",
    fontSize: 15,
    marginBottom: 8,
    color: "#2233e6ff",
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
  // Estilos de la alerta personalizada
  alertOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  alertContainer: {
    width: "85%",
    maxWidth: 350,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  alertContent: {
    padding: 25,
    alignItems: "center",
  },
  alertIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  alertTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 12,
    textAlign: "center",
  },
  alertMessage: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 22,
  },
  alertButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
  },
  alertButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

