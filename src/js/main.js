import * as openpgp from "openpgp";
import { LAMBDA_URL, PUBLIC_KEY } from "./secret";

function onSignIn(result) {
  console.log(result);
  window.location.replace(REDIRECT_URL);
}

function onFailedSignIn(err) {
  if (err.name == "NotAuthorizedException") {
    document.getElementById("prompt").innerHTML = "Wrong Password. Try again.";
  }
  if (err.name == "UserNotFoundException") {
    document.getElementById("prompt").innerHTML = "Wrong User Name. Try again.";
  }
  document.getElementById("email").value = "";
  document.getElementById("password").value = "";
}

async function AuthenticateUser() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const message = JSON.stringify({ username, password });

  const pk = await openpgp.readKey({ armoredKey: PUBLIC_KEY });
  const encrypted = await openpgp.encrypt({
    message: await openpgp.createMessage({ text: message }),
    encryptionKeys: pk,
  });

  const response = await fetch(LAMBDA_URL, { method: "POST", body: encrypted });

  if (response.ok) {
    const { status, body } = response;
    if (status == 200) {
      const body = await response.text();
      const {
        jwtToken,
        authenticationTime,
        expires,
        refreshToken,
        redirectURL,
      } = JSON.parse(body);
      sessionStorage.setItem("jwtToken", jwtToken);
      sessionStorage.setItem("authenticationTime", authenticationTime);
      sessionStorage.setItem("expires", expires);
      sessionStorage.setItem("refreshToken", refreshToken);
      sessionStorage.setItem("redirectURL", redirectURL);

      const redirect = formURL(jwtToken, redirectURL);
      if (redirect) {
        console.log(`redirect to: ${redirect}`);
      } else {
        console.error("Wrong request");
      }
    } else {
      console.error(`Wrong response. Status ${status}: ${body}.`);
    }
  } else {
    console.error(`Failed with status ${response.status}.`);
  }
}

function formURL(token, url) {
  const queryString = window.location.search;
  const params = new URLSearchParams(queryString);
  if (params.has("f")) {
    const filename = params.get("f");
    return `${url}/${filename}?token=${token}`;
  }
  return null;
}

window.addEventListener(
  "load",
  async () => {
    const token = sessionStorage.getItem("jwtToken");
    const url = sessionStorage.getItem("redirectURL");
    if (token && url) {
      const redirect = formURL(token, url);
      if (redirect) {
        console.log(`redirect to: ${redirect}`);
      } else {
        console.error("Wrong request");
      }
    }
    let f = document.getElementById("sign-in-form");
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      AuthenticateUser();
    });
  },
  false
);
