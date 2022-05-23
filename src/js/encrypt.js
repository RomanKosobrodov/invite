import * as openpgp from "openpgp/lightweight";
import { PUBLIC_KEY } from "./secret.js";

async function EncryptMessage() {
  const msg = document.getElementById("message").value;
  const pk = await openpgp.readKey({ armoredKey: PUBLIC_KEY });
  const encrypted = await openpgp.encrypt({
    message: await openpgp.createMessage({ text: msg }),
    encryptionKeys: pk,
  });
  document.getElementById("encrypted").value = encrypted;
}

window.addEventListener(
  "load",
  async (e) => {
    const { privateKey, publicKey } = await openpgp.generateKey({
      type: "ecc",
      curve: "curve25519",
      userIDs: [
        { name: "Vintage Camera User", email: "guest@vintage-camera.pictures" },
      ],
      passphrase: "You press the button, we do the rest",
      format: "armored",
    });

    //console.log(privateKey);
    //console.log(publicKey);

    let f = document.getElementById("encrypt-form");
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      EncryptMessage();
    });
  },
  false
);
