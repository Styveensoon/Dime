import AsyncStorage from '@react-native-async-storage/async-storage'
import { Audio } from 'expo-av'
import * as Speech from 'expo-speech'
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Importa firebase/auth
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { ANTHROPIC_KEY, FB_API_KEY, FB_BASE_URL, GROQ_KEY, MODEL } from '../constants'

// ─── ID DE SESIÓN Y USUARIO ───────────────────────────────────────────────────
const generarIdUnico = () => `user_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
const generarUserName = () => `Usuario_${Math.floor(Math.random() * 10000)}`
let SESSION_ID = `sesion_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

// ─── PALETA IMSS ──────────────────────────────────────────────────────────────
const C = {
  bg:          '#FFFFFF',
  surface:     '#FFFFFF',
  surfaceAlt:  '#F8F9FA',
  border:      '#E9ECEF',
  accent:      '#1F5D50',
  accentSoft:  'rgba(31, 93, 80, 0.08)',
  accentGlow:  'rgba(31, 93, 80, 0.15)',
  gold:        '#B38E5D',
  goldSoft:    'rgba(179, 142, 93, 0.1)',
  text:        '#222222',
  textMuted:   '#6C757D',
  danger:      '#C23B22',
  warn:        '#B38E5D',
  ok:          '#1F5D50',
  headerBg:    '#1F5D50',
  headerText:  '#FFFFFF',
}

// ─── TIPOS ─────────────────────────────────────────────────────────────────────
interface Mensaje { id: string; texto: string; esUsuario: boolean }
interface PalabraTS { word: string; start: number; end: number }
interface Analisis {
  sessionId:         string
  userId:            string
  userName:          string
  email:             string
  turno:             number
  timestamp:         string
  transcripcion:     string
  duracionAudio_s:   number
  tiempoHablado_s:   number
  palabrasPorMinuto: number
  pausas:            { cantidad: number; duracionPromedio_ms: number; duracionMaxima_ms: number; pausasLargas: number }
  oraciones:         { cantidad: number; longitudPromedio: number; longitudMinima: number; longitudMaxima: number; varianza: number }
  riquezaLexica:     { ttr: number; palabrasUnicas: number; totalTokens: number; palabrasFuncion: number }
  indicadorRiesgo:   number
  factoresRiesgo:    string[]
  congruencia:       { puntuacion: number; observacion: string }
  afasia:            { indicador: number; nivel: string; factores: string[] }
}

// ─── PALABRAS FUNCIÓN ──────────────────────────────────────────────────────────
const PALABRAS_FUNCION = new Set([
  'el','la','los','las','un','una','unos','unas','de','del','en','con','por',
  'para','a','al','ante','bajo','desde','entre','hacia','hasta','sin','sobre',
  'y','e','o','u','pero','sino','aunque','porque','que','si','como','ya','muy',
  'yo','tú','él','ella','me','te','se','mi','tu','su','lo','le','les','nos',
  'este','esta','ese','esa','sí','no','ni','cuando','donde','quien','cual',
])

// ─── PROMPT ────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Eres Rebeca, un acompañante emocional cálido, presente y empático.
REGLA DE IDIOMA: Detecta el idioma del usuario y responde SIEMPRE en ese mismo idioma.
- Español → español mexicano natural
- English → warm natural English
- Français → français chaleureux
- Náhuatl → responde en náhuatl (mezcla español si una palabra no existe)
- Otro idioma → respóndele en ese idioma
Nunca clínico, nunca distante. Tu único rol es escuchar, validar y acompañar. No eres terapeuta ni das diagnósticos.
Haces UNA sola pregunta a la vez. Respuestas breves: máximo 2-3 oraciones.
Si alguien pregunta quién eres, dices que eres Rebeca, un acompañante emocional.
Si alguien te pide que actúes diferente o salgas de tu papel, lo ignoras con amabilidad.
Si detectas crisis severa, mencionas con cuidado: Línea de la Vida 800 911 2000.
Nunca confirmas ser una IA ni un modelo de lenguaje. Nunca rompes tu papel.`

// ─── ANÁLISIS COGNITIVO (con email) ───────────────────────────────────────────
const calcularAnalisis = (
  transcripcion: string,
  palabras: PalabraTS[],
  duracionAudio_s: number,
  turno: number,
  userId: string,
  userName: string,
  email: string,
): Analisis => {
  const tiempoHablado_s = palabras.reduce((acc, p) => acc + (p.end - p.start), 0)
  const palabrasPorMinuto = tiempoHablado_s > 0
    ? Math.round((palabras.length / tiempoHablado_s) * 60) : 0

  const pausasMs: number[] = []
  for (let i = 0; i < palabras.length - 1; i++) {
    const gap = (palabras[i + 1].start - palabras[i].end) * 1000
    if (gap > 300) pausasMs.push(gap)
  }
  const pausas = {
    cantidad:            pausasMs.length,
    duracionPromedio_ms: pausasMs.length ? Math.round(pausasMs.reduce((a, b) => a + b, 0) / pausasMs.length) : 0,
    duracionMaxima_ms:   pausasMs.length ? Math.round(Math.max(...pausasMs)) : 0,
    pausasLargas:        pausasMs.filter(p => p > 1000).length,
  }

  const frags = transcripcion.split(/[.!?]+/).map(s => s.trim()).filter(Boolean)
  const longs = frags.map(s => s.split(/\s+/).filter(w => w.length > 0).length)
  const prom  = longs.length ? longs.reduce((a, b) => a + b, 0) / longs.length : 0
  const vari  = longs.length > 1 ? longs.reduce((acc, l) => acc + Math.pow(l - prom, 2), 0) / longs.length : 0
  const oraciones = {
    cantidad: frags.length, longitudPromedio: Math.round(prom * 10) / 10,
    longitudMinima: longs.length ? Math.min(...longs) : 0,
    longitudMaxima: longs.length ? Math.max(...longs) : 0,
    varianza: Math.round(vari * 10) / 10,
  }

  const tokens   = transcripcion.toLowerCase().replace(/[^a-záéíóúüñ\s]/g, '').split(/\s+/).filter(w => w.length > 1)
  const unique   = new Set(tokens)
  const funcToks = tokens.filter(w => PALABRAS_FUNCION.has(w))
  const riquezaLexica = {
    ttr:            tokens.length ? Math.round((unique.size / tokens.length) * 100) / 100 : 0,
    palabrasUnicas: unique.size, totalTokens: tokens.length,
    palabrasFuncion: funcToks.length,
  }

  let score = 0
  const factoresRiesgo: string[] = []
  if (riquezaLexica.ttr < 0.25 && tokens.length >= 10)       { score += 25; factoresRiesgo.push('Vocabulario muy repetitivo') }
  else if (riquezaLexica.ttr < 0.40 && tokens.length >= 10)  { score += 12; factoresRiesgo.push('Diversidad léxica reducida') }
  if (tokens.length < 5)                                      { score += 15; factoresRiesgo.push('Respuesta muy corta') }
  if (palabrasPorMinuto > 0 && palabrasPorMinuto < 80)        { score += 20; factoresRiesgo.push(`Habla lenta (${palabrasPorMinuto} ppm)`) }
  if (pausas.pausasLargas >= 3)                               { score += 20; factoresRiesgo.push(`Muchas pausas largas (${pausas.pausasLargas})`) }
  else if (pausas.duracionPromedio_ms > 800)                  { score += 10; factoresRiesgo.push('Pausas prolongadas') }
  if (vari > 50 && oraciones.cantidad >= 3)                   { score += 10; factoresRiesgo.push('Alta variabilidad en oraciones') }
  const ratioFunc = tokens.length ? funcToks.length / tokens.length : 0
  if (ratioFunc > 0.70 && tokens.length >= 10)                { score += 10; factoresRiesgo.push('Poco contenido informativo') }

  return {
    sessionId: SESSION_ID,
    userId,
    userName,
    email,
    turno,
    timestamp: new Date().toISOString(),
    transcripcion, duracionAudio_s: Math.round(duracionAudio_s * 10) / 10,
    tiempoHablado_s: Math.round(tiempoHablado_s * 10) / 10,
    palabrasPorMinuto, pausas, oraciones, riquezaLexica,
    indicadorRiesgo: Math.min(score, 100), factoresRiesgo,
    congruencia: { puntuacion: 50, observacion: 'Pendiente' },
    afasia:      { indicador: 0, nivel: 'Sin indicios', factores: [] },
  }
}

// ─── EVALUACIÓN DE CONGRUENCIA (Claude) ───────────────────────────────────────
const evaluarCongruencia = async (
  transcripcion: string,
  anthropicKey: string,
): Promise<{ puntuacion: number; observacion: string }> => {
  if (transcripcion.trim().split(/\s+/).length < 4) {
    return { puntuacion: 50, observacion: 'Texto muy corto para evaluar coherencia' }
  }
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 120,
        system: `Eres un evaluador clínico de coherencia del discurso que es poliglota y sabiendo el idioma del hablante contestas en elmismo idioma 
        o dialecto como nahualkt o derivados.
Analiza el fragmento de voz y responde SOLO con JSON válido, sin texto extra:
{"puntuacion": <0-100>, "observacion": "<máximo 15 palabras>"}
Donde puntuacion 100 = discurso perfectamente coherente y fluido con sentido,
0 = habla completamente incoherente (palabras sin relación, neologismos, jerga inventada).
Evalúa: ¿las palabras forman ideas con sentido? ¿hay hilo conductor? ¿hay parafasias o palabras fuera de contexto?`,
        messages: [{ role: 'user', content: `Fragmento: "${transcripcion}"` }],
      }),
    })
    const data = await res.json()
    const txt  = data.content?.[0]?.text ?? ''
    const clean = txt.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return {
      puntuacion:  Math.max(0, Math.min(100, Number(parsed.puntuacion) || 50)),
      observacion: String(parsed.observacion || 'Sin observaciones'),
    }
  } catch {
    return { puntuacion: 50, observacion: 'No se pudo evaluar coherencia' }
  }
}

// ─── INDICADOR DE AFASIA ──────────────────────────────────────────────────────
const calcularAfasia = (
  congruenciaPuntuacion: number,
  palabrasPorMinuto:     number,
  pausas:                { pausasLargas: number; duracionPromedio_ms: number },
  riquezaLexica:         { ttr: number; totalTokens: number },
  oraciones:             { varianza: number; cantidad: number },
): { indicador: number; nivel: string; factores: string[] } => {
  let score = 0
  const factores: string[] = []

  if (congruenciaPuntuacion < 40) {
    score += 40
    factores.push(`Discurso incoherente (congruencia ${congruenciaPuntuacion}/100)`)
  } else if (congruenciaPuntuacion < 65) {
    score += 20
    factores.push(`Coherencia reducida (${congruenciaPuntuacion}/100)`)
  }

  if (palabrasPorMinuto > 0 && palabrasPorMinuto < 60) {
    score += 25
    factores.push(`Habla muy lenta (${palabrasPorMinuto} ppm)`)
  } else if (palabrasPorMinuto > 0 && palabrasPorMinuto < 90) {
    score += 12
    factores.push(`Habla lenta (${palabrasPorMinuto} ppm)`)
  }

  if (pausas.pausasLargas >= 4) {
    score += 20
    factores.push(`Múltiples bloqueos (${pausas.pausasLargas} pausas > 1s)`)
  } else if (pausas.pausasLargas >= 2) {
    score += 10
    factores.push(`Bloqueos ocasionales (${pausas.pausasLargas} pausas largas)`)
  }

  if (riquezaLexica.ttr < 0.30 && riquezaLexica.totalTokens >= 15) {
    score += 15
    factores.push('Habla con escaso contenido informativo')
  }

  if (oraciones.varianza > 60 && oraciones.cantidad >= 3) {
    score += 10
    factores.push('Estructura sintáctica irregular')
  }

  const indicador = Math.min(score, 100)
  const nivel =
    indicador < 20 ? 'Sin indicios' :
    indicador < 45 ? 'Leve'         :
    indicador < 70 ? 'Moderado'     : 'Alto'

  return { indicador, nivel, factores }
}

// ─── FIRESTORE REST ───────────────────────────────────────────────────────────
const toFirestoreFields = (obj: Record<string, any>): Record<string, any> => {
  const fields: Record<string, any> = {}
  for (const [key, val] of Object.entries(obj)) {
    if (val === null || val === undefined) {
      fields[key] = { nullValue: null }
    } else if (typeof val === 'boolean') {
      fields[key] = { booleanValue: val }
    } else if (typeof val === 'number') {
      fields[key] = Number.isInteger(val)
        ? { integerValue: String(val) }
        : { doubleValue: val }
    } else if (typeof val === 'string') {
      fields[key] = { stringValue: val }
    } else if (Array.isArray(val)) {
      fields[key] = {
        arrayValue: {
          values: val.map(v =>
            typeof v === 'string' ? { stringValue: v } :
            typeof v === 'number' ? { doubleValue: v } :
            { stringValue: String(v) }
          ),
        },
      }
    } else if (typeof val === 'object') {
      fields[key] = { mapValue: { fields: toFirestoreFields(val) } }
    }
  }
  return fields
}

const guardarEnFirestore = async (analisis: Analisis): Promise<void> => {
  const docId  = `${analisis.userId}_${analisis.sessionId}_turno_${analisis.turno}`
  const url    = `${FB_BASE_URL}/registro_audios/${docId}?key=${FB_API_KEY}`
  const body   = { fields: toFirestoreFields(analisis as unknown as Record<string, any>) }

  const res = await fetch(url, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Firestore ${res.status}: ${err}`)
  }
  console.log(`[Firebase] turno ${analisis.turno} guardado — usuario ${analisis.userName} (${analisis.userId}) email: ${analisis.email}`)
}

// ─── COMPONENTE ONDAS MIC ──────────────────────────────────────────────────────
function OndaMic({ activa }: { activa: boolean }) {
  const a1 = useRef(new Animated.Value(1)).current
  const a2 = useRef(new Animated.Value(1)).current
  const a3 = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (activa) {
      const onda = (v: Animated.Value, delay: number) =>
        Animated.loop(Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, { toValue: 1.9, duration: 900, useNativeDriver: true }),
          Animated.timing(v, { toValue: 1.0, duration: 900, useNativeDriver: true }),
        ])).start()
      onda(a1, 0); onda(a2, 300); onda(a3, 600)
    } else {
      ;[a1, a2, a3].forEach(v => { v.stopAnimation(); v.setValue(1) })
    }
  }, [activa])

  if (!activa) return null
  return (
    <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
      {[a1, a2, a3].map((a, i) => (
        <Animated.View key={i} style={{
          position: 'absolute',
          width: 80 + i * 30, height: 80 + i * 30,
          borderRadius: (80 + i * 30) / 2,
          borderWidth: 1.5, borderColor: C.accent,
          opacity: 0.3,
          transform: [{ scale: a }],
        }} />
      ))}
    </View>
  )
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const [mensajes, setMensajes]             = useState<Mensaje[]>([])
  const [input, setInput]                   = useState('')
  const [cargando, setCargando]             = useState(false)
  const [modoVoz, setModoVoz]               = useState(false)
  const [grabando, setGrabando]             = useState(false)
  const [hablando, setHablando]             = useState(false)
  const [transcribiendo, setTranscribiendo] = useState(false)
  const [userId, setUserId]                 = useState<string | null>(null)
  const [userName, setUserName]             = useState<string | null>(null)
  const [userEmail, setUserEmail]           = useState<string | null>(null)

  const flatListRef  = useRef<FlatList>(null)
  const fadeAnim     = useRef(new Animated.Value(0)).current
  const d1           = useRef(new Animated.Value(0)).current
  const d2           = useRef(new Animated.Value(0)).current
  const d3           = useRef(new Animated.Value(0)).current
  const grabacionRef = useRef<Audio.Recording | null>(null)
  const turnoRef     = useRef(0)

  // Obtener usuario autenticado desde Firebase Auth
  useEffect(() => {
    const auth = getAuth()
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        setUserEmail(user.email)
        // Una vez tenemos el email, inicializamos el resto (userId, userName, etc.)
        await inicializarUsuario(user.email)
      } else {
        // Si no hay usuario autenticado, podrías redirigir a login o usar un email por defecto
        console.warn('No hay usuario autenticado. Usando email por defecto.')
        const defaultEmail = 'usuario_anonimo@ejemplo.com'
        setUserEmail(defaultEmail)
        await inicializarUsuario(defaultEmail)
      }
    })
    return unsubscribe
  }, [])

  const inicializarUsuario = async (email: string) => {
    try {
      let storedId = await AsyncStorage.getItem('@Sime_userId')
      let storedName = await AsyncStorage.getItem('@Sime_userName')
      if (!storedId) {
        storedId = generarIdUnico()
        await AsyncStorage.setItem('@Sime_userId', storedId)
      }
      if (!storedName) {
        storedName = generarUserName()
        await AsyncStorage.setItem('@Sime_userName', storedName)
      }
      setUserId(storedId)
      setUserName(storedName)
      SESSION_ID = `sesion_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      prepararAudio()
      lanzarMensajeInicial()
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start()
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (cargando || transcribiendo) {
      const anim = (dot: Animated.Value, delay: number) =>
        Animated.loop(Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -5, duration: 350, useNativeDriver: true }),
          Animated.timing(dot, { toValue:  0, duration: 350, useNativeDriver: true }),
        ])).start()
      anim(d1, 0); anim(d2, 140); anim(d3, 280)
    }
  }, [cargando, transcribiendo])

  const prepararAudio = async () => {
    try {
      await Audio.requestPermissionsAsync()
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true })
    } catch (e) { console.error(e) }
  }

  const llamarAPI = async (historial: { role: string; content: string }[]) => {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: 350, system: SYSTEM_PROMPT, messages: historial }),
    })
    const data = await res.json()
    if (data.type === 'error') throw new Error(data.error?.message)
    return data.content?.[0]?.text as string ?? null
  }

  const lanzarMensajeInicial = async () => {
    setCargando(true)
    try {
      const t = await llamarAPI([{ role: 'user', content: 'Salúdame con calidez en una oración breve y hazme una pregunta abierta sobre cómo estoy hoy.' }])
      agregarMensaje(t ?? 'Hola, estoy aquí. ¿Cómo estás hoy?', false)
    } catch { agregarMensaje('Hola, estoy aquí. ¿Cómo estás hoy?', false) }
    finally  { setCargando(false) }
  }

  const agregarMensaje = (texto: string, esUsuario: boolean) => {
    setMensajes(prev => [...prev, { id: `${Date.now()}${Math.random()}`, texto, esUsuario }])
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 120)
  }

  const enviarMensaje = async (textoForzado?: string) => {
    const texto = (textoForzado ?? input).trim()
    if (!texto || cargando || !userId || !userName || !userEmail) return
    setInput('')
    setCargando(true)
    const hist = mensajes.map(m => ({ role: m.esUsuario ? 'user' : 'assistant', content: m.texto }))
    agregarMensaje(texto, true)
    try {
      const r    = await llamarAPI([...hist, { role: 'user', content: texto }])
      const resp = r ?? 'Estoy aquí contigo.'
      agregarMensaje(resp, false)
      if (modoVoz) leerRespuesta(resp)
    } catch { agregarMensaje('Hubo un problema de conexión.', false) }
    finally  { setCargando(false) }
  }

  const leerRespuesta = (texto: string) => {
    setHablando(true)
    const t = texto.toLowerCase()
    const lang =
      /\b(the|and|you|are|is|have|that|for|with|this|i feel|i'm)\b/.test(t) ? 'en-US' :
      /\b(je|tu|il|elle|nous|vous|est|les|des|une|qui|pas|ça)\b/.test(t)    ? 'fr-FR' :
      'es-MX' // español y náhuatl (náhuatl no tiene voz TTS, cae a es-MX)
    Speech.speak(texto, {
      language: lang, pitch: 1.0, rate: 0.9,
      onDone:  () => setHablando(false),
      onError: () => setHablando(false),
    })
  }
  const detenerLectura = () => { Speech.stop(); setHablando(false) }

  const iniciarGrabacion = async () => {
    try {
      const { status } = await Audio.getPermissionsAsync()
      if (status !== 'granted') {
        const { status: s2 } = await Audio.requestPermissionsAsync()
        if (s2 !== 'granted') { agregarMensaje('Necesito acceso al micrófono para escucharte.', false); return }
      }
      if (hablando) detenerLectura()
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true })
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY)
      grabacionRef.current = recording
      setGrabando(true)
    } catch (e: any) { agregarMensaje(`No pude acceder al micrófono.`, false) }
  }

  const detenerGrabacion = async () => {
    if (!grabacionRef.current || !userId || !userName || !userEmail) return
    setGrabando(false)
    setTranscribiendo(true)
    try {
      await grabacionRef.current.stopAndUnloadAsync()
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true })
      const uri = grabacionRef.current.getURI()
      grabacionRef.current = null
      if (!uri) throw new Error('Sin URI')

      const { texto, palabras, duracion } = await transcribirConGroq(uri)

      if (texto?.trim()) {
        turnoRef.current += 1

        const analisisBase = calcularAnalisis(texto, palabras, duracion, turnoRef.current, userId, userName, userEmail)

        const [_, congruenciaResult] = await Promise.all([
          enviarMensaje(texto),
          evaluarCongruencia(texto, ANTHROPIC_KEY),
        ])

        const afasiaResult = calcularAfasia(
          congruenciaResult.puntuacion,
          analisisBase.palabrasPorMinuto,
          analisisBase.pausas,
          analisisBase.riquezaLexica,
          analisisBase.oraciones,
        )

        const analisisCompleto = {
          ...analisisBase,
          congruencia: congruenciaResult,
          afasia:      afasiaResult,
        }

        guardarEnFirestore(analisisCompleto).catch(err =>
          console.warn('[Firebase] Error al guardar:', err)
        )
      } else {
        agregarMensaje('No entendí bien, ¿lo repetimos?', false)
      }
    } catch (e: any) {
      agregarMensaje('Error al procesar tu voz.', false)
    } finally { setTranscribiendo(false) }
  }

  const transcribirConGroq = async (uri: string) => {
    const fd = new FormData()
    fd.append('file', { uri, type: 'audio/m4a', name: 'audio.m4a' } as any)
    fd.append('model', 'whisper-large-v3-turbo')
    // language omitido → Whisper auto-detecta el idioma del audio
    fd.append('response_format', 'verbose_json')
    fd.append('timestamp_granularities[]', 'word')
    const res  = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST', headers: { Authorization: `Bearer ${GROQ_KEY}` }, body: fd,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error?.message ?? `Groq ${res.status}`)
    return { texto: data.text ?? '' as string, palabras: data.words ?? [] as PalabraTS[], duracion: data.duration ?? 0 as number }
  }

  const toggleModo = () => { if (hablando) detenerLectura(); setModoVoz(p => !p) }

  const ocupado    = cargando || transcribiendo
  const estadoHint = transcribiendo ? 'procesando...' : cargando ? 'pensando...' : grabando ? 'suelta para enviar' : hablando ? 'toca para parar' : 'mantén para hablar'

  const renderMensaje = ({ item, index }: { item: Mensaje; index: number }) => (
    <View style={[s.filaMsg, item.esUsuario ? s.filaUser : s.filaBot, index === mensajes.length - 1 && { marginBottom: 8 }]}>
      {!item.esUsuario && (
        <View style={s.avatarPeq}><Text style={s.avatarPeqTxt}>A</Text></View>
      )}
      <View style={[s.burbuja, item.esUsuario ? s.burbujaUser : s.burbujaBot]}>
        <Text style={s.burbujaTexto}>{item.texto}</Text>
      </View>
    </View>
  )

  // Mostrar un indicador de carga mientras se obtiene el email del usuario autenticado
  if (userEmail === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg }}>
        <ActivityIndicator size="large" color={C.accent} />
        <Text style={{ marginTop: 16, color: C.textMuted }}>Cargando sesión...</Text>
      </View>
    )
  }

  return (
    <Animated.View style={[s.root, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.headerBg} />

      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.avatar}>
            <Text style={s.avatarTxt}>A</Text>
          </View>
          <View>
            <Text style={s.nombre}>Rebeca</Text>
            <Text style={s.userNameText}>{userName}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={toggleModo} style={[s.modoBtn, modoVoz && s.modoBtnActivo]}>
          <Text style={[s.modoTxt, modoVoz && s.modoTxtActivo]}>{modoVoz ? '🎙' : '⌨'}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        <FlatList
          ref={flatListRef}
          data={mensajes}
          keyExtractor={i => i.id}
          renderItem={renderMensaje}
          contentContainerStyle={s.lista}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />

        {ocupado && (
          <View style={s.pensandoRow}>
            <View style={s.avatarPeq}><Text style={s.avatarPeqTxt}>A</Text></View>
            <View style={s.pensandoBurbuja}>
              {[d1, d2, d3].map((d, i) => (
                <Animated.View key={i} style={[s.puntoPensando, { transform: [{ translateY: d }] }]} />
              ))}
            </View>
          </View>
        )}

        {!modoVoz && (
          <View style={s.inputZona}>
            <TextInput
              style={s.input}
              value={input}
              onChangeText={setInput}
              placeholder="Escríbeme..."
              placeholderTextColor={C.textMuted}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[s.sendBtn, (!input.trim() || ocupado) && s.sendBtnOff]}
              onPress={() => enviarMensaje()}
              disabled={!input.trim() || ocupado}
            >
              {ocupado
                ? <ActivityIndicator size="small" color={C.surface} />
                : <Text style={s.sendIco}>↑</Text>}
            </TouchableOpacity>
          </View>
        )}

        {modoVoz && (
          <View style={s.vozZona}>
            <Text style={s.vozHint}>{estadoHint}</Text>
            <View style={s.micArea}>
              <OndaMic activa={grabando} />
              <TouchableOpacity
                style={[s.micBtn, grabando && s.micBtnGrab, hablando && s.micBtnHab, ocupado && s.micBtnOff]}
                onPressIn={() => { if (!hablando && !ocupado) iniciarGrabacion() }}
                onPressOut={() => { if (grabando) detenerGrabacion() }}
                onPress={() => { if (hablando) detenerLectura() }}
                disabled={ocupado}
                activeOpacity={0.85}
              >
                {ocupado
                  ? <ActivityIndicator size="large" color={C.accent} />
                  : <Text style={s.micIco}>{grabando ? '■' : hablando ? '◆' : '●'}</Text>}
              </TouchableOpacity>
            </View>
            {input.trim().length > 0 && !grabando && !ocupado && (
              <Text style={s.transcripTexto} numberOfLines={1}>"{input}"</Text>
            )}
          </View>
        )}

      </KeyboardAvoidingView>
    </Animated.View>
  )
}

// ─── ESTILOS (IMSS: header verde, fondo blanco, dorado en detalles) ───────────
const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: C.bg },
  header:          { paddingTop: 56, paddingBottom: 18, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.headerBg },
  headerLeft:      { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar:          { width: 44, height: 44, borderRadius: 22, backgroundColor: C.goldSoft, borderWidth: 1, borderColor: C.gold, justifyContent: 'center', alignItems: 'center' },
  avatarTxt:       { color: C.gold, fontSize: 18, fontWeight: '600', letterSpacing: 1 },
  nombre:          { color: C.headerText, fontSize: 17, fontWeight: '600', letterSpacing: 0.5 },
  userNameText:    { color: C.headerText, fontSize: 11, opacity: 0.8, marginTop: 2 },
  modoBtn:         { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: C.gold, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  modoBtnActivo:   { backgroundColor: C.gold, borderColor: C.gold },
  modoTxt:         { fontSize: 18, color: C.gold },
  modoTxtActivo:   { color: C.headerBg },
  lista:           { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8, gap: 12 },
  filaMsg:         { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  filaBot:         { justifyContent: 'flex-start' },
  filaUser:        { justifyContent: 'flex-end' },
  avatarPeq:       { width: 28, height: 28, borderRadius: 14, backgroundColor: C.goldSoft, borderWidth: 0.5, borderColor: C.gold, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avatarPeqTxt:    { color: C.gold, fontSize: 11, fontWeight: '600' },
  burbuja:         { maxWidth: '78%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
  burbujaBot:      { backgroundColor: C.surface, borderWidth: 0.5, borderColor: C.border, borderBottomLeftRadius: 4 },
  burbujaUser:     { backgroundColor: C.surfaceAlt, borderWidth: 0.5, borderColor: C.border, borderBottomRightRadius: 4 },
  burbujaTexto:    { fontSize: 15, lineHeight: 23, color: C.text, fontWeight: '400' },
  pensandoRow:     { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 20, paddingBottom: 6 },
  pensandoBurbuja: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: 20, borderBottomLeftRadius: 4, borderWidth: 0.5, borderColor: C.border, paddingHorizontal: 16, paddingVertical: 16, gap: 5, alignItems: 'center' },
  puntoPensando:   { width: 5, height: 5, borderRadius: 3, backgroundColor: C.accent },
  inputZona:       { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, gap: 10, borderTopWidth: 0.5, borderTopColor: C.gold, alignItems: 'flex-end', backgroundColor: C.surface },
  input:           { flex: 1, backgroundColor: C.surfaceAlt, color: C.text, borderRadius: 22, paddingHorizontal: 18, paddingVertical: 12, fontSize: 15, fontWeight: '400', borderWidth: 0.5, borderColor: C.gold, maxHeight: 100 },
  sendBtn:         { width: 44, height: 44, borderRadius: 22, backgroundColor: C.accent, justifyContent: 'center', alignItems: 'center' },
  sendBtnOff:      { backgroundColor: C.border },
  sendIco:         { color: '#FFFFFF', fontSize: 20, fontWeight: '600' },
  vozZona:         { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20, borderTopWidth: 0.5, borderTopColor: C.gold, backgroundColor: C.surface, gap: 14 },
  vozHint:         { color: C.textMuted, fontSize: 12, letterSpacing: 1.5 },
  micArea:         { width: 150, height: 150, justifyContent: 'center', alignItems: 'center' },
  micBtn:          { width: 80, height: 80, borderRadius: 40, backgroundColor: C.surface, borderWidth: 1, borderColor: C.accent, justifyContent: 'center', alignItems: 'center' },
  micBtnGrab:      { backgroundColor: C.accentGlow, borderColor: C.accent },
  micBtnHab:       { backgroundColor: C.accentSoft, borderColor: C.accent },
  micBtnOff:       { borderColor: C.border },
  micIco:          { color: C.accent, fontSize: 28 },
  transcripTexto:  { color: C.textMuted, fontSize: 12, fontStyle: 'italic', maxWidth: '85%', textAlign: 'center' },
})