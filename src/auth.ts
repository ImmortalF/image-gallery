import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand
} from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({ region: "us-east-2" });
const CLIENT_ID = "71n822ej8dbmp4jkb3qg5un16d"; // Replace with your actual Cognito App Client ID

// ✅ Sign-Up Function
export const signUp = async (email: string, password: string) => {
  try {
    const command = new SignUpCommand({
      ClientId: CLIENT_ID,
      Username: email,
      Password: password,
    });

    const response = await cognitoClient.send(command);
    console.log("Sign-Up Successful:", response);
    return response;
  } catch (error) {
    console.error("Sign-Up Failed:", error);
    throw new Error((error as Error).message);
  }
};

// ✅ Sign-In Function (Handles Challenge Detection)
export const signIn = async (username: string, password: string) => {
  try {
    const authCommand = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    });

    const authResponse = await cognitoClient.send(authCommand);

    // 🚨 Handle NEW_PASSWORD_REQUIRED challenge by returning session
    if (authResponse.ChallengeName === "NEW_PASSWORD_REQUIRED") {
      return { ChallengeName: "NEW_PASSWORD_REQUIRED", Session: authResponse.Session };
    }

    if (authResponse.AuthenticationResult?.AccessToken && authResponse.AuthenticationResult?.RefreshToken && authResponse.AuthenticationResult?.IdToken) {
      localStorage.setItem("accessToken", authResponse.AuthenticationResult.AccessToken);
      localStorage.setItem("idToken", authResponse.AuthenticationResult.IdToken)
      localStorage.setItem("refreshToken", authResponse.AuthenticationResult.RefreshToken);
      return authResponse.AuthenticationResult;
    }

    throw new Error("Authentication failed.");
  } catch (error) {
    console.error("Login failed:", error);
    throw new Error((error as Error).message);
  }
};

// ✅ Handle NEW_PASSWORD_REQUIRED Challenge Separately
export const respondToNewPasswordChallenge = async (
  username: string,
  newPassword: string,
  session: string,
) => {
  try {
    const challengeCommand = new RespondToAuthChallengeCommand({
      ChallengeName: "NEW_PASSWORD_REQUIRED",
      ClientId: CLIENT_ID,
      ChallengeResponses: {
        USERNAME: username,
        NEW_PASSWORD: newPassword,
        preferred_username: username
      },
      Session: session, // Ensure session is passed
    });

    const response = await cognitoClient.send(challengeCommand);

    // ✅ Store tokens after successful password change
    if (response.AuthenticationResult?.AccessToken) {
      localStorage.setItem("accessToken", response.AuthenticationResult.AccessToken);
      return response.AuthenticationResult;
    }

    throw new Error("Password update failed.");
  } catch (error) {
    console.error("Error responding to challenge:", error);
    throw new Error((error as Error).message);
  }
};

export const signOut = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  console.log("User signed out");
};

export const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  const accessToken = localStorage.getItem("accessToken");
  if (!refreshToken) return null; // No refresh token means the user must log in again.

  if (accessToken && !isTokenExpired(accessToken)) {
    return accessToken;
  }

  try {
    const command = new InitiateAuthCommand({
      AuthFlow: "REFRESH_TOKEN_AUTH",
      ClientId: CLIENT_ID,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    });

    const response = await cognitoClient.send(command);
    if (response.AuthenticationResult?.AccessToken) {
      localStorage.setItem("accessToken", response.AuthenticationResult.AccessToken);
      return response.AuthenticationResult.AccessToken;
    }
  } catch (error) {
    console.error("Token refresh failed:", error);
    return null;
  }
};

const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1])); // Decode JWT payload
    const exp = payload.exp * 1000; // Convert expiration to milliseconds
    return Date.now() >= exp; // Compare with current time
  } catch (error) {
    console.error("Error decoding token:", error);
    return true; // Default to expired if token is invalid
  }
};
