import { SignIn } from "./authenticate";
import { REDIRECT_URL } from "./secret";

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

function AuthenticateUser(success, failure) {
  document.getElementById("sign-in-form").style.visibility = "hidden";
  const username = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  console.log(username, password);
  SignIn(username, password, success, failure);
}

window.onload = function () {
  console.log("window is loading ...");
  let f = document.getElementById("sign-in-form");
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    AuthenticateUser(onSignIn, onFailedSignIn);
  });
};
