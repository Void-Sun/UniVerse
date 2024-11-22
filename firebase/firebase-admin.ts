import admin from "firebase-admin";
import serviceAccount from "./tcc-uni-firebase-adminsdk-hrp9x-1be075ccb8.json";
import { getAuth } from "firebase/auth";

// Verifique se já existe uma instância do Firebase App
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    databaseURL: "http://localhost:3000/", // Substitua pela URL do seu projeto
  });
}

export const adminAuth = admin.auth();
export const admauth = getAuth();

