import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB97_LXEtE5ZkeMgA7CjX77dQf38v2xu4k",
  authDomain: "codecatalysts-e2bf2.firebaseapp.com",
  projectId: "codecatalysts-e2bf2",
  storageBucket: "codecatalysts-e2bf2.firebasestorage.app",
  messagingSenderId: "54871586790",
  appId: "1:54871586790:web:6eaa2e61e37a73c8bf8827"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
