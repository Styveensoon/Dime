import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// ─── Config ──────────────────────────────────────────────────────────────────
// Reemplaza con tu key real. En producción: expo-constants + app.config.js
const ANTHROPIC_API_KEY = 'TU_API_KEY_AQUI';
const ANTHROPIC_URL     = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL   = 'claude-sonnet-4-20250514';

// ─── Constantes cognitivas ────────────────────────────────────────────────────
const WORD_SETS = [
  ['ÁRBOL',  'CAMINO', 'PERRO'],
  ['LLUVIA', 'LIBRO',  'FLORES'],
  ['MESA',   'CIUDAD', 'CIELO'],
];
const ALL_DAYS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];

function getTodayWords() {
  return WORD_SETS[new Date().getDay() % WORD_SETS.length];
}
function getCorrectDay() {
  const d = new Date().getDay();
  return ALL_DAYS[d === 0 ? 6 : d - 1];
}
function shuffleDayOptions(correct: string) {
  const others = ALL_DAYS.filter(d => d !== correct).sort(() => Math.random() - 0.5).slice(0, 3);
  return [...others, correct].sort(() => Math.random() - 0.5);
}

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Tab        = 'estado' | 'cognitivo' | 'reporte';
type CogPhase   = 'intro' | 'task1' | 'mem_show' | 'task2' | 'mem_recall' | 'result';

interface Mood {
  id:     number;
  face:   string;
  label:  string;
  score:  number;
  color:  string;
  bg:     string;
  border: string;
}

interface MoodEntry {
  id:      number;
  date:    string;
  mood:    Mood;
  comment: string;
  time:    string;
}

interface CogResults {
  orientScore:  number;
  memScore:     number;
  animalCount:  number;
  pct:          number;
  correctDay:   string;
}

// ─── Datos de estados de ánimo ────────────────────────────────────────────────
const MOODS: Mood[] = [
  { id:1, face:'😞', label:'Muy mal',  score:1, color:'#A32D2D', bg:'#FCEBEB', border:'#F09595' },
  { id:2, face:'😕', label:'Regular',  score:2, color:'#854F0B', bg:'#FAEEDA', border:'#EF9F27' },
  { id:3, face:'🙂', label:'Bien',     score:3, color:'#3B6D11', bg:'#EAF3DE', border:'#97C459' },
  { id:4, face:'😄', label:'Muy bien', score:4, color:'#085041', bg:'#E1F5EE', border:'#5DCAA5' },
];

const PUEBLA_SERVICES = [
  { name:'Línea de la Vida',    type:'Crisis emocional 24/7',             phone:'800 911 2000', urgent:true  },
  { name:'UNEME-CISAME Puebla', type:'Salud mental especializada',         phone:'222 246 0111', urgent:false },
  { name:'IMSS — Médico familiar', type:'Primer contacto, solicitar psicólogo', phone:'800 623 2323', urgent:false },
  { name:'SSEP Puebla',         type:'Secretaría de Salud del Estado',    phone:'222 229 5500', urgent:false },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function todayStr() { return new Date().toISOString().split('T')[0]; }
function fmtShortDate(dateStr: string) {
  return new Date(dateStr + 'T12:00').toLocaleDateString('es-MX', { weekday:'short', day:'numeric' });
}

// ─── Componentes internos ─────────────────────────────────────────────────────

function ProgressBar({ step, total = 4 }: { step: number; total?: number }) {
  return (
    <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginBottom:20 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={{ flex:1, height:3, borderRadius:2,
          backgroundColor: i < step ? '#1D9E75' : '#E5E7EB' }} />
      ))}
      <ThemedText style={{ fontSize:11, color:'#9CA3AF' }}>{step}/{total}</ThemedText>
    </View>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function DiaryScreen() {
  const colorScheme = useColorScheme();
  const colors      = Colors[colorScheme ?? 'light'];
  const isDark      = colorScheme === 'dark';
  const inputBg     = isDark ? '#2a2a2a' : '#f5f5f5';

  // Tab activo
  const [activeTab, setActiveTab] = useState<Tab>('estado');

  // ── Estado: Estado mental ───────────────────────────────────────────────────
  const [moodEntries,  setMoodEntries]  = useState<MoodEntry[]>([]);
  const [selMood,      setSelMood]      = useState<Mood | null>(null);
  const [moodComment,  setMoodComment]  = useState('');
  const [justSaved,    setJustSaved]    = useState(false);

  // ── Estado: Cognitivo ───────────────────────────────────────────────────────
  const WORDS       = getTodayWords();
  const CORRECT_DAY = getCorrectDay();
  const DAY_OPTIONS = useRef(shuffleDayOptions(CORRECT_DAY)).current;

  const [cogPhase,        setCogPhase]        = useState<CogPhase>('intro');
  const [orientAns,       setOrientAns]       = useState<string | null>(null);
  const [memCountdown,    setMemCountdown]    = useState(8);
  const [fluencyText,     setFluencyText]     = useState('');
  const [fluencyTimer,    setFluencyTimer]    = useState(30);
  const [fluencyStarted,  setFluencyStarted]  = useState(false);
  const [memAnss,         setMemAnss]         = useState(['', '', '']);
  const [cogResults,      setCogResults]      = useState<CogResults | null>(null);

  const memIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fluIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Estado: Reporte ─────────────────────────────────────────────────────────
  const [report,      setReport]      = useState<any>(null);
  const [generating,  setGenerating]  = useState(false);
  const [showSvc,     setShowSvc]     = useState(false);

  // ── AsyncStorage: cargar mood entries ───────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem('@aura:mood_entries')
      .then(raw => { if (raw) setMoodEntries(JSON.parse(raw)); })
      .catch(() => {});
  }, []);

  async function saveMoodEntries(next: MoodEntry[]) {
    setMoodEntries(next);
    try { await AsyncStorage.setItem('@aura:mood_entries', JSON.stringify(next)); } catch {}
  }

  // Limpiar intervalos al desmontar
  useEffect(() => () => {
    if (memIntervalRef.current) clearInterval(memIntervalRef.current);
    if (fluIntervalRef.current) clearInterval(fluIntervalRef.current);
  }, []);

  // Cuenta regresiva de memorización
  useEffect(() => {
    if (cogPhase !== 'mem_show') return;
    setMemCountdown(8);
    memIntervalRef.current = setInterval(() => {
      setMemCountdown(prev => {
        if (prev <= 1) {
          clearInterval(memIntervalRef.current!);
          setCogPhase('task2');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (memIntervalRef.current) clearInterval(memIntervalRef.current); };
  }, [cogPhase]);

  // ─── Acciones ───────────────────────────────────────────────────────────────

  const handleSaveMood = () => {
    if (!selMood) return;
    const now = new Date();
    const entry: MoodEntry = {
      id:      now.getTime(),
      date:    todayStr(),
      mood:    selMood,
      comment: moodComment.trim(),
      time:    now.toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' }),
    };
    const next = [...moodEntries.filter(e => e.date !== todayStr()), entry];
    saveMoodEntries(next);
    setSelMood(null); setMoodComment(''); setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
  };

  const startFluency = () => {
    setFluencyStarted(true); setFluencyTimer(30);
    fluIntervalRef.current = setInterval(() => {
      setFluencyTimer(prev => {
        if (prev <= 1) { clearInterval(fluIntervalRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const calcCogResults = () => {
    const orientScore = orientAns === CORRECT_DAY ? 1 : 0;
    const recalled    = memAnss.map(a => a.trim().toUpperCase());
    const memScore    = WORDS.filter(w => recalled.some(r => r.includes(w.slice(0, 4)))).length;
    const animals     = fluencyText.split(/[\s,;.\n]+/).filter(a => a.trim().length > 1);
    const animalCount = animals.length;
    const pct         = Math.round(((orientScore + memScore + Math.min(animalCount, 10)) / 14) * 100);
    setCogResults({ orientScore, memScore, animalCount, pct, correctDay: CORRECT_DAY });
    setCogPhase('result');
  };

  const resetCog = () => {
    setCogPhase('intro'); setOrientAns(null); setFluencyText('');
    setFluencyTimer(30); setFluencyStarted(false); setMemAnss(['','','']); setCogResults(null);
    if (memIntervalRef.current) clearInterval(memIntervalRef.current);
    if (fluIntervalRef.current) clearInterval(fluIntervalRef.current);
  };

  const generateReport = useCallback(async () => {
    const last7 = [...moodEntries].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 7);
    if (last7.length < 2) {
      Alert.alert('Pocos datos', 'Necesitas al menos 2 registros de estado mental para generar un reporte.');
      return;
    }
    setGenerating(true); setReport(null);
    const summary = last7.map(e => `${e.date}: ${e.mood.label}${e.comment ? ` — "${e.comment}"` : ''}`).join('\n');
    try {
      const res  = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version':'2023-06-01' },
        body: JSON.stringify({
          model: ANTHROPIC_MODEL, max_tokens: 1000,
          system: `Eres un asistente de bienestar emocional empático para usuarios en Puebla, México. Responde ÚNICAMENTE con JSON válido sin bloques de código ni explicaciones, con esta estructura exacta: {"resumen":"...","patron":"...","recomendaciones":["...","...","..."],"nivel_atencion":"bajo|medio|alto","mensaje_aliento":"..."}`,
          messages: [{ role:'user', content:`Genera el reporte semanal de estos registros:\n${summary}\n\nEscala: Muy mal=1, Regular=2, Bien=3, Muy bien=4. Sé empático y culturalmente cercano al contexto mexicano.` }],
        }),
      });
      const data = await res.json();
      const text = data.content[0].text.replace(/```json|```/g, '').trim();
      setReport(JSON.parse(text));
    } catch {
      setReport({ error: true });
    }
    setGenerating(false);
  }, [moodEntries]);

  // ─── Helpers de UI ──────────────────────────────────────────────────────────
  const todayMoodEntry = moodEntries.find(e => e.date === todayStr());
  const last7Moods     = [...moodEntries].sort((a,b) => b.date.localeCompare(a.date)).slice(0,7);
  const avgScore       = last7Moods.length
    ? (last7Moods.reduce((s,e) => s + e.mood.score, 0) / last7Moods.length).toFixed(1) : '—';

  // ─── RENDER: Estado Mental ──────────────────────────────────────────────────
  function renderEstado() {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex:1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ThemedText style={[styles.backText, { color: colors.tint }]}>← Atrás</ThemedText>
          </TouchableOpacity>
          <ThemedText type="title" style={styles.screenTitle}>Estado mental</ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.icon }]}>¿Cómo te sientes hoy?</ThemedText>

          {/* Selector de humor 2×2 */}
          <View style={styles.moodGrid}>
            {MOODS.map(m => {
              const selected = selMood?.id === m.id;
              return (
                <TouchableOpacity key={m.id} activeOpacity={0.7}
                  style={[styles.moodBtn, { borderColor: selected ? m.border : colors.icon,
                    backgroundColor: selected ? m.bg : inputBg,
                    borderWidth: selected ? 2 : 0.5 }]}
                  onPress={() => setSelMood(m)}>
                  <ThemedText style={styles.moodEmoji}>{m.face}</ThemedText>
                  <ThemedText style={[styles.moodLabel, { color: selected ? m.color : colors.text,
                    fontWeight: selected ? '600' : '400' }]}>
                    {m.label}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Comentario */}
          <ThemedText style={[styles.label, { color: colors.text }]}>Comentario (opcional)</ThemedText>
          <TextInput style={[styles.textArea, { minHeight: 70, borderColor: colors.icon,
              color: colors.text, backgroundColor: inputBg }]}
            placeholder="¿Algo que quieras recordar de hoy?"
            placeholderTextColor={colors.icon} value={moodComment}
            onChangeText={setMoodComment} multiline textAlignVertical="top" />

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.tint, opacity: selMood ? 1 : 0.4 }]}
            onPress={handleSaveMood} disabled={!selMood}>
            <ThemedText style={styles.primaryBtnTxt}>
              {justSaved ? '✓  Guardado' : 'Guardar registro'}
            </ThemedText>
          </TouchableOpacity>

          {/* Promedio y últimos 7 días */}
          {last7Moods.length > 0 && (
            <>
              <View style={styles.rowBetween}>
                <ThemedText style={[styles.sectionLabel, { color: colors.icon }]}>
                  Últimos 7 días
                </ThemedText>
                <ThemedText style={[styles.sectionLabel, { color: colors.tint }]}>
                  Promedio: {avgScore}
                </ThemedText>
              </View>
              {last7Moods.map(e => (
                <View key={e.id} style={[styles.histCard, { backgroundColor: inputBg, borderColor: colors.icon }]}>
                  <ThemedText style={styles.moodEmoji}>{e.mood.face}</ThemedText>
                  <View style={{ flex: 1 }}>
                    <View style={styles.rowBetween}>
                      <ThemedText style={[styles.moodLabel, { color: e.mood.color, fontWeight: '600' }]}>
                        {e.mood.label}
                      </ThemedText>
                      <ThemedText style={[styles.entryFecha, { color: colors.icon }]}>
                        {fmtShortDate(e.date)}
                      </ThemedText>
                    </View>
                    {!!e.comment && (
                      <ThemedText style={[styles.entryContenido, { color: colors.icon }]} numberOfLines={1}>
                        "{e.comment}"
                      </ThemedText>
                    )}
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ─── RENDER: Cognitivo ──────────────────────────────────────────────────────
  function renderCognitivo() {
    // INTRO
    if (cogPhase === 'intro') return (
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ThemedText style={[styles.backText, { color: colors.tint }]}>← Atrás</ThemedText>
        </TouchableOpacity>
        <ThemedText type="title" style={styles.screenTitle}>Ejercicio cognitivo</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.icon }]}>3 tareas breves · ~3 minutos</ThemedText>

        <View style={[styles.infoCard, { backgroundColor: '#E1F5EE', borderColor: '#9FE1CB' }]}>
          <ThemedText style={[styles.label, { color: '#085041' }]}>¿Qué vamos a hacer?</ThemedText>
          {[
            ['1','Orientación temporal','¿Qué día de la semana es hoy?'],
            ['2','Memoria diferida','Memorizar 3 palabras para recordar al final'],
            ['3','Fluencia verbal','Nombrar animales en 30 segundos'],
          ].map(([n,t,d]) => (
            <View key={n} style={[styles.rowStart, { marginBottom: 10 }]}>
              <ThemedText style={{ fontSize:11, fontWeight:'600', color:'#1D9E75', width:18 }}>{n}</ThemedText>
              <View>
                <ThemedText style={[styles.moodLabel, { color:'#085041', fontWeight:'600' }]}>{t}</ThemedText>
                <ThemedText style={{ fontSize:12, color:'#0F6E56' }}>{d}</ThemedText>
              </View>
            </View>
          ))}
        </View>

        <ThemedText style={[styles.disclaimer, { color: colors.icon }]}>
          Esta actividad monitorea tu bienestar cognitivo en el tiempo. No es un diagnóstico médico.
        </ThemedText>
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.tint }]}
          onPress={() => setCogPhase('task1')}>
          <ThemedText style={styles.primaryBtnTxt}>Comenzar →</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    );

    // TAREA 1: Orientación
    if (cogPhase === 'task1') return (
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => setCogPhase('intro')} style={styles.backBtn}>
          <ThemedText style={[styles.backText, { color: colors.tint }]}>← Atrás</ThemedText>
        </TouchableOpacity>
        <ProgressBar step={1} />
        <ThemedText type="title" style={styles.screenTitle}>Orientación temporal</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.icon }]}>¿Qué día de la semana es hoy?</ThemedText>
        {DAY_OPTIONS.map(day => (
          <TouchableOpacity key={day}
            style={[styles.optBtn, { borderColor: orientAns === day ? '#5DCAA5' : colors.icon,
              backgroundColor: orientAns === day ? '#E1F5EE' : inputBg,
              borderWidth: orientAns === day ? 2 : 0.5 }]}
            onPress={() => setOrientAns(day)}>
            <ThemedText style={{ fontSize:15, color: orientAns === day ? '#085041' : colors.text,
              fontWeight: orientAns === day ? '600' : '400' }}>{day}</ThemedText>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.tint, opacity: orientAns ? 1 : 0.4 }]}
          onPress={() => setCogPhase('mem_show')} disabled={!orientAns}>
          <ThemedText style={styles.primaryBtnTxt}>Continuar →</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    );

    // TAREA 2: Mostrar palabras
    if (cogPhase === 'mem_show') return (
      <ScrollView contentContainerStyle={styles.scroll}>
        <ProgressBar step={2} />
        <ThemedText type="title" style={styles.screenTitle}>Memoriza estas palabras</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.icon }]}>
          Las necesitarás al final. Tienes {memCountdown} segundos.
        </ThemedText>
        {WORDS.map(w => (
          <View key={w} style={[styles.wordCard, { backgroundColor: '#E6F1FB', borderColor: '#85B7EB' }]}>
            <ThemedText style={styles.wordTxt}>{w}</ThemedText>
          </View>
        ))}
        <View style={styles.centeredBlock}>
          <ThemedText style={[styles.bigNum, { color: memCountdown <= 3 ? '#A32D2D' : colors.tint }]}>
            {memCountdown}
          </ThemedText>
          <ThemedText style={[styles.disclaimer, { color: colors.icon, textAlign:'center' }]}>
            segundos restantes
          </ThemedText>
        </View>
      </ScrollView>
    );

    // TAREA 3: Fluencia verbal
    if (cogPhase === 'task2') return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex:1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {!fluencyStarted && (
            <TouchableOpacity onPress={() => setCogPhase('task1')} style={styles.backBtn}>
              <ThemedText style={[styles.backText, { color: colors.tint }]}>← Atrás</ThemedText>
            </TouchableOpacity>
          )}
          <ProgressBar step={3} />
          <ThemedText type="title" style={styles.screenTitle}>Fluencia verbal</ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.icon }]}>
            Escribe el mayor número de <ThemedText style={{ fontWeight:'600' }}>animales</ThemedText> que puedas en 30 segundos.
          </ThemedText>
          {!fluencyStarted ? (
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.tint }]} onPress={startFluency}>
              <ThemedText style={styles.primaryBtnTxt}>Iniciar cronómetro →</ThemedText>
            </TouchableOpacity>
          ) : (
            <>
              <View style={styles.centeredBlock}>
                <ThemedText style={[styles.bigNum, { color: fluencyTimer <= 10 ? '#A32D2D' : colors.tint }]}>
                  {fluencyTimer}s
                </ThemedText>
              </View>
              <TextInput style={[styles.textArea, { borderColor: colors.icon, color: colors.text,
                  backgroundColor: inputBg }]}
                value={fluencyText} onChangeText={t => fluencyTimer > 0 && setFluencyText(t)}
                placeholder="perro, gato, elefante, delfín..."
                placeholderTextColor={colors.icon} multiline autoFocus
                editable={fluencyTimer > 0} textAlignVertical="top" />
              {fluencyTimer === 0 && (
                <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.tint, marginTop: 12 }]}
                  onPress={() => setCogPhase('mem_recall')}>
                  <ThemedText style={styles.primaryBtnTxt}>Continuar → Recordar palabras</ThemedText>
                </TouchableOpacity>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    );

    // TAREA 4: Recordar palabras
    if (cogPhase === 'mem_recall') return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex:1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => setCogPhase('task2')} style={styles.backBtn}>
            <ThemedText style={[styles.backText, { color: colors.tint }]}>← Atrás</ThemedText>
          </TouchableOpacity>
          <ProgressBar step={4} />
          <ThemedText type="title" style={styles.screenTitle}>¿Recuerdas las 3 palabras?</ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.icon }]}>
            Escribe las palabras que memorizaste al inicio.
          </ThemedText>
          {[0,1,2].map(i => (
            <View key={i} style={{ marginBottom: 14 }}>
              <ThemedText style={[styles.label, { color: colors.text }]}>Palabra {i + 1}</ThemedText>
              <TextInput style={[styles.input, { borderColor: colors.icon, color: colors.text, backgroundColor: inputBg }]}
                value={memAnss[i]}
                onChangeText={t => { const next=[...memAnss]; next[i]=t; setMemAnss(next); }}
                placeholder="Escribe aquí..." placeholderTextColor={colors.icon}
                autoCapitalize="characters" />
            </View>
          ))}
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.tint }]} onPress={calcCogResults}>
            <ThemedText style={styles.primaryBtnTxt}>Ver resultados →</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );

    // RESULTADO
    if (cogPhase === 'result' && cogResults) {
      const { orientScore, memScore, animalCount, pct, correctDay } = cogResults;
      const sc = pct >= 70 ? '#085041' : pct >= 40 ? '#854F0B' : '#A32D2D';
      const bg = pct >= 70 ? '#E1F5EE' : pct >= 40 ? '#FAEEDA' : '#FCEBEB';
      const lb = pct >= 70 ? 'Excelente' : pct >= 50 ? 'Bien' : pct >= 30 ? 'Con área de mejora' : 'Requiere atención';
      return (
        <ScrollView contentContainerStyle={styles.scroll}>
          <TouchableOpacity onPress={resetCog} style={styles.backBtn}>
            <ThemedText style={[styles.backText, { color: colors.tint }]}>← Atrás</ThemedText>
          </TouchableOpacity>
          <ThemedText type="title" style={styles.screenTitle}>Resultado</ThemedText>
          <View style={[styles.resultBig, { backgroundColor: bg }]}>
            <ThemedText style={[styles.bigNum, { color: sc }]}>{pct}%</ThemedText>
            <ThemedText style={[styles.moodLabel, { color: sc }]}>{lb}</ThemedText>
          </View>
          {([
            ['Orientación', `${orientScore}/1 pto`, orientScore===1 ? `✓ Correcto (${correctDay})` : `Correcto: ${correctDay}`, orientScore===1?'#085041':'#A32D2D'],
            ['Memoria diferida', `${memScore}/3 palabras`, `Recordaste ${memScore} de 3`, memScore>=2?'#085041':'#854F0B'],
            ['Fluencia verbal', `${animalCount} animales`, animalCount>=10?'Excelente':animalCount>=7?'Bien':'La práctica diaria ayuda', animalCount>=10?'#085041':'#854F0B'],
          ] as [string,string,string,string][]).map(([label,pts,detail,c]) => (
            <View key={label} style={[styles.histCard, { backgroundColor: inputBg, borderColor: colors.icon }]}>
              <View style={styles.rowBetween}>
                <ThemedText style={[styles.moodLabel, { fontWeight:'600' }]}>{label}</ThemedText>
                <ThemedText style={[styles.moodLabel, { color:c, fontWeight:'600' }]}>{pts}</ThemedText>
              </View>
              <ThemedText style={{ fontSize:12, color: colors.icon }}>{detail}</ThemedText>
            </View>
          ))}
          <ThemedText style={[styles.disclaimer, { color: colors.icon }]}>
            El seguimiento diario permite detectar cambios en el tiempo. No sustituye evaluación médica.
          </ThemedText>
          <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.icon, backgroundColor: inputBg }]}
            onPress={resetCog}>
            <ThemedText style={[styles.primaryBtnTxt, { color: colors.text }]}>Listo</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      );
    }
    return null;
  }

  // ─── RENDER: Reporte ────────────────────────────────────────────────────────
  function renderReporte() {
    return (
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ThemedText style={[styles.backText, { color: colors.tint }]}>← Atrás</ThemedText>
        </TouchableOpacity>
        <ThemedText type="title" style={styles.screenTitle}>Reporte semanal</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.icon }]}>
          Basado en tus últimos {last7Moods.length} registros
        </ThemedText>

        {/* Mini gráfica de barras */}
        {last7Moods.length > 0 && (
          <View style={[styles.infoCard, { backgroundColor: inputBg, borderColor: colors.icon }]}>
            <ThemedText style={[styles.disclaimer, { color: colors.icon }]}>Tendencia de la semana</ThemedText>
            <View style={{ flexDirection:'row', alignItems:'flex-end', height:60, gap:5 }}>
              {[...last7Moods].reverse().map((e,i) => (
                <View key={i} style={{ flex:1, alignItems:'center', justifyContent:'flex-end', height:'100%' }}>
                  <View style={{ width:'100%', borderRadius:3,
                    backgroundColor: e.mood.bg, borderWidth:0.5, borderColor: e.mood.border,
                    height: e.mood.score * 12 }} />
                  <ThemedText style={{ fontSize:9, color: colors.icon, marginTop:3 }}>
                    {fmtShortDate(e.date).slice(0,2)}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.tint, opacity: generating ? 0.6 : 1 }]}
          onPress={generateReport} disabled={generating}>
          <ThemedText style={styles.primaryBtnTxt}>
            {generating ? 'Generando reporte...' : report ? 'Regenerar reporte ↗' : 'Generar reporte con IA ↗'}
          </ThemedText>
        </TouchableOpacity>

        {report?.error && (
          <View style={[styles.infoCard, { backgroundColor:'#FAEEDA', borderColor:'#EF9F27' }]}>
            <ThemedText style={{ color:'#854F0B', fontSize:13 }}>
              No se pudo generar el reporte. Revisa tu conexión e intenta de nuevo.
            </ThemedText>
          </View>
        )}

        {report && !report.error && (() => {
          const { nivel_atencion } = report;
          const sc = nivel_atencion==='alto' ? '#A32D2D' : nivel_atencion==='medio' ? '#854F0B' : '#085041';
          const bg = nivel_atencion==='alto' ? '#FCEBEB' : nivel_atencion==='medio' ? '#FAEEDA' : '#E1F5EE';
          const bd = nivel_atencion==='alto' ? '#F09595' : nivel_atencion==='medio' ? '#EF9F27' : '#5DCAA5';
          const lb = nivel_atencion.charAt(0).toUpperCase() + nivel_atencion.slice(1);
          return (
            <>
              <View style={[styles.infoCard, { backgroundColor: bg, borderColor: bd }]}>
                <View style={styles.rowBetween}>
                  <ThemedText style={[styles.label, { color: sc }]}>Nivel de atención</ThemedText>
                  <View style={[styles.badge, { backgroundColor: bg, borderWidth:0.5, borderColor: bd }]}>
                    <ThemedText style={[styles.badgeTxt, { color: sc }]}>{lb}</ThemedText>
                  </View>
                </View>
                <ThemedText style={{ fontSize:13, color:'#1a1a1a' }}>{report.resumen}</ThemedText>
              </View>

              <View style={[styles.infoCard, { backgroundColor: inputBg, borderColor: colors.icon }]}>
                <ThemedText style={[styles.label, { color: colors.icon }]}>Patrón detectado</ThemedText>
                <ThemedText style={{ fontSize:13, color: colors.text }}>{report.patron}</ThemedText>
              </View>

              <View style={[styles.infoCard, { backgroundColor: inputBg, borderColor: colors.icon }]}>
                <ThemedText style={[styles.label, { color: colors.icon }]}>Recomendaciones</ThemedText>
                {report.recomendaciones.map((r: string, i: number) => (
                  <View key={i} style={[styles.rowStart, { marginBottom: 6 }]}>
                    <ThemedText style={{ color:'#1D9E75', marginRight:6 }}>→</ThemedText>
                    <ThemedText style={{ fontSize:13, color: colors.text, flex:1 }}>{r}</ThemedText>
                  </View>
                ))}
              </View>

              <View style={[styles.infoCard, { backgroundColor:'#E1F5EE', borderColor:'#9FE1CB' }]}>
                <ThemedText style={{ fontSize:13, color:'#085041', fontStyle:'italic' }}>
                  "{report.mensaje_aliento}"
                </ThemedText>
              </View>

              {(nivel_atencion === 'alto' || nivel_atencion === 'medio') && (
                <>
                  <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.icon, backgroundColor: inputBg }]}
                    onPress={() => setShowSvc(v => !v)}>
                    <ThemedText style={{ fontSize:14, color: colors.text }}>
                      {showSvc ? 'Ocultar servicios de salud' : 'Ver servicios de salud en Puebla ↗'}
                    </ThemedText>
                  </TouchableOpacity>
                  {showSvc && PUEBLA_SERVICES.map(svc => (
                    <View key={svc.name} style={[styles.histCard, { borderColor: svc.urgent ? '#F09595' : colors.icon,
                      backgroundColor: svc.urgent ? '#FCEBEB' : inputBg }]}>
                      <View style={styles.rowBetween}>
                        <ThemedText style={[styles.moodLabel, { fontWeight:'600',
                          color: svc.urgent ? '#A32D2D' : colors.text }]}>{svc.name}</ThemedText>
                        {svc.urgent && (
                          <View style={[styles.badge, { backgroundColor:'#A32D2D' }]}>
                            <ThemedText style={[styles.badgeTxt]}>Crisis</ThemedText>
                          </View>
                        )}
                      </View>
                      <ThemedText style={{ fontSize:12, color: colors.icon }}>{svc.type}</ThemedText>
                      <ThemedText style={{ fontSize:13, color:'#185FA5', fontWeight:'500' }}>{svc.phone}</ThemedText>
                    </View>
                  ))}
                </>
              )}
            </>
          );
        })()}
      </ScrollView>
    );
  }

  // ─── RENDER PRINCIPAL ───────────────────────────────────────────────────────
  const TABS: { id: Tab; icon: string; label: string }[] = [
    { id:'estado',    icon:'◎',  label:'Estado'    },
    { id:'cognitivo', icon:'◈',  label:'Cognitivo' },
    { id:'reporte',   icon:'▤',  label:'Reporte'   },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ flex: 1 }}>
        {activeTab === 'estado'    && renderEstado()}
        {activeTab === 'cognitivo' && renderCognitivo()}
        {activeTab === 'reporte'   && renderReporte()}
      </View>

      {/* Bottom tab bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.background, borderTopColor: colors.icon }]}>
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <TouchableOpacity key={tab.id} style={styles.tabItem}
              onPress={() => setActiveTab(tab.id)}>
              <ThemedText style={[styles.tabIcon, { color: active ? colors.tint : colors.icon }]}>
                {tab.icon}
              </ThemedText>
              <ThemedText style={[styles.tabLabel, { color: active ? colors.tint : colors.icon,
                fontWeight: active ? '600' : '400' }]}>
                {tab.label}
              </ThemedText>
              {active && <View style={[styles.tabDot, { backgroundColor: colors.tint }]} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:      { flex:1 },
  scroll:         { paddingHorizontal:20, paddingTop:20, paddingBottom:40 },
  screenTitle:    { fontSize:26, fontWeight:'bold', marginBottom:4 },
  subtitle:       { fontSize:13, marginBottom:18 },
  label:          { fontSize:14, fontWeight:'600', marginBottom:8 },
  disclaimer:     { fontSize:11, lineHeight:16, marginBottom:14 },
  sectionLabel:   { fontSize:12, fontWeight:'500', marginBottom:8 },
  backBtn:        { marginBottom:12 },
  backText:       { fontSize:16, fontWeight:'600' },

  rowBetween:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
  rowStart:       { flexDirection:'row', alignItems:'flex-start' },

  input:          { borderWidth:1, borderRadius:8, paddingHorizontal:15, paddingVertical:12, fontSize:16, marginBottom:4 },
  textArea:       { borderWidth:1, borderRadius:8, paddingHorizontal:15, paddingVertical:12, fontSize:16, textAlignVertical:'top', marginBottom:4 },

  primaryBtn:     { paddingVertical:14, borderRadius:8, alignItems:'center', marginTop:12, marginBottom:6 },
  primaryBtnTxt:  { fontSize:16, fontWeight:'600', color:'#fff' },
  secondaryBtn:   { paddingVertical:14, borderRadius:8, alignItems:'center', borderWidth:1, marginTop:6, marginBottom:6 },

  smallBtn:       { paddingHorizontal:16, paddingVertical:8, borderRadius:8 },
  smallBtnTxt:    { fontSize:14, fontWeight:'600', color:'#fff' },

  chips:          { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:8, marginTop:4 },

  badge:          { borderRadius:12, paddingHorizontal:10, paddingVertical:4 },
  badgeTxt:       { fontSize:12, fontWeight:'500', color:'#fff' },

  infoCard:       { borderWidth:0.5, borderRadius:12, padding:16, marginBottom:12 },
  histCard:       { flexDirection:'row', alignItems:'center', gap:12, borderWidth:0.5, borderRadius:10, padding:12, marginBottom:8 },

  moodGrid:       { flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom:18 },
  moodBtn:        { width:'48%', borderRadius:10, paddingVertical:16, alignItems:'center', gap:8 },
  moodEmoji:      { fontSize:26 },
  moodLabel:      { fontSize:13 },

  optBtn:         { padding:14, borderRadius:8, marginBottom:10 },

  wordCard:       { borderWidth:0.5, borderRadius:10, padding:16, alignItems:'center', marginBottom:10 },
  wordTxt:        { fontSize:20, fontWeight:'600', color:'#0C447C', letterSpacing:2 },

  centeredBlock:  { alignItems:'center', marginVertical:16 },
  bigNum:         { fontSize:44, fontWeight:'600' },

  resultBig:      { borderRadius:12, padding:24, alignItems:'center', marginBottom:12 },

  tabBar:         { flexDirection:'row', borderTopWidth:0.5, paddingBottom:Platform.OS==='ios'?8:0 },
  tabItem:        { flex:1, alignItems:'center', paddingTop:10, paddingBottom:6, position:'relative' },
  tabIcon:        { fontSize:16, marginBottom:2 },
  tabLabel:       { fontSize:10 },
  tabDot:         { position:'absolute', top:0, width:20, height:2, borderRadius:1 },
});