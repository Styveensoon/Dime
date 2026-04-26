import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  SafeAreaView, 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Platform // <-- 1. Importamos Platform
} from 'react-native';

const IMSS_COLORS = {
  green: '#1F4529',
  gold: '#B38E5D',
  gray: '#6F7271',
  lightGray: '#F4F4F4',
  white: '#FFFFFF',
  success: '#2E7D32',
};

export default function ProfileScreen() {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  
  // Estado para los datos del usuario
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarInfoPerfil = async () => {
      try {
        // Recuperamos los datos que guardamos en Signup
        const nombre = await AsyncStorage.getItem('username');
        const nss = await AsyncStorage.getItem('userNss');
        const email = await AsyncStorage.getItem('userEmail');
        
        // Formateamos el NSS para que se vea institucional (opcional)
        const nssFormateado = nss ? `${nss.substring(0,4)}-${nss.substring(4,6)}-${nss.substring(6,10)}-${nss.substring(10,11)}` : 'No asignado';

        setUserData({
          nombre: nombre?.toUpperCase() || "USUARIO NO REGISTRADO",
          nss: nssFormateado,
          email: email || "Sin correo",
          curp: "GENERANDO...", // Estos datos podrías pedirlos en el signup después
          unidad: "Unidad Pendiente",
          turno: "No asignado",
          vigencia: "DERECHOs VIGENTES",
          tipo: "Cuenta Digital"
        });
      } catch (error) {
        console.error("Error al cargar perfil:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarInfoPerfil();
  }, []);

  if (loading) {
    return (
      <View 
        style={{ 
          flex: 1, 
          justifyContent: 'center', 
          backgroundColor: isDark ? '#121212' : IMSS_COLORS.lightGray,
          // 2. También agregamos el padding en la pantalla de carga para evitar "saltos" visuales
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 
        }}
      >
        <ActivityIndicator size="large" color={IMSS_COLORS.green} />
      </View>
    );
  }

  return (
    <SafeAreaView 
      style={[
        styles.container, 
        { 
          backgroundColor: isDark ? '#121212' : IMSS_COLORS.lightGray,
          // 3. Agregamos el padding dinámico solo para Android en el contenedor principal
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 
        }
      ]}
    >
      {/* 4. Ajustamos la StatusBar para que sea transparente y se coloque correctamente */}
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent={true} />
      
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { backgroundColor: isDark ? '#1A1A1A' : IMSS_COLORS.white }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={{ color: IMSS_COLORS.gold, fontWeight: 'bold', fontSize: 16 }}>← Volver</ThemedText>
        </TouchableOpacity>
        <ThemedText type="title" style={[styles.headerTitle, { color: IMSS_COLORS.green }]}>Perfil Ciudadano</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={[styles.idCard, { backgroundColor: isDark ? '#1E1E1E' : '#FFF' }]}>
          <View style={styles.cardHeader}>
            <View style={styles.avatarContainer}>
              <ThemedText style={styles.avatarText}>{userData.nombre.substring(0,2)}</ThemedText>
            </View>
            <View style={styles.statusBadge}>
              <ThemedText style={styles.statusText}>{userData.vigencia}</ThemedText>
            </View>
          </View>

          <View style={styles.mainInfo}>
            <ThemedText style={[styles.userName, { color: isDark ? '#FFF' : IMSS_COLORS.green }]}>
              {userData.nombre}
            </ThemedText>
            <ThemedText style={styles.userType}>{userData.tipo}</ThemedText>
          </View>

          <View style={styles.nssContainer}>
            <ThemedText style={styles.nssLabel}>NÚMERO DE SEGURIDAD SOCIAL</ThemedText>
            <ThemedText style={[styles.nssValue, { color: IMSS_COLORS.gold }]}>{userData.nss}</ThemedText>
          </View>
        </View>

        <View style={styles.detailsSection}>
          <ThemedText style={styles.sectionTitle}>Información de Afiliación</ThemedText>
          
          <InfoItem label="Correo Electrónico" value={userData.email} isDark={isDark} />
          <InfoItem label="Estado de Cuenta" value="Activo" isDark={isDark} />
          <InfoItem label="Unidad de Medicina Familiar" value={userData.unidad} isDark={isDark} />
          <InfoItem label="Turno" value={userData.turno} isDark={isDark} />
        </View>

        <View style={styles.footerNote}>
          <ThemedText style={styles.footerNoteText}>
            Esta es una identificación digital basada en tu registro exitoso en Firebase.
          </ThemedText>
          <TouchableOpacity style={styles.btnCertificado}>
            <ThemedText style={styles.btnCertificadoText}>Generar Constancia Digital</ThemedText>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function InfoItem({ label, value, isDark }: { label: string, value: string, isDark: boolean }) {
  return (
    <View style={[styles.infoItem, { borderBottomColor: isDark ? '#333' : '#E0E0E0' }]}>
      <ThemedText style={styles.infoLabel}>{label}</ThemedText>
      <ThemedText style={[styles.infoValue, { color: isDark ? '#EEE' : '#222' }]}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  backButton: { paddingVertical: 5, paddingRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  content: { padding: 20 },
  idCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    elevation: 8,
    borderLeftWidth: 6,
    borderLeftColor: IMSS_COLORS.gold,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: IMSS_COLORS.green,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: IMSS_COLORS.gold,
  },
  avatarText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: IMSS_COLORS.success,
  },
  statusText: { color: IMSS_COLORS.success, fontSize: 10, fontWeight: '800' },
  mainInfo: { marginBottom: 20 },
  userName: { fontSize: 22, fontWeight: '900', letterSpacing: 0.5 },
  userType: { fontSize: 14, color: IMSS_COLORS.gray, marginTop: 2 },
  nssContainer: {
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 15,
  },
  nssLabel: { fontSize: 10, color: IMSS_COLORS.gray, fontWeight: '700', letterSpacing: 1 },
  nssValue: { fontSize: 24, fontWeight: '800', marginTop: 5, letterSpacing: 2 },
  detailsSection: { marginBottom: 30 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: IMSS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 15,
  },
  infoItem: { paddingVertical: 12, borderBottomWidth: 1 },
  infoLabel: { fontSize: 11, color: IMSS_COLORS.gray, marginBottom: 4 },
  infoValue: { fontSize: 16, fontWeight: '600' },
  footerNote: { alignItems: 'center', marginTop: 10 },
  footerNoteText: {
    fontSize: 11,
    color: IMSS_COLORS.gray,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  btnCertificado: {
    backgroundColor: IMSS_COLORS.green,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 50
  },
  btnCertificadoText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});