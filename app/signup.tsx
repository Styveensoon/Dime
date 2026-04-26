import { guardarPerfil } from '@/app/utils/firebase';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar
} from 'react-native';
import { Buffer } from 'buffer';

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
  
  // VARIABLES Y ESTADOS ORIGINALES (SIN CAMBIOS)
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [nss, setNss] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // LÓGICA DE REGISTRO ORIGINAL (SIN CAMBIOS)
  const handleSignup = async () => {
    if (!email || !username || !nss || !password || !confirmPassword) {
      Alert.alert('Atención', 'Por favor completa todos los campos institucionalmente requeridos.');
      return;
    }
    if (nss.length !== 11) {
      Alert.alert('NSS Inválido', 'El Número de Seguridad Social debe tener exactamente 11 dígitos.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const userId = Buffer.from(email).toString('base64');
      await guardarPerfil(userId, {
        email,
        username,
        nss,
        password, 
        createdAt: new Date().toISOString(),
        exercisesCompleted: 0,
        diaryEntries: 0,
      });

      await AsyncStorage.setItem('userId', userId);
      await AsyncStorage.setItem('userEmail', email);
      await AsyncStorage.setItem('username', username);
      await AsyncStorage.setItem('userNss', nss);

      router.push('/testGAD7');
    } catch (error: any) {
      Alert.alert('Error de Registro', error.message || 'No se pudo conectar con el servidor.');
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
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.headerSection}>
            <ThemedText type="title" style={[styles.title, { color: isDark ? '#FFF' : IMSS_COLORS.green }]}>
              Crear Cuenta
            </ThemedText>
            <View style={styles.goldLine} />
            <ThemedText style={[styles.subtitle, { color: IMSS_COLORS.gray }]}>
              Regístrate para comenzar tu seguimiento de bienestar digital.
            </ThemedText>
          </View>

          <View style={styles.formSection}>
            
            {/* Nombre de Usuario */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Nombre de Usuario</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#1E1E1E' : IMSS_COLORS.lightGray, color: isDark ? '#FFF' : '#000' }]}
                placeholder="Ej. JuanPerez88"
                placeholderTextColor="#999"
                value={username}
                onChangeText={setUsername}
                editable={!loading}
              />
            </View>

            {/* NSS */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>NSS (11 dígitos)</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#1E1E1E' : IMSS_COLORS.lightGray, color: isDark ? '#FFF' : '#000' }]}
                placeholder="00000000000"
                placeholderTextColor="#999"
                value={nss}
                onChangeText={setNss}
                keyboardType="numeric"
                maxLength={11}
                editable={!loading}
              />
            </View>

            {/* Correo */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Correo Electrónico</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#1E1E1E' : IMSS_COLORS.lightGray, color: isDark ? '#FFF' : '#000' }]}
                placeholder="correo@ejemplo.com"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            {/* Contraseña */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Contraseña</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#1E1E1E' : IMSS_COLORS.lightGray, color: isDark ? '#FFF' : '#000' }]}
                placeholder="••••••••"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>

            {/* Confirmar Contraseña */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Confirmar Contraseña</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#1E1E1E' : IMSS_COLORS.lightGray, color: isDark ? '#FFF' : '#000' }]}
                placeholder="••••••••"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.registerButton, { backgroundColor: IMSS_COLORS.green }]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <ThemedText style={styles.buttonText}>Finalizar Registro</ThemedText>
              )}
            </TouchableOpacity>

            <View style={styles.loginLinkBox}>
              <ThemedText style={{ color: IMSS_COLORS.gray }}>¿Ya tienes una cuenta?</ThemedText>
              <Link href="/login" asChild>
                <TouchableOpacity>
                  <ThemedText style={[styles.loginLink, { color: IMSS_COLORS.green }]}>
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
    paddingTop: 40,
    paddingBottom: 50 
  },
  headerSection: { marginBottom: 30 },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 5 },
  goldLine: { 
    height: 4, 
    width: 45, 
    backgroundColor: IMSS_COLORS.gold, 
    marginBottom: 15, 
    borderRadius: 2 
  },
  subtitle: { fontSize: 15, lineHeight: 22, fontWeight: '500' },
  formSection: { gap: 18 },
  inputGroup: { gap: 8 },
  label: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: IMSS_COLORS.green, 
    marginLeft: 5,
    textTransform: 'uppercase' 
  },
  input: { 
    height: 55, 
    borderRadius: 15, 
    paddingHorizontal: 18, 
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  registerButton: { 
    height: 60, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8
  },
  buttonText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  loginLinkBox: { 
    marginTop: 20, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    gap: 8 
  },
  loginLink: { fontSize: 15, fontWeight: '700' },
});