import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../src/config/firebaseConfig";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Alert from "../components/Alert"; 

export default function ForgotPassword({ navigation }) {
  const [email, setEmail] = useState("");
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: "info",
    title: "",
    message: "",
  });

  const showAlert = (type, title, message) => {
    setAlertConfig({ visible: true, type, title, message });
  };

  const closeAlert = () => {
    setAlertConfig({ ...alertConfig, visible: false });

    
    if (alertConfig.type === "success") {
      navigation.navigate("Login");
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      showAlert("error", "Campo vacío", "Por favor, ingrese su correo electrónico.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      showAlert(
        "success",
        "Correo enviado",
        "Se ha enviado un correo para restablecer su contraseña."
      );
    } catch (error) {
      let errorMessage = "Hubo un problema al enviar el correo.";
      switch (error.code) {
        case "auth/invalid-email":
          errorMessage = "El formato del correo electrónico no es válido.";
          break;
        case "auth/user-not-found":
          errorMessage = "No existe una cuenta con ese correo.";
          break;
        case "auth/network-request-failed":
          errorMessage = "Error de conexión, intenta más tarde.";
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
        keyboardOpeningTime={0}
        enableAutomaticScroll={true}
        keyboardShouldPersistTaps="handled" 
      >
        <View style={styles.root}>
          <LinearGradient
            colors={["#FFFFFF", "#9FE2CF"]}
            style={styles.gradient}
          >
            <View style={styles.card}>
              <Text style={styles.title}>Restablecer Contraseña</Text>
              <Image
                source={require("../assets/copia.png")}
                style={styles.logo}
                resizeMode="contain"
              />

              <Text style={styles.label}>Correo electrónico</Text>
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

              <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
                <Text style={styles.buttonText}>Enviar correo</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.signUpText}>
                  ¿Recordaste tu contraseña?{" "}
                  <Text style={styles.subtitle}>Inicia sesión</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </KeyboardAwareScrollView>

      {/*Alerta reutilizable */}
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
    justifyContent: "center",
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
    marginBottom: 25,
    textAlign: "center",
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: "center",
    marginBottom: 25,
    borderColor: "#4ae4c2d6",
    borderWidth: 4,
    borderRadius: 50,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 20,
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
  button: {
    backgroundColor: "#05f7c2",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 10,
    width: "60%",
    alignSelf: "center",
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  signUpText: {
    marginTop: 25,
    color: "#555",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    fontStyle: "italic",
    color: "#05f7c2",
    fontWeight: "bold",
  },
});
