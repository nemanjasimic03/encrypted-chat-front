import React, { useEffect, useState, useRef } from "react";
import {
  importPublicKey,
  encryptMessage,
  decryptMessage,
} from "../Crypto/crypto";

function Chat({ socket, username, keyPair }) {
  const [users, setUsers] = useState([]); // { username, publicKey, socketId }
  const [publicKeys, setPublicKeys] = useState({}); // socketId -> CryptoKey
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [keysReady, setKeysReady] = useState(false);
  const [activeUsers, setActiveUsers] = useState({});
  const messagesEndRef = useRef(null);


  
  useEffect(() => {
  // Emituj zahtev za korisnike kad se komponenta mountuje
  socket.emit("request-users");

  // Slušaj active users listu
  socket.on('active-users', (users) => {
    console.log('Aktivni korisnici:', users);
    setActiveUsers(users);
  });

  // Slušaj listu korisnika sa javnim ključevima
  socket.on("users", async (usersFromServer) => {
    setUsers(usersFromServer);
    setKeysReady(false);

    const newPublicKeys = {};
    for (const user of usersFromServer) {
      if (!user.publicKey) {
        console.warn("Korisnik nema javni ključ:", user.username, user.socketId);
        continue;
      }
      try {
        console.log("Importujem javni ključ za", user.username, user.publicKey);
        newPublicKeys[user.socketId] = await importPublicKey(user.publicKey);
      } catch (e) {
        console.error("Ne mogu da importujem javni ključ", user.username, e);
      }
    }
    setPublicKeys(newPublicKeys);
    setKeysReady(true);
  });

  // Slušaj poruke
  socket.on("receive-message", async (data) => {
    try {
      const decryptedText = await decryptMessage(keyPair.privateKey, data.encryptedMessage);
      setMessages((msgs) => [
        ...msgs,
        {
          from: data.fromUsername,
          text: decryptedText,
          timestamp: new Date(data.timestamp).toLocaleTimeString(),
        },
      ]);
    } catch (e) {
      console.error("Greška u dešifrovanju poruke", e);
    }
  });

  // Cleanup na unmount
  return () => {
    socket.off('active-users');
    socket.off("users");
    socket.off("receive-message");
  };
}, [socket, keyPair]);




  // Scroll na dno kad stigne nova poruka
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Šalji poruku svima osim sebi, šifrovano za svakog posebno
  const sendMessage = async () => {
  if (!input.trim()) return;

  try {
    const encryptedMessages = {};

    console.log(users);
    console.log(publicKeys);

    for (const user of users) {
      const publicKey = publicKeys[user.socketId];
      if (!publicKey) continue;

      const encrypted = await encryptMessage(publicKey, input);
      encryptedMessages[user.socketId] = encrypted;
    }

    const data = {
      encryptedMessages, // mapirano po korisniku
      fromUsername: username,
      timestamp: new Date().toISOString(),
    };

    socket.emit("send-message", data);

    // Ukloni lokalno dodavanje poruke!
    setInput("");
  } catch (e) {
    console.error("Greška pri slanju poruke", e);
  }
};

  return (
    <div
      className="chat-container"
      style={{ maxWidth: 600, margin: "auto", padding: 20 }}
    >
      <h2>Ulogovan kao: {username}</h2>
<ul>
  {users.map((user) => (
    <li key={user.socketId}>
      {user.username}
    </li>
  ))}
</ul>

      <div
        style={{
          height: 400,
          border: "1px solid #ccc",
          borderRadius: 8,
          padding: 10,
          backgroundColor: "#f9f9f9",
          overflowY: "auto",
          marginBottom: 10,
        }}
      >
        {messages.length === 0 && <p>Nema poruka.</p>}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: 8,
              textAlign: msg.from === username ? "right" : "left",
            }}
          >
            <div
              style={{
                display: "inline-block",
                padding: "8px 12px",
                borderRadius: 15,
                backgroundColor: msg.from === username ? "#0d6efd" : "#e4e6eb",
                color: msg.from === username ? "white" : "black",
                maxWidth: "80%",
                wordBreak: "break-word",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: "bold" }}>{msg.from}</div>
              <div>{msg.text}</div>
              <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7 }}>
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <input
          type="text"
          value={input}
          placeholder="Napiši poruku..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
          style={{
            flex: 1,
            padding: 8,
            fontSize: 16,
            borderRadius: 8,
            border: "1px solid #ccc",
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          style={{
            padding: "8px 16px",
            fontSize: 16,
            borderRadius: 8,
            backgroundColor: input.trim() ? "#0d6efd" : "#ccc",
            color: "white",
            border: "none",
            cursor: input.trim() ? "pointer" : "not-allowed",
          }}
        >
          Pošalji
        </button>
      </div>
    </div>
  );
}

export default Chat;
