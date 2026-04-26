import { getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
    apiKey:            "TU_API_KEY",
    authDomain:        "TU_PROJECT.firebaseapp.com",
    projectId:         "TU_PROJECT_ID",
    storageBucket:     "TU_PROJECT.appspot.com",
    messagingSenderId: "TU_SENDER_ID",
    appId:             "TU_APP_ID",
}

// Evita reinicializar si ya existe una instancia (importante en hot reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const auth = getAuth(app)
export default app