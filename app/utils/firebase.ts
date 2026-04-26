import { FB_API_KEY, FB_BASE_URL } from '@/constants';

/**
 * Convierte un valor JS a formato Firestore REST
 */
export const toFirestoreValue = (val: unknown): object => {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val)
      ? { integerValue: String(val) }
      : { doubleValue: val };
  }
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields: Record<string, object> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
};

/**
 * Convierte un objeto plano a documento Firestore
 */
export const toFirestoreDoc = (obj: Record<string, unknown>) => {
  const fields: Record<string, object> = {};
  for (const [k, v] of Object.entries(obj)) {
    fields[k] = toFirestoreValue(v);
  }
  return { fields };
};

/**
 * Convierte documento de Firestore a objeto JS
 */
export const fromFirestoreValue = (val: any): unknown => {
  if (val.nullValue !== undefined) return null;
  if (val.booleanValue !== undefined) return val.booleanValue;
  if (val.stringValue !== undefined) return val.stringValue;
  if (val.integerValue !== undefined) return parseInt(val.integerValue);
  if (val.doubleValue !== undefined) return val.doubleValue;
  if (val.arrayValue !== undefined) {
    return val.arrayValue.values?.map(fromFirestoreValue) ?? [];
  }
  if (val.mapValue !== undefined) {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val.mapValue.fields ?? {})) {
      obj[k] = fromFirestoreValue(v);
    }
    return obj;
  }
  return null;
};

/**
 * Guarda un documento en Firestore
 */
export const guardarDocumento = async (
  coleccion: string,
  documentId: string,
  datos: Record<string, unknown>
): Promise<void> => {
  const url = `${FB_BASE_URL}/${coleccion}/${documentId}?key=${FB_API_KEY}`;

  const body = JSON.stringify(toFirestoreDoc(datos));

  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Firebase error ${res.status}: ${err}`);
  }
};

/**
 * Lee un documento de Firestore
 */
export const leerDocumento = async (
  coleccion: string,
  documentId: string
): Promise<Record<string, unknown> | null> => {
  const url = `${FB_BASE_URL}/${coleccion}/${documentId}?key=${FB_API_KEY}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (res.status === 404) return null;

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Firebase error ${res.status}: ${err}`);
  }

  const data = await res.json();

  if (!data.fields) return null;

  const obj: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data.fields ?? {})) {
    obj[k] = fromFirestoreValue(v);
  }
  return obj;
};

/**
 * Crea un usuario en Firestore
 */
export const crearUsuario = async (
  userId: string,
  email: string,
  username: string
): Promise<void> => {
  await guardarDocumento('usuarios', userId, {
    email,
    username,
    createdAt: new Date().toISOString(),
    perfil: {
      avatar: '👤',
      bio: '',
      nivel: 'principiante',
    },
    estadisticas: {
      ejerciciosCompletados: 0,
      testsRealizados: 0,
      minutosTotal: 0,
    },
  });
};

/**
 * Guarda un ejercicio completado
 */
export const guardarEjercicio = async (
  userId: string,
  ejercicio: {
    id: string;
    nombre: string;
    tipo: string;
    duracion: number;
    completado: boolean;
    fecha: string;
    respuesta?: string;
  }
): Promise<void> => {
  await guardarDocumento(
    `usuarios/${userId}/ejercicios`,
    ejercicio.id,
    ejercicio
  );
};

/**
 * Guarda un test realizado
 */
export const guardarTest = async (
  userId: string,
  test: {
    id: string;
    nombre: string;
    puntuacion: number;
    respuestas: Record<string, string>;
    fecha: string;
  }
): Promise<void> => {
  await guardarDocumento(
    `usuarios/${userId}/tests`,
    test.id,
    test
  );
};

/**
 * Guarda una entrada de diario
 */
export const guardarDiario = async (
  userId: string,
  entrada: {
    id: string;
    titulo: string;
    contenido: string;
    emociones: string[];
    fecha: string;
  }
): Promise<void> => {
  await guardarDocumento(
    `usuarios/${userId}/diario`,
    entrada.id,
    entrada
  );
};

/**
 * Lee el perfil del usuario
 */
export const leerPerfil = async (userId: string): Promise<Record<string, unknown> | null> => {
  return leerDocumento('usuarios', userId);
};

/**
 * Guarda o actualiza el perfil del usuario
 */
export const guardarPerfil = async (
  userId: string,
  perfil: Record<string, unknown>
): Promise<void> => {
  await guardarDocumento('usuarios', userId, perfil);
};

/**
 * Lee ejercicios del usuario
 */
export const leerEjercicios = async (userId: string): Promise<Record<string, unknown>[]> => {
  const url = `${FB_BASE_URL}/usuarios/${userId}/ejercicios?key=${FB_API_KEY}`;

  try {
    const res = await fetch(url);
    if (res.status === 404) return [];

    const data = await res.json();
    if (!data.documents) return [];

    return data.documents.map((doc: any) => {
      const obj: Record<string, unknown> = { __id: doc.name.split('/').pop() };
      for (const [k, v] of Object.entries(doc.fields ?? {})) {
        obj[k] = fromFirestoreValue(v);
      }
      return obj;
    });
  } catch (error) {
    console.error('Error leyendo ejercicios:', error);
    return [];
  }
};
