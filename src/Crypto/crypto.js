// src/crypto.js

// Generiše RSA ključ par
export async function generateKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
  return keyPair;
}

// Export javnog ključa u base64 string
export async function exportPublicKey(key) {
  const spki = await window.crypto.subtle.exportKey("spki", key);
  const b64 = btoa(String.fromCharCode(...new Uint8Array(spki)));
  return b64;
}

// Import javnog ključa iz base64 stringa
export async function importPublicKey(b64) {
  const binary = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return await window.crypto.subtle.importKey(
    "spki",
    binary.buffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  );
}

// Šifrovanje poruke javnim ključem
export async function encryptMessage(publicKey, message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    publicKey,
    data
  );
  // Pretvori u base64 da može da se šalje kao string
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

// Dešifrovanje poruke privatnim ključem
export async function decryptMessage(privateKey, encryptedB64) {
  const encrypted = Uint8Array.from(atob(encryptedB64), (c) => c.charCodeAt(0));
  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    privateKey,
    encrypted.buffer
  );
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}
