import { AUTH_DATA } from "./secret";
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
} from "amazon-cognito-identity-js";

export const SignIn = (
  username,
  password,
  callbackSuccess,
  callbackFailure
) => {
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

  cognitoUser.authenticateUser(authenticationDetails, {
    onFailure: callbackFailure,
    onSuccess: callbackSuccess,
  });
};
