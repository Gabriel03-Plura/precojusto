import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  orderBy,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Usuario, RegistroPreco, Produto, Estabelecimento } from '../types';
import { PRODUTOS_INICIAIS, ESTABELECIMENTOS_INICIAIS } from '../data/mockData';

// Initialize Firebase App safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.addScope('https://www.googleapis.com/auth/user.phonenumbers.read');
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Initialize Firestore with custom Database ID if specified
export const db = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId || '(default)'
);

let isAuthPopupPending = false;

/**
 * Register user with Email and Password
 */
export async function registerWithEmail(
  nome: string,
  email: string,
  senha: string,
  telefone: string,
  cidade: string,
  bairro: string,
  avatarUrl?: string
): Promise<Usuario> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
  const user = userCredential.user;

  if (nome) {
    await updateProfile(user, { displayName: nome, photoURL: avatarUrl || '' });
  }

  const userProfile: Usuario = {
    id: user.uid,
    nome: nome || 'Consumidor PreçoJusto',
    email: user.email || email,
    telefone: telefone || '(16) 99782-4102',
    cidade: cidade || 'Araraquara',
    bairro: bairro || 'Centro',
    latitude: -21.7946,
    longitude: -48.1766,
    avatarUrl: avatarUrl || undefined,
    preferenciasNotificacao: true,
    notificarAbaixoMedia: true,
  };

  const userDocRef = doc(db, 'users', user.uid);
  await setDoc(userDocRef, {
    ...userProfile,
    updatedAt: new Date().toISOString(),
  });

  return userProfile;
}

/**
 * Sign in user with Email and Password
 */
export async function loginWithEmail(email: string, senha: string): Promise<Usuario> {
  const userCredential = await signInWithEmailAndPassword(auth, email, senha);
  const user = userCredential.user;

  const userDocRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userDocRef);

  if (snap.exists()) {
    return snap.data() as Usuario;
  }

  const defaultProfile: Usuario = {
    id: user.uid,
    nome: user.displayName || email.split('@')[0],
    email: user.email || email,
    telefone: '(16) 99782-4102',
    cidade: 'Araraquara',
    bairro: 'Centro',
    latitude: -21.7946,
    longitude: -48.1766,
    avatarUrl: user.photoURL || undefined,
    preferenciasNotificacao: true,
    notificarAbaixoMedia: true,
  };

  await setDoc(userDocRef, {
    ...defaultProfile,
    updatedAt: new Date().toISOString(),
  });

  return defaultProfile;
}

/**
 * Sign in with Google Auth
 */
export async function signInWithGoogle(): Promise<Usuario> {
  if (isAuthPopupPending) {
    throw new Error('Autenticação em andamento. Aguarde o pop-up.');
  }
  isAuthPopupPending = true;
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Extract phone number provided by Google account or provider data
    let userPhone = user.phoneNumber || '';
    if (!userPhone && user.providerData) {
      for (const p of user.providerData) {
        if (p.phoneNumber) {
          userPhone = p.phoneNumber;
          break;
        }
      }
    }

    const userProfile: Usuario = {
      id: user.uid,
      nome: user.displayName || 'Consumidor PreçoJusto',
      email: user.email || '',
      telefone: userPhone,
      cidade: 'Araraquara',
      bairro: 'Centro',
      latitude: -21.7946,
      longitude: -48.1766,
      avatarUrl: user.photoURL || undefined,
      preferenciasNotificacao: true,
      notificarAbaixoMedia: true,
    };

    // Check if user profile already exists in Firestore to keep custom city/bairro
    const userDocRef = doc(db, 'users', user.uid);
    const existingSnap = await getDoc(userDocRef);

    let finalProfile = userProfile;
    if (existingSnap.exists()) {
      const data = existingSnap.data() as Usuario;
      finalProfile = {
        ...userProfile,
        cidade: data.cidade || userProfile.cidade,
        bairro: data.bairro || userProfile.bairro,
        telefone: data.telefone || userPhone,
        latitude: data.latitude || userProfile.latitude,
        longitude: data.longitude || userProfile.longitude,
      };
    } else {
      await setDoc(userDocRef, {
        ...userProfile,
        updatedAt: new Date().toISOString(),
      });
    }

    return finalProfile;
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    if (error?.code === 'auth/cancelled-popup-request' || error?.message?.includes('transition')) {
      throw new Error('A solicitação de login anterior foi cancelada.');
    }
    throw error;
  } finally {
    isAuthPopupPending = false;
  }
}

/**
 * Log out current Firebase user
 */
export async function logoutFirebase(): Promise<void> {
  await signOut(auth);
}

/**
 * Update user profile in Firestore
 */
export async function saveUserProfileToFirestore(usuario: Usuario): Promise<void> {
  try {
    if (!usuario.id) return;
    const userDocRef = doc(db, 'users', usuario.id);
    await setDoc(
      userDocRef,
      {
        ...usuario,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error saving user profile to Firestore:', error);
  }
}

/**
 * Save price record / receipt scan to Firestore
 */
export async function saveRegistroToFirestore(registro: RegistroPreco): Promise<void> {
  try {
    const registroRef = doc(db, 'registros', registro.id);
    await setDoc(registroRef, {
      ...registro,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error saving registro to Firestore:', error);
  }
}

/**
 * Delete price record from Firestore
 */
export async function deleteRegistroFromFirestore(registroId: string): Promise<void> {
  try {
    const registroRef = doc(db, 'registros', registroId);
    await deleteDoc(registroRef);
  } catch (error) {
    console.error('Error deleting registro from Firestore:', error);
  }
}

/**
 * Realtime listener for user's purchase history in Firestore
 */
export function subscribeUserRegistros(
  usuarioId: string,
  onRecordsChange: (records: RegistroPreco[]) => void
) {
  if (!usuarioId) return () => {};

  const registrosCol = collection(db, 'registros');
  const q = query(registrosCol, where('usuarioId', '==', usuarioId));

  return onSnapshot(
    q,
    (snapshot) => {
      const records: RegistroPreco[] = [];
      for (const d of snapshot.docs) {
        const data = d.data() as RegistroPreco;
        const pName = (data.nomeProduto || '').toLowerCase();
        if (
          d.id.startsWith('rec-') ||
          pName.includes('tio joão') ||
          pName.includes('tio joao')
        ) {
          // Clean up initial simulation records permanently from Firestore
          deleteDoc(doc(db, 'registros', d.id)).catch(() => {});
        } else {
          records.push(data);
        }
      }
      records.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      onRecordsChange(records);
    },
    (error) => {
      console.error('Firestore registros snapshot error:', error);
    }
  );
}

/**
 * Realtime listener for ALL crowdsourced price records in Firestore
 */
export function subscribeAllRegistros(
  onRecordsChange: (records: RegistroPreco[]) => void
) {
  const registrosCol = collection(db, 'registros');

  return onSnapshot(
    registrosCol,
    (snapshot) => {
      const records: RegistroPreco[] = [];
      for (const d of snapshot.docs) {
        const data = d.data() as RegistroPreco;
        const pName = (data.nomeProduto || '').toLowerCase();
        if (
          d.id.startsWith('rec-') ||
          pName.includes('tio joão') ||
          pName.includes('tio joao')
        ) {
          // Clean up initial simulation records permanently from Firestore
          deleteDoc(doc(db, 'registros', d.id)).catch(() => {});
        } else {
          records.push(data);
        }
      }
      records.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      onRecordsChange(records);
    },
    (error) => {
      console.error('Firestore all registros error:', error);
    }
  );
}

/**
 * Save or update product in Firestore catalog
 */
export async function saveProdutoToFirestore(produto: Produto): Promise<void> {
  try {
    const docRef = doc(db, 'produtos', produto.id);
    await setDoc(docRef, produto, { merge: true });
  } catch (error) {
    console.error('Error saving product to Firestore:', error);
  }
}

/**
 * Save or update store in Firestore catalog
 */
export async function saveEstabelecimentoToFirestore(est: Estabelecimento): Promise<void> {
  try {
    const docRef = doc(db, 'estabelecimentos', est.id);
    await setDoc(docRef, est, { merge: true });
  } catch (error) {
    console.error('Error saving store to Firestore:', error);
  }
}

/**
 * Realtime listener for Products catalog in Firestore with seed fallback
 */
const MOCK_PRODUCT_IDS = ['prod-1', 'prod-2', 'prod-3', 'prod-4', 'prod-5', 'prod-6', 'prod-7', 'prod-8', 'prod-9', 'prod-10', 'prod-11', 'prod-12', 'prod-13'];

export function subscribeProdutos(onProductsChange: (prods: Produto[]) => void) {
  const colRef = collection(db, 'produtos');
  return onSnapshot(colRef, async (snapshot) => {
    if (snapshot.empty) {
      onProductsChange([]);
    } else {
      const prods: Produto[] = [];
      for (const d of snapshot.docs) {
        const p = d.data() as Produto;
        const pName = (p.nome || '').toLowerCase();
        if (
          MOCK_PRODUCT_IDS.includes(d.id) ||
          d.id.startsWith('prod-') ||
          pName.includes('tio joão') ||
          pName.includes('tio joao')
        ) {
          // Clean up initial mock products from Firestore
          deleteDoc(doc(db, 'produtos', d.id)).catch(() => {});
        } else {
          prods.push(p);
        }
      }
      onProductsChange(prods);
    }
  });
}

/**
 * Realtime listener for Stores catalog in Firestore with seed fallback
 */
const MOCK_STORE_IDS = ['est-1', 'est-2', 'est-3', 'est-4', 'est-5', 'est-6', 'est-7', 'est-8'];

export function subscribeEstabelecimentos(onStoresChange: (stores: Estabelecimento[]) => void) {
  const colRef = collection(db, 'estabelecimentos');
  return onSnapshot(colRef, async (snapshot) => {
    if (snapshot.empty) {
      onStoresChange([]);
    } else {
      const realStores: Estabelecimento[] = [];
      for (const d of snapshot.docs) {
        if (MOCK_STORE_IDS.includes(d.id)) {
          // Permanently clean up fictitious seed store from Firestore
          deleteDoc(doc(db, 'estabelecimentos', d.id)).catch(() => {});
        } else {
          realStores.push(d.data() as Estabelecimento);
        }
      }
      onStoresChange(realStores);
    }
  });
}

