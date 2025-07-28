import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, indexedDBLocalPersistence, getReactNativePersistence } from 'firebase/auth';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyAaSUQ1PNfeYl99SFK_TmNBbndD8sz-u_s",
  authDomain: "filadireta.firebaseapp.com",
  projectId: "filadireta",
  storageBucket: "filadireta.appspot.com",
  messagingSenderId: "128273240752",
  appId: "1:128273240752:web:f8945e72d4bff23cb6e175"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Função para inicializar a autenticação de forma segura
const createAuth = () => {
  if (Platform.OS === 'web') {
    // Para a web, usa a persistência padrão do navegador
    return initializeAuth(app, {
      persistence: indexedDBLocalPersistence,
    });
  } else {
    // Para mobile, importa o AsyncStorage SÓ AQUI, para não quebrar a web
    const ReactNativeAsyncStorage = require('@react-native-async-storage/async-storage').default;
    return initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  }
};

const auth = createAuth();

export { auth, db };