import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// ─── CLAVES ────────────────────────────────────────────────────────────────────
const apiKey_antropic= process.env.CLAUDE_APY_KEY;
const apiKey_groq = process.env.GROQ_APY_KEY;

const ANTHROPIC_KEY    = apiKey_antropic
const GROQ_KEY         = apiKey_groq
const MODEL            = 'claude-haiku-4-5-20251001'

// ElevenLabs → https://elevenlabs.io (free tier: 10k chars/mes)
// Voz recomendada: "Valentina" (ID abajo) — Latina, cálida, natural en español
// Puedes cambiarla desde: https://elevenlabs.io/voice-library → busca "Spanish"
const ELEVENLABS_KEY   = 'TU_ELEVENLABS_KEY_AQUI'
const ELEVENLABS_VOICE = 'pqHfZKP75CvOlQylNhV4'  // "Bill" en multilingual v2, neutro y cálido
// Alternativas buenas en español:
//   XB0fDUnXU5powFXDhCwa → Charlotte (femenina, cálida)
//   IKne3meq5aSn9XLyUdCD → Charlie (masculina, amigable)
//   cgSgspJ2msm6clMCkdW9 → Jessica (femenina, expresiva)

// Firebase → https://console.firebase.google.com → Proyecto → Configuración → API Key
const FIREBASE_PROJECT = 'TU_PROYECTO_FIREBASE_ID'
const FIREBASE_API_KEY = 'TU_FIREBASE_WEB_API_KEY'

// ID único por sesión de app
const SESSION_ID = `sesion_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

// ─── COLORES ───────────────────────────────────────────────────────────────────
const COLORS = {
  fondo:           '#FFFFFF',
  verde:           '#4A5C3A',
  verdeOscuro:     '#2F3D24',
  magenta:         '#7B2D4E',
  gris:            '#F5F5F5',
  grisBorde:       '#E0E0E0',
  negro:           '#111111',
  textoSecundario: '#888888',
  rojo:            '#C0392B',
  amarillo:        '#F39C12',
}

// ─── TIPOS ─────────────────────────────────────────────────────────────────────
interface Mensaje {
  id: string
  texto: string
  esUsuario: boolean
}

// Datos de palabra con timestamps de Groq verbose_json
interface PalabraTimestamp {
  word: string
  start: number  // segundos
  end: number    // segundos
}

// Resultado completo del análisis cognitivo por turno
interface AnalisisCognitivo {
  sessionId: string
  turno: number
  timestamp: string          // ISO 8601
  transcripcion: string

  // Cadencia
  duracionAudio_s: number    // duración total del audio
  tiempoHablado_s: number    // tiempo real con voz (sin silencios)
  palabrasPorMinuto: number  // velocidad del habla

  // Pausas
  pausas: {
    cantidad: number           // # de pausas > 300ms
    duracionPromedio_ms: number
    duracionMaxima_ms: number
    pausasLargas: number       // pausas > 1s (más relevantes clínicamente)
  }

  // Longitud y coherencia de enunciados
  oraciones: {
    cantidad: number
    longitudPromedio: number   // palabras por oración
    longitudMinima: number
    longitudMaxima: number
    varianza: number           // alta varianza puede indicar desorganización
  }

  // Riqueza léxica (TTR = Type-Token Ratio)
  riquezaLexica: {
    ttr: number                // 0–1: palabras únicas / total. <0.4 = vocabulario repetitivo
    palabrasUnicas: number
    totalTokens: number
    palabrasFuncion: number    // artículos, preposiciones — ratio alto = discurso vacío
  }

  // Indicador de riesgo compuesto (0–100). NO es diagnóstico.
  indicadorRiesgo: number
  factoresRiesgo: string[]   // qué métricas activaron alerta
}

// ─── SISTEMA PROMPT ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Eres Dime, un asistente de acompañamiento emocional cálido, empático y profesional.
Hablas en español mexicano de manera natural y cercana, nunca clínica ni fría.
Tu objetivo es escuchar activamente, validar emociones y acompañar al usuario.
Haces una pregunta a la vez, nunca abrumas con múltiples preguntas.
Si detectas señales de crisis severa, con cuidado sugieres línea de crisis: 800 290 0024 IMSS.
Nunca haces diagnósticos. Eres compañía, no terapeuta.
Responde siempre de forma concisa, máximo 3 oraciones.`

// ─── HELPERS: ANÁLISIS COGNITIVO ──────────────────────────────────────────────

/**
 * Palabras de función en español (artículos, preposiciones, conjunciones, pronombres comunes).
 * Un ratio alto de estas vs. palabras de contenido puede indicar discurso "vacío".
 */
const PALABRAS_FUNCION = new Set([
  'el','la','los','las','un','una','unos','unas',
  'de','del','en','con','por','para','a','al','ante','bajo','desde',
  'entre','hacia','hasta','mediante','según','sin','sobre','tras',
  'y','e','o','u','pero','sino','aunque','porque','que','si','como',
  'yo','tú','él','ella','nosotros','ellos','ellas','me','te','se',
  'mi','tu','su','mis','tus','sus','lo','le','les','nos',
  'este','esta','estos','estas','ese','esa','aquel','aquella',
  'ya','muy','más','menos','bien','mal','también','tampoco',
  'sí','no','ni','cuando','donde','quien','cual',
])

/**
 * Calcula métricas cognitivas a partir de la transcripción y los timestamps de Groq.
 */
const calcularAnalisis = (
  transcripcion: string,
  palabras: PalabraTimestamp[],
  duracionAudio_s: number,
  turno: number,
): AnalisisCognitivo => {

  // ── Cadencia ─────────────────────────────────────────────────────────────────
  const tiempoHablado_s = palabras.length > 0
    ? palabras.reduce((acc, p) => acc + (p.end - p.start), 0)
    : 0

  const palabrasPorMinuto = tiempoHablado_s > 0
    ? Math.round((palabras.length / tiempoHablado_s) * 60)
    : 0

  // ── Pausas ────────────────────────────────────────────────────────────────────
  const UMBRAL_PAUSA_MS = 300
  const pausasMedidas: number[] = []

  for (let i = 0; i < palabras.length - 1; i++) {
    const gap = (palabras[i + 1].start - palabras[i].end) * 1000  // a ms
    if (gap > UMBRAL_PAUSA_MS) pausasMedidas.push(gap)
  }

  const pausas = {
    cantidad: pausasMedidas.length,
    duracionPromedio_ms: pausasMedidas.length > 0
      ? Math.round(pausasMedidas.reduce((a, b) => a + b, 0) / pausasMedidas.length)
      : 0,
    duracionMaxima_ms: pausasMedidas.length > 0
      ? Math.round(Math.max(...pausasMedidas))
      : 0,
    pausasLargas: pausasMedidas.filter(p => p > 1000).length,
  }

  // ── Oraciones ─────────────────────────────────────────────────────────────────
  const fragmentosOracion = transcripcion
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)

  const longitudesOracion = fragmentosOracion.map(s =>
    s.split(/\s+/).filter(w => w.length > 0).length
  )

  const promedioOracion = longitudesOracion.length > 0
    ? longitudesOracion.reduce((a, b) => a + b, 0) / longitudesOracion.length
    : 0

  const varianzaOracion = longitudesOracion.length > 1
    ? longitudesOracion.reduce((acc, l) => acc + Math.pow(l - promedioOracion, 2), 0) / longitudesOracion.length
    : 0

  const oraciones = {
    cantidad: fragmentosOracion.length,
    longitudPromedio: Math.round(promedioOracion * 10) / 10,
    longitudMinima: longitudesOracion.length > 0 ? Math.min(...longitudesOracion) : 0,
    longitudMaxima: longitudesOracion.length > 0 ? Math.max(...longitudesOracion) : 0,
    varianza: Math.round(varianzaOracion * 10) / 10,
  }

  // ── Riqueza léxica ────────────────────────────────────────────────────────────
  const tokens = transcripcion
    .toLowerCase()
    .replace(/[^a-záéíóúüñ\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 1)

  const uniqueTokens = new Set(tokens)
  const tokensF = tokens.filter(w => PALABRAS_FUNCION.has(w))

  const riquezaLexica = {
    ttr: tokens.length > 0 ? Math.round((uniqueTokens.size / tokens.length) * 100) / 100 : 0,
    palabrasUnicas: uniqueTokens.size,
    totalTokens: tokens.length,
    palabrasFuncion: tokensF.length,
  }

  // ── Indicador de riesgo (0–100) ───────────────────────────────────────────────
  // IMPORTANTE: Este score es PRELIMINAR y de MONITOREO, no diagnóstico clínico.
  let score = 0
  const factoresRiesgo: string[] = []

  // TTR bajo → vocabulario repetitivo o pobre
  if (riquezaLexica.ttr < 0.25 && tokens.length >= 10) {
    score += 25
    factoresRiesgo.push('Vocabulario repetitivo (TTR < 0.25)')
  } else if (riquezaLexica.ttr < 0.40 && tokens.length >= 10) {
    score += 12
    factoresRiesgo.push('Diversidad léxica reducida (TTR < 0.40)')
  }

  // Pocas palabras → respuesta muy escueta
  if (tokens.length < 5) {
    score += 15
    factoresRiesgo.push('Respuesta muy corta (<5 palabras)')
  }

  // Velocidad del habla: <80 wpm puede indicar dificultad
  if (palabrasPorMinuto > 0 && palabrasPorMinuto < 80) {
    score += 20
    factoresRiesgo.push(`Velocidad del habla lenta (${palabrasPorMinuto} ppm)`)
  }

  // Pausas largas frecuentes
  if (pausas.pausasLargas >= 3) {
    score += 20
    factoresRiesgo.push(`Múltiples pausas largas (${pausas.pausasLargas} pausas >1s)`)
  } else if (pausas.duracionPromedio_ms > 800) {
    score += 10
    factoresRiesgo.push('Pausas de duración elevada en promedio')
  }

  // Alta varianza en longitud de oraciones → desorganización del discurso
  if (varianzaOracion > 50 && oraciones.cantidad >= 3) {
    score += 10
    factoresRiesgo.push('Alta variabilidad en longitud de oraciones')
  }

  // Ratio de palabras de función muy alto → discurso con poco contenido
  const ratioFuncion = tokens.length > 0 ? tokensF.length / tokens.length : 0
  if (ratioFuncion > 0.70 && tokens.length >= 10) {
    score += 10
    factoresRiesgo.push('Ratio elevado de palabras de función (discurso poco informativo)')
  }

  return {
    sessionId: SESSION_ID,
    turno,
    timestamp: new Date().toISOString(),
    transcripcion,
    duracionAudio_s: Math.round(duracionAudio_s * 10) / 10,
    tiempoHablado_s: Math.round(tiempoHablado_s * 10) / 10,
    palabrasPorMinuto,
    pausas,
    oraciones,
    riquezaLexica,
    indicadorRiesgo: Math.min(score, 100),
    factoresRiesgo,
  }
}

// ─── HELPERS: FIREBASE FIRESTORE REST ─────────────────────────────────────────

/** Convierte un valor JS a formato Firestore REST */
const toFirestoreValue = (val: unknown): object => {
  if (val === null || val === undefined) return { nullValue: null }
  if (typeof val === 'boolean')          return { booleanValue: val }
  if (typeof val === 'string')           return { stringValue: val }
  if (typeof val === 'number') {
    return Number.isInteger(val)
      ? { integerValue: String(val) }
      : { doubleValue: val }
  }
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } }
  }
  if (typeof val === 'object') {
    const fields: Record<string, object> = {}
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      fields[k] = toFirestoreValue(v)
    }
    return { mapValue: { fields } }
  }
  return { stringValue: String(val) }
}

/** Convierte un objeto plano a documento Firestore */
const toFirestoreDoc = (obj: Record<string, unknown>) => {
  const fields: Record<string, object> = {}
  for (const [k, v] of Object.entries(obj)) {
    fields[k] = toFirestoreValue(v)
  }
  return { fields }
}

/**
 * Guarda el análisis en Firestore vía REST API.
 * Colección: sesiones/{SESSION_ID}/turnos/{turno}
 */
const guardarEnFirebase = async (analisis: AnalisisCognitivo): Promise<void> => {
  if (!FIREBASE_PROJECT || FIREBASE_PROJECT === 'TU_PROYECTO_FIREBASE_ID') {
    console.log('[Firebase] No configurado — análisis:', JSON.stringify(analisis, null, 2))
    return
  }

  const url = [
    `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}`,
    `/databases/(default)/documents/sesiones/${analisis.sessionId}`,
    `/turnos?documentId=turno_${analisis.turno}&key=${FIREBASE_API_KEY}`,
  ].join('')

  const body = JSON.stringify(toFirestoreDoc(analisis as unknown as Record<string, unknown>))

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Firebase error ${res.status}: ${err}`)
  }

  console.log(`[Firebase] Turno ${analisis.turno} guardado — riesgo: ${analisis.indicadorRiesgo}/100`)
}

// ─── HELPERS: AUDIO ───────────────────────────────────────────────────────────

/** Convierte ArrayBuffer a string base64 de forma segura (sin stack overflow) */
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 8192
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
export default function ChatScreen() {
  const [mensajes, setMensajes]             = useState<Mensaje[]>([])
  const [input, setInput]                   = useState('')
  const [cargando, setCargando]             = useState(false)
  const [modoVoz, setModoVoz]               = useState(false)
  const [grabando, setGrabando]             = useState(false)
  const [hablando, setHablando]             = useState(false)
  const [transcribiendo, setTranscribiendo] = useState(false)
  const [ultimoRiesgo, setUltimoRiesgo]     = useState<number | null>(null)

  const flatListRef  = useRef<FlatList>(null)
  const fadeAnim     = useRef(new Animated.Value(0)).current
  const dotAnim1     = useRef(new Animated.Value(0)).current
  const dotAnim2     = useRef(new Animated.Value(0)).current
  const dotAnim3     = useRef(new Animated.Value(0)).current
  const pulsoAnim    = useRef(new Animated.Value(1)).current
  const grabacionRef = useRef<Audio.Recording | null>(null)
  const soundRef     = useRef<Audio.Sound | null>(null)
  const turnoRef     = useRef(0)

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start()
    prepararAudio()
    lanzarMensajeInicial()
    return () => { soundRef.current?.unloadAsync() }
  }, [])

  useEffect(() => {
    if (cargando || transcribiendo) animarPuntos()
  }, [cargando, transcribiendo])

  // ── Audio ──────────────────────────────────────────────────────────────────
  const prepararAudio = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync()
      if (status !== 'granted') console.warn('Permiso de audio denegado')
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true })
    } catch (e) { console.error('prepararAudio:', e) }
  }

  // ── Animaciones ──────────────────────────────────────────────────────────
  const animarPuntos = () => {
    const animar = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0,  duration: 300, useNativeDriver: true }),
        ])
      ).start()
    animar(dotAnim1, 0)
    animar(dotAnim2, 150)
    animar(dotAnim3, 300)
  }

  const animarPulso = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulsoAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
        Animated.timing(pulsoAnim, { toValue: 1,   duration: 600, useNativeDriver: true }),
      ])
    ).start()
  }

  const detenerPulso = () => { pulsoAnim.stopAnimation(); pulsoAnim.setValue(1) }

  // ── API Claude ─────────────────────────────────────────────────────────────
  const llamarAPI = async (historial: { role: string; content: string }[]) => {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: historial,
      }),
    })
    const data = await res.json()
    if (data.type === 'error') throw new Error(data.error?.message ?? 'Error API')
    return data.content?.[0]?.text as string ?? null
  }

  const lanzarMensajeInicial = async () => {
    setCargando(true)
    try {
      const texto = await llamarAPI([{
        role: 'user',
        content: 'Salúdame de forma cálida y breve, y hazme una sola pregunta abierta sobre cómo me siento hoy. Máximo 2 oraciones.',
      }])
      agregarMensaje(texto ?? 'Hola, estoy aquí para escucharte. ¿Cómo estás hoy?', false)
    } catch {
      agregarMensaje('Hola, estoy aquí para escucharte. ¿Cómo estás hoy?', false)
    } finally {
      setCargando(false)
    }
  }

  const agregarMensaje = (texto: string, esUsuario: boolean) => {
    setMensajes(prev => [...prev, { id: `${Date.now()}${Math.random()}`, texto, esUsuario }])
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
  }

  // ── Enviar mensaje ─────────────────────────────────────────────────────────
  const enviarMensaje = async (textoForzado?: string) => {
    const textoUsuario = (textoForzado ?? input).trim()
    if (!textoUsuario || cargando) return
    setInput('')
    setCargando(true)
    const historialActual = mensajes.map(m => ({
      role: m.esUsuario ? 'user' : 'assistant',
      content: m.texto,
    }))
    agregarMensaje(textoUsuario, true)
    try {
      const respuesta = await llamarAPI([
        ...historialActual,
        { role: 'user', content: textoUsuario },
      ])
      const textoRespuesta = respuesta ?? 'Estoy aquí, cuéntame.'
      agregarMensaje(textoRespuesta, false)
      if (modoVoz) await leerConElevenLabs(textoRespuesta)
    } catch {
      agregarMensaje('Hubo un problema de conexión. ¿Puedes intentarlo de nuevo?', false)
    } finally {
      setCargando(false)
    }
  }

  // ── ElevenLabs TTS ─────────────────────────────────────────────────────────
  /**
   * Genera audio con ElevenLabs multilingual v2 y lo reproduce vía expo-av.
   * Fallback a expo-speech si la key no está configurada.
   */
  const leerConElevenLabs = async (texto: string) => {
    if (!ELEVENLABS_KEY || ELEVENLABS_KEY === 'TU_ELEVENLABS_KEY_AQUI') {
      // Fallback: expo-speech (más robótico pero funciona sin key)
      const { Speech } = await import('expo-speech')
      setHablando(true)
      Speech.speak(texto, {
        language: 'es-MX', pitch: 1.0, rate: 0.92,
        onDone: () => setHablando(false),
        onError: () => setHablando(false),
      })
      return
    }

    setHablando(true)
    try {
      // Descargar mp3 desde ElevenLabs
      const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVENLABS_KEY,
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg',
          },
          body: JSON.stringify({
            text: texto,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.45,          // algo de emoción natural
              similarity_boost: 0.80,
              style: 0.35,              // expresividad moderada
              use_speaker_boost: true,
            },
          }),
        }
      )

      if (!res.ok) throw new Error(`ElevenLabs ${res.status}`)

      const buffer = await res.arrayBuffer()
      const base64 = arrayBufferToBase64(buffer)
      const fileUri = `${FileSystem.cacheDirectory}dime_tts_${Date.now()}.mp3`

      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      })

      // Liberar sound anterior
      if (soundRef.current) {
        await soundRef.current.unloadAsync()
        soundRef.current = null
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true })

      const { sound } = await Audio.Sound.createAsync(
        { uri: fileUri },
        { shouldPlay: true }
      )
      soundRef.current = sound

      sound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish) {
          setHablando(false)
          sound.unloadAsync()
          soundRef.current = null
        }
      })
    } catch (e) {
      console.error('ElevenLabs TTS error:', e)
      setHablando(false)
    }
  }

  const detenerLectura = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync()
        await soundRef.current.unloadAsync()
        soundRef.current = null
      }
      // por si acaso se usó expo-speech en fallback
      const { Speech } = await import('expo-speech')
      Speech.stop()
    } catch {}
    setHablando(false)
  }

  // ── Grabación ──────────────────────────────────────────────────────────────
  const iniciarGrabacion = async () => {
    try {
      const { status } = await Audio.getPermissionsAsync()
      if (status !== 'granted') {
        const { status: s2 } = await Audio.requestPermissionsAsync()
        if (s2 !== 'granted') {
          agregarMensaje('Necesito permiso del micrófono. Ve a Ajustes y actívalo para Expo Go.', false)
          return
        }
      }
      if (hablando) await detenerLectura()
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true })
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY)
      grabacionRef.current = recording
      setGrabando(true)
      animarPulso()
    } catch (e: any) {
      agregarMensaje(`Error al iniciar micrófono: ${e?.message ?? 'desconocido'}`, false)
    }
  }

  const detenerGrabacion = async () => {
    if (!grabacionRef.current) return
    setGrabando(false)
    detenerPulso()
    setTranscribiendo(true)
    try {
      await grabacionRef.current.stopAndUnloadAsync()
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true })
      const uri = grabacionRef.current.getURI()
      grabacionRef.current = null
      if (!uri) throw new Error('No se obtuvo URI del audio')

      // Transcribir Y obtener análisis cognitivo
      const { texto, palabras, duracion } = await transcribirConGroq(uri)

      if (texto && texto.trim().length > 0) {
        // Análisis cognitivo
        turnoRef.current += 1
        const analisis = calcularAnalisis(texto, palabras, duracion, turnoRef.current)
        setUltimoRiesgo(analisis.indicadorRiesgo)

        // Guardar en Firebase (no bloquear la UI)
        guardarEnFirebase(analisis).catch(err =>
          console.warn('Firebase save error:', err)
        )

        // Enviar transcripción al chat
        await enviarMensaje(texto)
      } else {
        agregarMensaje('No entendí bien, ¿puedes intentarlo de nuevo?', false)
      }
    } catch (e: any) {
      agregarMensaje(`Error al procesar audio: ${e?.message ?? 'desconocido'}`, false)
    } finally {
      setTranscribiendo(false)
    }
  }

  // ── Groq Whisper (verbose_json → timestamps por palabra) ───────────────────
  /**
   * Retorna texto + array de palabras con timestamps + duración total.
   * El formato verbose_json de Whisper incluye word-level timestamps,
   * que usamos para calcular cadencia, pausas y velocidad del habla.
   */
  const transcribirConGroq = async (
    uri: string
  ): Promise<{ texto: string; palabras: PalabraTimestamp[]; duracion: number }> => {
    const formData = new FormData()
    formData.append('file', { uri, type: 'audio/m4a', name: 'audio.m4a' } as any)
    formData.append('model', 'whisper-large-v3-turbo')
    formData.append('language', 'es')
    formData.append('response_format', 'verbose_json')  // ← timestamps por palabra
    formData.append('timestamp_granularities[]', 'word') // ← solicitar nivel palabra

    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ_KEY}` },
      body: formData,
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data?.error?.message ?? `Groq ${res.status}`)

    return {
      texto:    data.text ?? '',
      palabras: (data.words ?? []) as PalabraTimestamp[],
      duracion: data.duration ?? 0,
    }
  }

  // ── Toggle modo ────────────────────────────────────────────────────────────
  const toggleModoVoz = () => {
    if (hablando) detenerLectura()
    setModoVoz(prev => !prev)
  }

  // ── Badge de riesgo cognitivo ───────────────────────────────────────────────
  const colorRiesgo = (r: number) =>
    r < 25 ? COLORS.verde : r < 55 ? COLORS.amarillo : COLORS.rojo

  const labelRiesgo = (r: number) =>
    r < 25 ? 'Normal' : r < 55 ? 'Monitorear' : 'Revisar'

  // ── Render burbuja ─────────────────────────────────────────────────────────
  const renderMensaje = ({ item }: { item: Mensaje }) => (
    <View>
      {!item.esUsuario && <Text style={styles.nombreBot}>Dime</Text>}
      <View style={[styles.burbuja, item.esUsuario ? styles.burbujaUsuario : styles.burbujaBot]}>
        <Text style={[styles.textoMensaje, item.esUsuario ? styles.textoUsuario : styles.textoBot]}>
          {item.texto}
        </Text>
      </View>
    </View>
  )

  const estadoLabel = transcribiendo ? 'Transcribiendo...'
    : cargando  ? 'Pensando...'
    : grabando  ? 'Soltar para enviar'
    : hablando  ? 'Toca para parar'
    : 'Mantén para hablar'

  // ── JSX ─────────────────────────────────────────────────────────────────────
  return (
    <Animated.View style={[styles.contenedor, { opacity: fadeAnim }]}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarTexto}>D</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerNombre}>Dime</Text>
            <Text style={styles.headerEstado}>
              {transcribiendo ? 'Transcribiendo...' :
               hablando       ? 'Hablando...'       :
               cargando       ? 'Escribiendo...'    : 'En línea'}
            </Text>
          </View>

          {/* Badge cognitivo — solo en modo voz */}
          {modoVoz && ultimoRiesgo !== null && (
            <View style={[styles.riesgoBadge, { backgroundColor: colorRiesgo(ultimoRiesgo) }]}>
              <Text style={styles.riesgoTexto}>
                {labelRiesgo(ultimoRiesgo)} {ultimoRiesgo}
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={toggleModoVoz}
            style={[styles.switchBtn, modoVoz && styles.switchBtnActivo]}
          >
            <Text style={[styles.switchTexto, modoVoz && styles.switchTextoActivo]}>
              {modoVoz ? '🎙 Voz' : '⌨️ Texto'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={mensajes}
          keyExtractor={item => item.id}
          renderItem={renderMensaje}
          contentContainerStyle={styles.listaPadding}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {(cargando || transcribiendo) && (
          <View style={styles.escribiendoContainer}>
            <View style={styles.escribiendoBurbuja}>
              <Animated.View style={[styles.punto, { transform: [{ translateY: dotAnim1 }] }]} />
              <Animated.View style={[styles.punto, { transform: [{ translateY: dotAnim2 }] }]} />
              <Animated.View style={[styles.punto, { transform: [{ translateY: dotAnim3 }] }]} />
            </View>
          </View>
        )}

        {/* MODO TEXTO */}
        {!modoVoz && (
          <View style={styles.inputContenedor}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Escribe algo..."
              placeholderTextColor={COLORS.textoSecundario}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.botonEnviar, (!input.trim() || cargando) && styles.botonDesactivado]}
              onPress={() => enviarMensaje()}
              disabled={!input.trim() || cargando}
            >
              {cargando
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.botonTexto}>↑</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* MODO VOZ */}
        {modoVoz && (
          <View style={styles.vozContenedor}>
            {input.trim().length > 0 && !grabando && !cargando && (
              <View style={styles.transcripcionBurbuja}>
                <Text style={styles.transcripcionTexto} numberOfLines={2}>{input}</Text>
              </View>
            )}

            <Text style={styles.vozHint}>{estadoLabel}</Text>

            <View style={styles.micWrapper}>
              {grabando && (
                <Animated.View style={[styles.micPulso, { transform: [{ scale: pulsoAnim }] }]} />
              )}
              <TouchableOpacity
                style={[
                  styles.micBoton,
                  grabando && styles.micGrabando,
                  hablando && styles.micHablando,
                  (transcribiendo || cargando) && styles.botonDesactivado,
                ]}
                onPressIn={() => { if (!hablando && !cargando && !transcribiendo) iniciarGrabacion() }}
                onPressOut={() => { if (grabando) detenerGrabacion() }}
                onPress={() => { if (hablando) detenerLectura() }}
                disabled={transcribiendo || cargando}
                activeOpacity={0.8}
              >
                {transcribiendo || cargando
                  ? <ActivityIndicator size="large" color="#fff" />
                  : <Text style={styles.micIcono}>
                      {grabando ? '⏹' : hablando ? '🔊' : '🎙'}
                    </Text>
                }
              </TouchableOpacity>
            </View>

            {/* Mini panel cognitivo por turno */}
            {ultimoRiesgo !== null && (
              <View style={styles.panelCognitivo}>
                <Text style={styles.panelTitulo}>Último análisis de voz</Text>
                <View style={styles.barraRiesgo}>
                  <View
                    style={[
                      styles.barraRiesgoFill,
                      {
                        width: `${ultimoRiesgo}%` as any,
                        backgroundColor: colorRiesgo(ultimoRiesgo),
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.panelRiesgoLabel, { color: colorRiesgo(ultimoRiesgo) }]}>
                  {labelRiesgo(ultimoRiesgo)} — {ultimoRiesgo}/100
                </Text>
              </View>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </Animated.View>
  )
}

// ─── ESTILOS ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  contenedor:           { flex: 1, backgroundColor: COLORS.fondo },
  header:               { backgroundColor: COLORS.verde, paddingTop: 54, paddingBottom: 16, paddingHorizontal: 20 },
  headerInfo:           { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarContainer:      { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.verdeOscuro, justifyContent: 'center', alignItems: 'center' },
  avatarTexto:          { color: COLORS.fondo, fontSize: 20, fontWeight: '700' },
  headerNombre:         { color: COLORS.fondo, fontSize: 18, fontWeight: '700' },
  headerEstado:         { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  switchBtn:            { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  switchBtnActivo:      { backgroundColor: 'rgba(255,255,255,0.9)' },
  switchTexto:          { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600' },
  switchTextoActivo:    { color: COLORS.verde },
  riesgoBadge:          { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  riesgoTexto:          { color: '#fff', fontSize: 10, fontWeight: '700' },
  listaPadding:         { padding: 16, paddingBottom: 8, gap: 4 },
  nombreBot:            { color: COLORS.textoSecundario, fontSize: 11, marginBottom: 4, marginLeft: 4, fontWeight: '600' },
  burbuja:              { maxWidth: '80%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, marginVertical: 4 },
  burbujaUsuario:       { backgroundColor: COLORS.magenta, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  burbujaBot:           { backgroundColor: COLORS.gris, alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.grisBorde },
  textoMensaje:         { fontSize: 15, lineHeight: 22 },
  textoUsuario:         { color: COLORS.fondo },
  textoBot:             { color: COLORS.negro },
  escribiendoContainer: { paddingHorizontal: 16, paddingBottom: 4 },
  escribiendoBurbuja:   { flexDirection: 'row', backgroundColor: COLORS.gris, borderRadius: 20, borderBottomLeftRadius: 4, paddingHorizontal: 16, paddingVertical: 14, alignSelf: 'flex-start', gap: 6, alignItems: 'center', borderWidth: 1, borderColor: COLORS.grisBorde },
  punto:                { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.textoSecundario },
  inputContenedor:      { flexDirection: 'row', padding: 12, gap: 10, backgroundColor: COLORS.fondo, borderTopWidth: 1, borderTopColor: COLORS.grisBorde, alignItems: 'flex-end' },
  input:                { flex: 1, backgroundColor: COLORS.gris, color: COLORS.negro, borderRadius: 24, paddingHorizontal: 18, paddingVertical: 12, fontSize: 15, borderWidth: 1, borderColor: COLORS.grisBorde, maxHeight: 100 },
  botonEnviar:          { backgroundColor: COLORS.magenta, width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  botonDesactivado:     { backgroundColor: COLORS.grisBorde },
  botonTexto:           { color: COLORS.fondo, fontSize: 22, fontWeight: '700' },
  vozContenedor:        { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: COLORS.grisBorde, backgroundColor: COLORS.fondo, gap: 10 },
  vozHint:              { fontSize: 13, color: COLORS.textoSecundario },
  micWrapper:           { width: 100, height: 100, justifyContent: 'center', alignItems: 'center' },
  micPulso:             { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: COLORS.rojo, opacity: 0.4 },
  micBoton:             { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.magenta, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  micGrabando:          { backgroundColor: COLORS.rojo },
  micHablando:          { backgroundColor: COLORS.verde },
  micIcono:             { fontSize: 32 },
  transcripcionBurbuja: { backgroundColor: COLORS.gris, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, maxWidth: '90%', borderWidth: 1, borderColor: COLORS.grisBorde },
  transcripcionTexto:   { fontSize: 13, color: COLORS.textoSecundario, fontStyle: 'italic' },
  panelCognitivo:       { width: '100%', backgroundColor: COLORS.gris, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: COLORS.grisBorde, gap: 6 },
  panelTitulo:          { fontSize: 11, fontWeight: '700', color: COLORS.textoSecundario, textTransform: 'uppercase', letterSpacing: 0.5 },
  barraRiesgo:          { height: 6, backgroundColor: COLORS.grisBorde, borderRadius: 3, overflow: 'hidden' },
  barraRiesgoFill:      { height: '100%', borderRadius: 3 },
  panelRiesgoLabel:     { fontSize: 12, fontWeight: '600' },
})