import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js';
import { getDatabase, onValue, ref } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBMRbEW18ViCFCVdLS6lyoMfx0Z9ZGgW9U",
    authDomain: "dmii-2024.firebaseapp.com",
    projectId: "dmii-2024",
    storageBucket: "dmii-2024.appspot.com",
    messagingSenderId: "871398193932",
    appId: "1:871398193932:web:4b9e45e35be93526b96729",
    databaseURL: "https://dmii-2024-default-rtdb.europe-west1.firebasedatabase.app"
};

const firebaseApp = initializeApp(firebaseConfig);

const provider = new GoogleAuthProvider();
const auth = getAuth(firebaseApp);
auth.useDeviceLanguage();

const signIn = () => {
    signInWithPopup(auth, provider)
        .then((result) => {
            console.log(result.user);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential.accessToken;
            console.log(token);
            const database = getDatabase(firebaseApp);
            console.log(database);
            const dbRef = ref(database, '/JOYCE/');
            console.log(dbRef);

            onValue(dbRef, (snapshot) => {
                console.log("ici");
                console.log(snapshot.val());
                const fileListDiv = document.getElementById('fileList');
                fileListDiv.innerHTML = ''; // Clear previous content

                const data = snapshot.val();
                if (data) {
                    Object.keys(data).forEach(key => {
                        const item = document.createElement('div');
                        item.textContent = `${key}: ${data[key].tags}`;
                        item.style.padding = '10px';
                        item.style.margin = '5px 0';
                        item.style.border = '1px solid #ccc';
                        item.style.borderRadius = '5px';
                        item.style.backgroundColor = '#f9f9f9';
                        item.addEventListener('click', async () => {
                            await fetch(`/getUrl?path=${data[key].path}`)
                                .then(response => response.json())
                                .then(data => {
                                    window.open(data.url);
                                });
                        })
                        fileListDiv.appendChild(item);
                    });
                } else {
                    fileListDiv.textContent = 'No data available';
                    fileListDiv.style.padding = '10px';
                    fileListDiv.style.margin = '5px 0';
                    fileListDiv.style.border = '1px solid #ccc';
                    fileListDiv.style.borderRadius = '5px';
                    fileListDiv.style.backgroundColor = '#f9f9f9';
                }
            });
        }).catch((error) => {
            console.log(error);
        });
};

document.getElementById('signin').addEventListener('click', signIn);
