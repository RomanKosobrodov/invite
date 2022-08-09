import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoRefreshToken,
} from "amazon-cognito-identity-js";

var auth_data = {
  UserPoolId: "",
  ClientId: "",
};

async function SignIn(username, password) {
  let userPool = new CognitoUserPool(auth_data);
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

async function Refresh(username, token) {
  let userPool = new CognitoUserPool(auth_data);
  const user = {
    Username: username,
    Pool: userPool,
  };
  let cognitoUser = new CognitoUser(user);
  const rt = new CognitoRefreshToken({ RefreshToken: token });
  return new Promise(function (resolve, reject) {
    cognitoUser.refreshSession(rt, {
      onFailure: reject,
      onSuccess: resolve,
    });
  });
}

function StoreAndRedirect(cognito_response) {
  const params = new URLSearchParams(document.location.search);
  const { accessToken, refreshToken } = cognito_response;
  console.log(`access: ${JSON.stringify(accessToken)}`);
  console.log(`refresh: ${JSON.stringify(refreshToken)}`);
  const max_age = accessToken.payload.exp - accessToken.payload.auth_time;
  document.cookie = `token=${accessToken.jwtToken}; Secure; SameSite=Lax; Path=/; Max-Age=${accessToken.payload.exp}`;
  sessionStorage.setItem("username", username);
  sessionStorage.setItem("refresh_token", refreshToken.token);
  const resource_uri = params.get("f");
  if (resource_uri) {
    console.log("redirecting to '" + resource_uri + "'");
    window.location.replace(resource_uri);
  }
}

window.addEventListener(
  "load",
  async () => {
    const upp = await fetch("/f8kjaeUK4920BDiewr7/").then((r) => r.json());
    auth_data.UserPoolId = upp.upid;
    auth_data.ClientId = upp.cid;
    let f = document.getElementById("sign-in-form");
    const params = new URLSearchParams(document.location.search);
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      SignIn(username, password)
        .then(StoreAndRedirect)
        .catch((e) => {
          console.error("Authentication failed with the following error:");
          console.error(e);
          document.getElementById("username").value = "";
          document.getElementById("password").value = "";
        });
    });
    if (params.get("expired")) {
      console.log("Token is expired");
      const saved_user = sessionStorage.getItem("username");
      if (!saved_user) {
        console.log("User name was not stored.");
        return;
      }
      const refresh_token = sessionStorage.getItem("refresh_token");
      if (!refresh_token) {
        console.log("Refresh token was not stored.");
        return;
      }
      Refresh(saved_user, refresh_token)
        .then(StoreAndRedirect)
        .catch((e) => {
          console.error("Token refresh failed with the following error:");
          console.error(e);
          document.getElementById("username").value = "";
          document.getElementById("password").value = "";
        });
    }
    const error_message = params.get("error");
    if (error_message) {
      console.error(error_message);
    }
  },
  false
);
