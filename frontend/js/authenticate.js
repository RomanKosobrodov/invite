import { AUTH_DATA } from "./secret"; // TODO: get secrets from CloudFront Lambda@Edge on '/<random>'
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
    const params = new URLSearchParams(document.location.search);
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      SignIn(username, password)
        .then((r) => {
          const { accessToken, refreshToken } = r;
          console.log(`access: ${JSON.stringify(accessToken)}`);
          console.log(`refresh: ${JSON.stringify(refreshToken)}`);
          const max_age =
            accessToken.payload.exp - accessToken.payload.auth_time;
          document.cookie = `token=${accessToken.jwtToken}; Secure; SameSite=Lax; Path=/; Max-Age=${accessToken.payload.exp}`;
          sessionStorage.setItem("refresh_token", refreshToken.token);
          const resource_uri = params.get("f");
          if (resource_uri) {
            console.log("redirecting to '" + resource_uri + "'");
            window.location.replace(resource_uri);
          }
        })
        .catch((e) => {
          console.error("Authentication failed with the following error:");
          console.error(e);
        });
    });
    if (params.get("expired")) {
      console.log("Token is expired");
      // refresh token
    }
    const error_message = params.get("error");
    if (error_message) {
      console.error(error_message);
    }
  },
  false
);
