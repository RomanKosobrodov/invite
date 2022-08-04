import { AUTH_DATA } from "./secret";
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
} from "amazon-cognito-identity-js";

async function SignIn(username, password) {
  let userPool = new CognitoUserPool(AUTH_DATA);
  const user = {
    Username: username,
    Pool: userPool,
  };
  let cognitoUser = new CognitoUser(user);

  let authenticationData = {
    Username: username,
    Password: password,
  };
  let authenticationDetails = new AuthenticationDetails(authenticationData);

  return new Promise(function (resolve, reject) {
    cognitoUser.authenticateUser(authenticationDetails, {
      onFailure: reject,
      onSuccess: resolve,
    });
  });
}

window.addEventListener(
  "load",
  async () => {
    let f = document.getElementById("sign-in-form");
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      SignIn(username, password)
        .then((r) => {
          const { accessToken, refreshToken } = r;
          console.log(`access: ${JSON.stringify(accessToken)}`);
          console.log(`refresh: ${JSON.stringify(refreshToken)}`);
        })
        .catch((e) => {
          console.log("Authentication failed with the following error:");
          console.log(e);
        });
    });
  },
  false
);
