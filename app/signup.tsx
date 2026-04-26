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
  View
} from 'react-native';
import { Buffer } from 'buffer';

// Paleta Institucional
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
  const [username, setUsername] = useState('');
  const [nss, setNss] = useState(''); // NUEVO: Estado para el NSS
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    // Validaciones
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
      console.log("--- INICIANDO REGISTRO INSTITUCIONAL ---");
      
      const userId = Buffer.from(email).toString('base64');
      
      // 2. Guardado en Firebase incluyendo el NSS
      await guardarPerfil(userId, {
        email,
        username,
        nss, // Se guarda el NSS en la base de datos
        password, 
        createdAt: new Date().toISOString(),
        exercisesCompleted: 0,
        diaryEntries: 0,
      });

      console.log("Paso 1: Datos guardados en Firebase con NSS");

      // 3. Storage Local (Guardamos el NSS para validarlo después al salir)
      await AsyncStorage.setItem('userId', userId);
      await AsyncStorage.setItem('userEmail', email);
      await AsyncStorage.setItem('username', username);
      await AsyncStorage.setItem('userNss', nss); // Guardado localmente

      console.log("Paso 2: Sesión iniciada localmente");

      Alert.alert('Éxito', '¡Cuenta institucional creada correctamente!');
      router.push('/main');

    } catch (error: any) {
      console.error("❌ ERROR:", error);
      Alert.alert('Error de Registro', error.message || 'No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#121212' : IMSS_COLORS.white }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.headerSection}>
            <ThemedText type="title" style={[styles.title, { color: IMSS_COLORS.green }]}>
              Nueva Cuenta
            </ThemedText>
            <View style={styles.divider} />
            <ThemedText style={[styles.subtitle, { color: IMSS_COLORS.gray }]}>
              Ingresa tus datos para el seguimiento de bienestar.
            </ThemedText>
          </View>

          <View style={styles.formSection}>
            
            {/* Campo: Nombre de Usuario */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Nombre de Usuario</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#222' : IMSS_COLORS.lightGray }]}
                placeholder="Ej. JuanPerez88"
                placeholderTextColor="#999"
                value={username}
                onChangeText={setUsername}
                editable={!loading}
              />
            </View>

            {/* Campo: NSS (NUEVO) */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Número de Seguridad Social (NSS)</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#222' : IMSS_COLORS.lightGray }]}
                placeholder="11 dígitos"
                placeholderTextColor="#999"
                value={nss}
                onChangeText={setNss}
                keyboardType="numeric"
                maxLength={11}
                editable={!loading}
              />
            </View>

            {/* Campo: Correo */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Correo Electrónico</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#222' : IMSS_COLORS.lightGray }]}
                placeholder="correo@ejemplo.com"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            {/* Campo: Contraseña */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Contraseña</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#222' : IMSS_COLORS.lightGray }]}
                placeholder="••••••••"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>

            {/* Campo: Confirmar Contraseña */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Confirmar Contraseña</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#222' : IMSS_COLORS.lightGray }]}
                placeholder="••••••••"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: IMSS_COLORS.green }]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <ThemedText style={styles.buttonText}>Registrar</ThemedText>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <ThemedText style={{ color: IMSS_COLORS.gray }}>
                ¿Ya tienes una cuenta registrada?
              </ThemedText>
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
  scrollContent: { flexGrow: 1, paddingHorizontal: 30, paddingVertical: 40 },
  headerSection: { marginBottom: 35 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 8 },
  divider: { height: 4, width: 40, backgroundColor: IMSS_COLORS.gold, marginBottom: 15, borderRadius: 2 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  formSection: { gap: 12 },
  inputGroup: { marginBottom: 5 },
  label: { fontSize: 11, fontWeight: '700', color: IMSS_COLORS.gray, marginBottom: 6, textTransform: 'uppercase' },
  input: { height: 50, borderRadius: 4, paddingHorizontal: 15, fontSize: 16, borderBottomWidth: 2, borderBottomColor: IMSS_COLORS.gold },
  button: { height: 55, borderRadius: 4, justifyContent: 'center', alignItems: 'center', marginTop: 15, elevation: 3 },
  buttonText: { fontSize: 14, fontWeight: '700', color: '#fff', textTransform: 'uppercase' },
  loginContainer: { marginTop: 20, alignItems: 'center', gap: 5 },
  loginLink: { fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
});