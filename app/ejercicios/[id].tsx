import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, StyleSheet, TouchableOpacity, SafeAreaView, 
  StatusBar, Dimensions, Alert, Animated 
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useLocalSearchParams, useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const IMSS_COLORS = { green: '#1F4529', gold: '#B38E5D', gray: '#6F7271', white: '#FFFFFF' };

export default function FunctionalActivityScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // --- ESTADOS PARA JUEGOS ---
  const [targetPos, setTargetPos] = useState({ top: 100, left: 100 }); // Para Atención
  const [mathProblem, setMathProblem] = useState({ q: '', a: 0 }); // Para Lógica
  const [sequence, setSequence] = useState<number[]>([]); // Para Memoria
  const [userStep, setUserStep] = useState(0);

  // 1. LÓGICA JUEGO: ATENCIÓN (Atrapa el punto)
  const moveTarget = useCallback(() => {
    const newTop = Math.floor(Math.random() * 200);
    const newLeft = Math.floor(Math.random() * (width - 100));
    setTargetPos({ top: newTop, left: newLeft });
  }, []);

  const handleAttentionClick = () => {
    setScore(s => s + 1);
    moveTarget();
  };

  // 2. LÓGICA JUEGO: LÓGICA (Mates rápidas)
  const generateMath = () => {
    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    setMathProblem({ q: `${n1} + ${n2} = ?`, a: n1 + n2 });
  };

  const checkMath = (input: number) => {
    if (input === mathProblem.a) {
      setScore(s => s + 1);
      generateMath();
    } else {
      Alert.alert("Incorrecto", "¡Inténtalo de nuevo!");
    }
  };

  // 3. INICIAR JUEGOS
  const startGame = () => {
    setScore(0);
    setIsPlaying(true);
    if (id === 'logica') generateMath();
    if (id === 'atencion') moveTarget();
    if (id === 'memoria') {
        setSequence([Math.floor(Math.random() * 4)]);
        Alert.alert("Memoria", "Observa los botones y repite (Función en desarrollo)");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><ThemedText style={styles.close}>✕</ThemedText></TouchableOpacity>
        <ThemedText style={styles.scoreText}>PUNTOS: {score}</ThemedText>
      </View>

      <View style={styles.gameContainer}>
        {!isPlaying ? (
          <View style={styles.startScreen}>
            <ThemedText style={styles.hugeEmoji}>{id === 'memoria' ? '🧠' : id === 'atencion' ? '🎯' : '🧩'}</ThemedText>
            <ThemedText type="title">Reto de {id}</ThemedText>
            <TouchableOpacity style={styles.mainBtn} onPress={startGame}>
              <ThemedText style={styles.btnText}>¡EMPEZAR YA!</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.activeArea}>
            
            {/* JUEGO DE ATENCIÓN */}
            {id === 'atencion' && (
              <TouchableOpacity 
                style={[styles.target, { top: targetPos.top, left: targetPos.left }]} 
                onPress={handleAttentionClick}
              />
            )}

            {/* JUEGO DE LÓGICA */}
            {id === 'logica' && (
              <View style={styles.mathBox}>
                <ThemedText style={styles.mathQ}>{mathProblem.q}</ThemedText>
                <View style={styles.options}>
                  {[mathProblem.a, mathProblem.a + 2, mathProblem.a - 1].sort().map(opt => (
                    <TouchableOpacity key={opt} style={styles.optBtn} onPress={() => checkMath(opt)}>
                      <ThemedText style={styles.optText}>{opt}</ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* JUEGO DE MEMORIA (SIMPLIFICADO) */}
            {id === 'memoria' && (
               <View style={styles.memoryGrid}>
                 {[0,1,2,3].map(i => (
                   <TouchableOpacity key={i} style={styles.memBox} onPress={() => setScore(s => s + 1)}>
                     <ThemedText>Pulse aquí</ThemedText>
                   </TouchableOpacity>
                 ))}
               </View>
            )}

          </View>
        )}
      </View>
      
      {isPlaying && (
        <TouchableOpacity style={styles.stopBtn} onPress={() => setIsPlaying(false)}>
          <ThemedText style={{color: '#FFF'}}>FINALIZAR</ThemedText>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 25, alignItems: 'center' },
  close: { fontSize: 28, color: IMSS_COLORS.gray },
  scoreText: { fontSize: 20, fontWeight: '900', color: IMSS_COLORS.gold },
  gameContainer: { flex: 1, padding: 20 },
  startScreen: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hugeEmoji: { fontSize: 80, marginBottom: 20 },
  mainBtn: { backgroundColor: IMSS_COLORS.green, paddingVertical: 20, paddingHorizontal: 40, borderRadius: 20, marginTop: 30 },
  btnText: { color: '#FFF', fontWeight: '800', fontSize: 18 },
  activeArea: { flex: 1, position: 'relative' },
  
  // Estilos Atención
  target: { width: 60, height: 60, backgroundColor: IMSS_COLORS.gold, borderRadius: 30, position: 'absolute' },
  
  // Estilos Lógica
  mathBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mathQ: { fontSize: 40, fontWeight: '900', marginBottom: 40 },
  options: { flexDirection: 'row', gap: 15 },
  optBtn: { backgroundColor: IMSS_COLORS.green, width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  optText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },

  // Estilos Memoria
  memoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, justifyContent: 'center', marginTop: 50 },
  memBox: { width: 120, height: 120, backgroundColor: '#F0F0F0', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },

  stopBtn: { backgroundColor: '#CC0000', margin: 30, padding: 20, borderRadius: 15, alignItems: 'center' }
});