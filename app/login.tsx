import { leerPerfil } from '@/app/utils/firebase';
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

const IMSS_COLORS = {
  green: '#1F4529',
  gold: '#B38E5D',
  gray: '#6F7271',
  lightGray: '#F4F4F4',
  white: '#FFFFFF',
};

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  
  // VARIABLES ORIGINALES SIN CAMBIOS
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // LÓGICA ORIGINAL SIN CAMBIOS
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Atención', 'Por favor completa tus credenciales de acceso.');
      return;
    }

    setLoading(true);
    try {
      const userId = Buffer.from(email).toString('base64');
      const perfil = await leerPerfil(userId);
      
      if (!perfil) {
        Alert.alert('Error', 'Usuario no encontrado. Por favor regístrate primero.');
        setLoading(false);
        return;
      }

      await AsyncStorage.setItem('userId', userId);
      await AsyncStorage.setItem('userEmail', email);
      await AsyncStorage.setItem('username', perfil.username || '');

      router.push('/main');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo iniciar sesión. Verifique sus datos.');
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
              Bienvenido
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: IMSS_COLORS.gray }]}>
              Acceso a Salud Digital
            </ThemedText>
          </View>

          {/* Formulario Estilizado */}
          <View style={styles.formSection}>
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

            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Contraseña</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: isDark ? '#1E1E1E' : IMSS_COLORS.lightGray, color: isDark ? '#FFF' : '#000' }
                ]}
                placeholder="••••••••"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>

            <Link href="/forgot-password" asChild>
              <TouchableOpacity style={styles.forgotBtn}>
                <ThemedText style={[styles.forgotLink, { color: IMSS_COLORS.gold }]}>
                  ¿Olvidaste tu contraseña?
                </ThemedText>
              </TouchableOpacity>
            </Link>

            <TouchableOpacity
              style={[styles.mainButton, { backgroundColor: IMSS_COLORS.green }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <ThemedText style={styles.buttonText}>Entrar</ThemedText>
              )}
            </TouchableOpacity>

            {/* Registro */}
            <View style={styles.signupBox}>
              <ThemedText style={{ color: IMSS_COLORS.gray }}>¿No tienes cuenta?</ThemedText>
              <Link href="/signup" asChild>
                <TouchableOpacity>
                  <ThemedText style={[styles.signupLink, { color: IMSS_COLORS.green }]}>
                    Regístrate
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
    paddingHorizontal: 35, 
    justifyContent: 'center',
    paddingVertical: 40 
  },
  headerSection: { 
    alignItems: 'center', 
    marginBottom: 50 
  },
  logoSquare: { 
    width: 55, 
    height: 55, 
    backgroundColor: IMSS_COLORS.green, 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  logoText: { color: '#FFF', fontWeight: '900', fontSize: 16 },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 5 },
  subtitle: { fontSize: 16, fontWeight: '500' },
  formSection: { gap: 20 },
  inputContainer: { gap: 8 },
  label: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: IMSS_COLORS.green, 
    marginLeft: 5,
    textTransform: 'uppercase' 
  },
  input: { 
    height: 60, 
    borderRadius: 18, 
    paddingHorizontal: 20, 
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  forgotBtn: { alignSelf: 'flex-end', marginTop: -5 },
  forgotLink: { fontSize: 14, fontWeight: '600' },
  mainButton: { 
    height: 60, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 15,
    elevation: 4,
    shadowColor: IMSS_COLORS.green,
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  buttonText: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  signupBox: { 
    marginTop: 25, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    gap: 8 
  },
  signupLink: { fontSize: 15, fontWeight: '700' }
});