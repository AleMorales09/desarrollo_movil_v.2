import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome } from "@expo/vector-icons";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../src/config/firebaseConfig";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Alert from "../components/Alert";

export default function Login({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        // Aquí puedes navegar si lo necesitas
        // navigation.reset({ index: 0, routes: [{ name: "App" }] });
      }, 3000);
    }
  };

  const closeAlert = () => {
    setAlertConfig({ ...alertConfig, visible: false });
    // Si quieres navegar después de cerrar manualmente la alerta de éxito:
    // if (alertConfig.type === "success") {
    //   navigation.reset({ index: 0, routes: [{ name: "App" }] });
    // }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert("error", "Por favor, complete ambos campos.");
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      showAlert("success", "¡Bienvenido!", "Se inició sesión correctamente.");
      //Espera 3 segundos antes de navegar
      setTimeout(() => {
        //si quieres navegar manualmente, descomenta la siguiente línea:
        navigation.reset({ index: 0, routes: [{ name: "App" }] });
      }, 3000);
    } catch (error) {
      let errorMessage = "Hubo un problema al iniciar sesión.";
      let errorTitle = "E-mail y/o contraseña incorrectos";
      switch (error.code) {
        case "auth/invalid-email":
          errorTitle = "Correo inválido";
          errorMessage = "Por favor, verifique su correo.";
          break;
        case "auth/wrong-password":
        case "auth/user-not-found":
          errorTitle = "E-mail y/o contraseña incorrecta";
          errorMessage = "Por favor, verifique sus datos.";
          break;
        case "auth/network-request-failed":
          errorTitle = "Sin conexión";
          errorMessage = "Error de conexión, intenta más tarde.";
          break;
        case "auth/invalid-credential":
          errorTitle = "E-mail y/o contraseña incorrectos";
          errorMessage = "Por favor, verifique sus datos.";
          break;
        default:
          errorMessage = error.message;
      }
      showAlert("Error", errorTitle, errorMessage);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" />
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid={true}
        extraScrollHeight={0}
      >
        <View style={styles.root}>
          {/* Imagen odontológica arriba con degradado superpuesto */}
          <View style={styles.headerImageContainer}>
            <Image
              source={require("../assets/foto-slider-4-1.png")}
              style={styles.headerImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["rgba(250, 245, 245, 0)", "#fff"]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.5, y: 0.0 }}
              end={{ x: 0.5, y: 1.0 }}
            />
          </View>

          {/* Degradado debajo de la imagen */}
          <LinearGradient
            colors={["#FFFFFF", "#9FE2CF"]}
            style={styles.gradient}
          >
            <View style={styles.card}>
              <Text style={styles.title}>Iniciar Sesión</Text>
              <Image
                source={require("../assets/copia.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.label}>Correo</Text>
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="Correo electrónico"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
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
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <FontAwesome
                    name={showPassword ? "eye-slash" : "eye"}
                    size={18}
                    color="#555"
                  />
                </TouchableOpacity>
              </View>
              {/* Botón de "¿Olvidaste tu contraseña?" debajo del campo de contraseña */}
              <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
                <Text style={styles.forgotLink}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>INGRESAR</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
                <Text style={styles.signUpText}>
                  ¿No tenés cuenta?{" "}
                  <Text style={styles.subtitle}>Regístrate</Text>
                </Text>
              </TouchableOpacity>
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
  headerImageContainer: {
    position: "relative",
    width: "100%",
    height: 220,
    overflow: "hidden",
  },
  headerImage: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
    alignItems: "center",
  },
  card: {
    width: "95%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 20,
    elevation: 30,
    marginBottom: 0,
    marginTop: -20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 15,
    textAlign: "center",
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: "center",
    marginBottom: 20,
    borderColor: "#4ae4c2d6",
    borderWidth: 4,
    borderRadius: 50,
    padding: 40,
  },
  label: {
    fontSize: 18,
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
    width: '60%',
    alignSelf: "center",
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  signUpText: {
    marginTop: 30,
    color: "#555",
    textAlign: "center",
    fontSize: 16,
  },
  subtitle: {
    fontSize: 17,
    fontStyle: "italic",
    color: "#05f7c2",
    fontWeight: "bold",
    //textDecorationLine: "underline",
  },
  forgotLink: {
    marginTop: 15,
    marginBottom: 25,
    color: "#2196F3",
    textAlign: "right",
    fontWeight: "bold",
    //textDecorationLine: "underline",
    fontSize: 14,
  },
});