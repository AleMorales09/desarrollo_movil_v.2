import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// const firebaseConfig = {
//   apiKey: "",
//   authDomain: "",
//   projectId: "",
//   storageBucket: "",
//   messagingSenderId: "",
//   appId: ""
// };

const firebaseConfig = {
  apiKey: "AIzaSyD7cqNDgmhPZDVASDDU_eIxG-C7No3zAoA",
  authDomain: "mobilestart-f6ab7.firebaseapp.com",
  projectId: "mobilestart-f6ab7",
  storageBucket: "mobilestart-f6ab7.firebasestorage.app",
  messagingSenderId: "604737461410",
  appId: "1:604737461410:web:64665597347c3e5aa5cbfb",
  measurementId: "G-MKGGJ99CNG"
};

const app = initializeApp(firebaseConfig);

//const auth = getAuth(app);

// const database = getFirestore(app);


const auth = getAuth(app);

export { auth };

const db = getFirestore(app);

export { db };

