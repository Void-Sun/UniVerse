import admin from "firebase-admin";
import serviceAccount from "./tcc-uni-firebase-adminsdk-hrp9x-ad82075160.json";
import { getAuth } from "firebase-admin/auth";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    databaseURL: "http://localhost:3000", // Use o URL do projeto Firebase
  });
}

export const adminAuth = admin.auth();
export {
  getAuth
  
} 