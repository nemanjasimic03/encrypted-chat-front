import React, { useState } from "react";
import { generateKeyPair, exportPublicKey } from "./Crypto/crypto";
import Chat from "./Components/Chat";
import io from "socket.io-client";
import "./App.css"

const socket = io("http://localhost:3001"); // prilagodi URL ako treba

function App() {
  const [username, setUsername] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [keyPair, setKeyPair] = useState(null);

  const handleLogin = async () => {
    if (!username.trim()) return;

    // Generiši ključeve
    const keys = await generateKeyPair();
    setKeyPair(keys);

    // Izvezi javni ključ u string
    const pubKey = await exportPublicKey(keys.publicKey);

    // Pošalji serveru login info
    socket.emit("login", { username, publicKey: pubKey });

    setLoggedIn(true);
  };

  return (
    <div className="container">
      {!loggedIn ? (
        <div className="login-container">
          <h2>Dobrodošao u Sigurni Chat</h2>
          <div className="login-form">
            <input
              type="text"
              placeholder="Unesi ime"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <button onClick={handleLogin}>Pridruži se</button>
          </div>
          <div className="info-box">
            <h3>Šta je E2E enkripcija?</h3>
            <p>
              End-to-End enkripcija (E2EE) znači da su poruke šifrovane na
              uređaju pošiljaoca i mogu biti dešifrovane samo na uređaju
              primaoca. Čak ni server preko kojeg poruke prolaze ne može da ih
              pročita.
            </p>
            <p>
              Ovaj edukativni chat koristi javne i privatne ključeve za
              razmenu poruka, garantujući da samo korisnici koji učestvuju u
              razgovoru mogu pročitati sadržaj.
            </p>
          </div>
        </div>
      ) : 
         <Chat socket={socket} username={username} keyPair={keyPair} />
      }
    </div>
  );
}

export default App;
