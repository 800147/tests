// https://steveseguin.github.io/vapid/

// Generate VAPID keys using Web Crypto API
export async function generateVAPIDKeys() {
  try {
    // Generate a key pair using ECDSA with P-256 curve
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      true, // extractable
      ["sign", "verify"],
    );

    // Export the public key to raw format
    const rawPublicKey = await window.crypto.subtle.exportKey(
      "raw",
      keyPair.publicKey,
    );

    // Export the private key to PKCS8 format
    const pkcs8PrivateKey = await window.crypto.subtle.exportKey(
      "pkcs8",
      keyPair.privateKey,
    );

    // Convert the ArrayBuffers to Base64URL strings
    const publicKeyBase64 = arrayBufferToBase64URL(rawPublicKey);
    const privateKeyBase64 = arrayBufferToBase64URL(pkcs8PrivateKey);

    return {
      publicKey: publicKeyBase64,
      privateKey: privateKeyBase64,
    };
  } catch (error) {
    console.error("Error generating VAPID keys:", error);
    return null;
  }
}

// Helper function to convert ArrayBuffer to Base64URL string
function arrayBufferToBase64URL(buffer) {
  // Convert ArrayBuffer to regular Base64
  const base64 = btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));

  // Convert regular Base64 to Base64URL
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
