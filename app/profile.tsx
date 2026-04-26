import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter, Stack } from 'expo-router';
import React from 'react';
import { 
  SafeAreaView, 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  ScrollView,
  StatusBar
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

  // Datos simulados del ciudadano
  const userData = {
    nombre: "JUAN PÉREZ GONZÁLEZ",
    nss: "1234-56-7890-1",
    curp: "PEGO800101HDFRRS01",
    unidad: "UMF No. 57 - Puebla",
    consultorio: "04",
    turno: "Matutino",
    vigencia: "DERECHOHABIENTE VIGENTE",
    tipo: "Trabajador Permanente"
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#121212' : IMSS_COLORS.lightGray }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Configuración de la barra de navegación nativa */}
      <Stack.Screen options={{ 
        headerShown: false,
        title: 'Mi Perfil' 
      }} />

      {/* Header Personalizado */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1A1A1A' : IMSS_COLORS.white }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={{ color: IMSS_COLORS.gold, fontWeight: 'bold', fontSize: 16 }}>← Volver</ThemedText>
        </TouchableOpacity>
        <ThemedText type="title" style={[styles.headerTitle, { color: IMSS_COLORS.green }]}>Perfil Ciudadano</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Tarjeta de Identificación Digital */}
        <View style={[styles.idCard, { backgroundColor: isDark ? '#1E1E1E' : '#FFF' }]}>
          <View style={styles.cardHeader}>
            <View style={styles.avatarContainer}>
              <ThemedText style={styles.avatarText}>DH</ThemedText>
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

        {/* Detalles Adicionales */}
        <View style={styles.detailsSection}>
          <ThemedText style={styles.sectionTitle}>Información de Afiliación</ThemedText>
          
          <InfoItem label="CURP" value={userData.curp} isDark={isDark} />
          <InfoItem label="Unidad de Medicina Familiar" value={userData.unidad} isDark={isDark} />
          <InfoItem label="Consultorio Asignado" value={userData.consultorio} isDark={isDark} />
          <InfoItem label="Turno" value={userData.turno} isDark={isDark} />
        </View>

        {/* Aviso de Privacidad / Seguridad */}
        <View style={styles.footerNote}>
          <ThemedText style={styles.footerNoteText}>
            Esta es una identificación digital oficial. Los datos mostrados están protegidos por la Ley General de Protección de Datos Personales.
          </ThemedText>
          <TouchableOpacity style={styles.btnCertificado}>
            <ThemedText style={styles.btnCertificadoText}>Descargar Vigencia de Derechos</ThemedText>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// Componente pequeño para cada fila de información
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: { paddingVertical: 5, paddingRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  content: { padding: 20 },
  idCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
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
  },
  btnCertificadoText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});