/**
 * Dime — Servidor de análisis cognitivo
 * Node.js + Express + Firebase Admin SDK
 *
 * Instalar:  npm install
 * Correr:    node server.js
 * Deploy:    Railway / Render / Cloud Run (cualquier host Node)
 */

const express  = require('express')
const admin    = require('firebase-admin')
const cors     = require('cors')

// ─── FIREBASE ADMIN INIT ──────────────────────────────────────────────────────
// Opción A: archivo JSON local (desarrollo)
const serviceAccount = require('./serviceAccountKey.json')

// Opción B: variable de entorno (producción — más seguro)
// const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

// ─── EXPRESS ──────────────────────────────────────────────────────────────────
const app  = express()
const PORT = process.env.PORT || 3000

app.use(cors())                          // permite llamadas desde la app
app.use(express.json({ limit: '1mb' })) // body JSON

// ── Middleware: log simple ────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// ─── RUTAS ────────────────────────────────────────────────────────────────────

/**
 * POST /analisis
 * Recibe un objeto AnalisisCognitivo desde la app y lo guarda en:
 *   sesiones/{sessionId}/turnos/turno_{N}
 *
 * Body esperado: { ...AnalisisCognitivo }
 */
app.post('/analisis', async (req, res) => {
  try {
    const analisis = req.body

    // Validación mínima
    if (!analisis?.sessionId || typeof analisis.turno !== 'number') {
      return res.status(400).json({ error: 'Faltan campos: sessionId o turno' })
    }

    const { sessionId, turno } = analisis

    // ── Guardar turno individual ──────────────────────────────────────────────
    const turnoRef = db
      .collection('sesiones')
      .doc(sessionId)
      .collection('turnos')
      .doc(`turno_${turno}`)

    await turnoRef.set({
      ...analisis,
      guardadoEn: admin.firestore.FieldValue.serverTimestamp(),
    })

    // ── Actualizar resumen de sesión ──────────────────────────────────────────
    // Mantiene un promedio acumulado de riesgo y estadísticas globales
    const sesionRef = db.collection('sesiones').doc(sessionId)

    await sesionRef.set(
      {
        sessionId,
        ultimaActividad:  admin.firestore.FieldValue.serverTimestamp(),
        totalTurnos:      admin.firestore.FieldValue.increment(1),

        // Acumular para promediar
        sumaRiesgo:       admin.firestore.FieldValue.increment(analisis.indicadorRiesgo),
        sumaPPM:          admin.firestore.FieldValue.increment(analisis.palabrasPorMinuto),
        sumaTTR:          admin.firestore.FieldValue.increment(analisis.riquezaLexica?.ttr ?? 0),
        sumaPausasLargas: admin.firestore.FieldValue.increment(analisis.pausas?.pausasLargas ?? 0),

        // Último resultado completo (para dashboard rápido)
        ultimoAnalisis: {
          turno,
          indicadorRiesgo:    analisis.indicadorRiesgo,
          factoresRiesgo:     analisis.factoresRiesgo ?? [],
          palabrasPorMinuto:  analisis.palabrasPorMinuto,
          ttr:                analisis.riquezaLexica?.ttr ?? 0,
          timestamp:          analisis.timestamp,
        },
      },
      { merge: true }  // no sobreescribe campos existentes
    )

    console.log(
      `  ✅ Sesión ${sessionId} | Turno ${turno} | Riesgo ${analisis.indicadorRiesgo}/100`
    )

    return res.status(201).json({
      ok: true,
      mensaje: `Turno ${turno} guardado`,
      riesgo:  analisis.indicadorRiesgo,
    })

  } catch (err) {
    console.error('Error /analisis:', err)
    return res.status(500).json({ error: err.message })
  }
})

/**
 * GET /sesion/:sessionId
 * Devuelve el resumen de una sesión + todos sus turnos.
 * Útil para un dashboard externo o para que la app muestre historial.
 */
app.get('/sesion/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params

    const sesionSnap  = await db.collection('sesiones').doc(sessionId).get()
    const turnosSnap  = await db
      .collection('sesiones')
      .doc(sessionId)
      .collection('turnos')
      .orderBy('turno', 'asc')
      .get()

    if (!sesionSnap.exists) {
      return res.status(404).json({ error: 'Sesión no encontrada' })
    }

    const sesion  = sesionSnap.data()
    const turnos  = turnosSnap.docs.map(d => d.data())

    // Calcular promedios reales
    const n = sesion.totalTurnos || 1
    const resumen = {
      ...sesion,
      promedioRiesgo:       Math.round((sesion.sumaRiesgo       ?? 0) / n),
      promedioPPM:          Math.round((sesion.sumaPPM           ?? 0) / n),
      promedioTTR:          Math.round(((sesion.sumaTTR          ?? 0) / n) * 100) / 100,
      promedioPausasLargas: Math.round(((sesion.sumaPausasLargas ?? 0) / n) * 10) / 10,
    }

    return res.json({ sesion: resumen, turnos })

  } catch (err) {
    console.error('Error /sesion:', err)
    return res.status(500).json({ error: err.message })
  }
})

/**
 * GET /sesiones
 * Lista todas las sesiones ordenadas por actividad reciente.
 * Útil para panel clínico.
 */
app.get('/sesiones', async (req, res) => {
  try {
    const snap = await db
      .collection('sesiones')
      .orderBy('ultimaActividad', 'desc')
      .limit(50)
      .get()

    const sesiones = snap.docs.map(d => {
      const data = d.data()
      const n    = data.totalTurnos || 1
      return {
        sessionId:      data.sessionId,
        totalTurnos:    data.totalTurnos,
        promedioRiesgo: Math.round((data.sumaRiesgo ?? 0) / n),
        ultimoRiesgo:   data.ultimoAnalisis?.indicadorRiesgo ?? 0,
        ultimaActividad: data.ultimaActividad,
      }
    })

    return res.json({ sesiones })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

/**
 * GET /health
 * Healthcheck para plataformas de deploy (Railway, Render, etc.)
 */
app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }))

// ─── START ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🟢 Dime server corriendo en http://localhost:${PORT}`)
  console.log('   POST /analisis      — guardar turno')
  console.log('   GET  /sesion/:id    — leer sesión completa')
  console.log('   GET  /sesiones      — listar todas las sesiones')
  console.log('   GET  /health        — healthcheck\n')
})
