import { crearPerfil } from '@/app/utils/firebase';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 

const IMSS_COLORS = {
  green: '#1F4529',
  gold: '#B38E5D',
  gray: '#6F7271',
  lightGray: '#F4F4F4',
  white: '#FFFFFF',
};

export default function SignupScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [nss, setNss] = useState('');
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async () => {
    // Validaciones básicas (Se retiró la validación del CURP)
    if (!email || !nss || !nombre || !password || !confirmPassword) {
      Alert.alert('Atención', 'Por favor completa todos los campos obligatorios.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }
    
    if (nss.length !== 11) {
      Alert.alert('Error', 'El NSS debe tener 11 dígitos numéricos.');
      return;
    }

    setLoading(true);
    try {
      const userId = Buffer.from(email).toString('base64');
      
      const userData = {
        userId,
        username: nombre,
        nss
      };

      await crearPerfil(userId, userData);
      
      await AsyncStorage.setItem('userId', userId);
      await AsyncStorage.setItem('userEmail', email);
      await AsyncStorage.setItem('username', nombre);
      await AsyncStorage.setItem('userNss', nss);

      router.replace('/main');
    } catch (error: any) {
      Alert.alert('Error de Registro', error.message || 'No se pudo crear el perfil. Verifique sus datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#121212' : IMSS_COLORS.white }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
        >
          {/* Header Minimalista */}
          <View style={styles.headerSection}>
            <View style={styles.logoSquare}>
              <ThemedText style={styles.logoText}>IMSS</ThemedText>
            </View>
            <ThemedText type="title" style={[styles.title, { color: isDark ? '#FFF' : IMSS_COLORS.green }]}>
              Crear Cuenta
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: IMSS_COLORS.gray }]}>
              Regístrate en Salud Digital
            </ThemedText>
          </View>

          {/* Formulario Estilizado */}
          <View style={styles.formSection}>
            
            {/* Nombre Completo */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Nombre Completo</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: isDark ? '#1E1E1E' : IMSS_COLORS.lightGray, color: isDark ? '#FFF' : '#000' }
                ]}
                placeholder="Juan Pérez García"
                placeholderTextColor="#999"
                value={nombre}
                onChangeText={setNombre}
                editable={!loading}
              />
            </View>

            {/* Correo Electrónico */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Correo Electrónico</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: isDark ? '#1E1E1E' : IMSS_COLORS.lightGray, color: isDark ? '#FFF' : '#000' }
                ]}
                placeholder="ejemplo@correo.com"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            {/* NSS (Ahora ocupa todo el ancho) */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>NSS (11 dígitos)</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: isDark ? '#1E1E1E' : IMSS_COLORS.lightGray, color: isDark ? '#FFF' : '#000' }
                ]}
                placeholder="12345678901"
                placeholderTextColor="#999"
                value={nss}
                onChangeText={setNss}
                keyboardType="numeric"
                maxLength={11}
                editable={!loading}
              />
            </View>

            {/* Contraseña */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Contraseña</ThemedText>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    { backgroundColor: isDark ? '#1E1E1E' : IMSS_COLORS.lightGray, color: isDark ? '#FFF' : '#000' }
                  ]}
                  placeholder="••••••••"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeIconContainer}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={showPassword ? 'eye-off' : 'eye'} 
                    size={24} 
                    color={IMSS_COLORS.gray} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirmar Contraseña */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Confirmar Contraseña</ThemedText>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    { backgroundColor: isDark ? '#1E1E1E' : IMSS_COLORS.lightGray, color: isDark ? '#FFF' : '#000' }
                  ]}
                  placeholder="••••••••"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeIconContainer}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={showConfirmPassword ? 'eye-off' : 'eye'} 
                    size={24} 
                    color={IMSS_COLORS.gray} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.mainButton, { backgroundColor: IMSS_COLORS.green }]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <ThemedText style={styles.buttonText}>Registrarse</ThemedText>
              )}
            </TouchableOpacity>

            {/* Volver al Login */}
            <View style={styles.signupBox}>
              <ThemedText style={{ color: IMSS_COLORS.gray }}>¿Ya tienes cuenta?</ThemedText>
              <Link href="/" asChild>
                <TouchableOpacity>
                  <ThemedText style={[styles.signupLink, { color: IMSS_COLORS.green }]}>
                    Inicia Sesión
                  </ThemedText>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { 
    flexGrow: 1, 
    paddingHorizontal: 30, 
    justifyContent: 'center',
    paddingVertical: 30 
  },
  headerSection: { 
    alignItems: 'center', 
    marginBottom: 40 
  },
  logoSquare: { 
    width: 50, 
    height: 50, 
    backgroundColor: IMSS_COLORS.green, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8
  },
  logoText: { color: '#FFF', fontWeight: '900', fontSize: 14 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 5 },
  subtitle: { fontSize: 15, fontWeight: '500' },
  formSection: { gap: 18 },
  inputContainer: { gap: 7 },
  label: { 
    fontSize: 11, 
    fontWeight: '700', 
    color: IMSS_COLORS.green, 
    marginLeft: 5,
    textTransform: 'uppercase' 
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: { 
    height: 55, 
    borderRadius: 16, 
    paddingHorizontal: 18, 
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  passwordInput: {
    paddingRight: 60,
  },
  eyeIconContainer: {
    position: 'absolute',
    right: 15,
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  mainButton: { 
    height: 55, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 10,
    elevation: 4,
    shadowColor: IMSS_COLORS.green,
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  buttonText: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  signupBox: { 
    marginTop: 20, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    gap: 8,
    alignItems: 'center'
  },
  signupLink: { fontSize: 14, fontWeight: '700' }
});