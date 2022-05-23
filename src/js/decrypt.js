import * as openpgp from "openpgp";
import { PRIVATE_KEY, PASS_PHRASE } from "./secret.js";

async function DecryptMessage() {
  const encrypted = document.getElementById("encrypted").value;

  console.log(JSON.stringify({ PRIVATE_KEY }));

  const privateKey = await openpgp.decryptKey({
    privateKey: await openpgp.readPrivateKey({ armoredKey: PRIVATE_KEY }),
    passphrase: PASS_PHRASE,
  });

  const { data: decrypted, signatures } = await openpgp.decrypt({
    message: await openpgp.readMessage({ armoredMessage: encrypted }),
    decryptionKeys: privateKey,
  });

  console.log(signatures);

  document.getElementById("message").value = decrypted;
}

window.addEventListener(
  "load",
  () => {
    let f = document.getElementById("decrypt-form");
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      DecryptMessage();
    });
  },
  false
);
