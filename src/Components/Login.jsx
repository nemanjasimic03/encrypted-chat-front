// src/components/Login.js
import React, { useState } from 'react';
import { generateRSAKeyPair } from '../Crypto/crypto';
import '../App.css';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');

  const handleLogin = async () => {
    if (!username) return;

    const { publicKey, privateKey } = await generateRSAKeyPair();

    localStorage.setItem('username', username);
    localStorage.setItem('publicKey', publicKey);
    localStorage.setItem('privateKey', privateKey);

    onLogin({ username, publicKey });
  };

  return (
    <div className="container">
      <h2>Dobrodošao u Secure Chat</h2>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Unesi korisničko ime"
      />
      <div className="input-row">
        <button onClick={handleLogin}>Uđi</button>
      </div>
    </div>
  );
}
