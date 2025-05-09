import React, { useState, useEffect } from "react";
import { signUp, signIn, signOut, respondToNewPasswordChallenge, refreshAccessToken } from "./auth";



const App: React.FC = () => {
  const [login, setLogin] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [userAuthenticated, setUserAuthenticated] = useState<boolean>(
    !!localStorage.getItem("accessToken")
  );
  const [challengeRequired, setChallengeRequired] = useState<boolean>(false);
  const [session, setSession] = useState<string>(""); // Stores Cognito session for password change

  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem("accessToken");
      const idToken = localStorage.getItem("idToken");
      const refreshToken = localStorage.getItem("refreshToken");

      if (!token && refreshToken) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          setUserAuthenticated(true);
        } else {
          signOut(); // 🔴 Token refresh failed → Log the user out
        }
      } else if (token && idToken) {
        setUserAuthenticated(true);
        const decoded = decodeToken(idToken);
        if (decoded) setLogin(decoded.preferred_username || decoded.email || decoded.sub);
      } else {
        signOut(); // 🔴 No valid tokens → Log the user out
      }
    };

    checkToken();
  }, []);


  const decodeToken = (token: string) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1])); // Base64 decode
      return payload; // Contains user details
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  // ✅ Handle Sign-In Flow (Detect Challenge)
  const handleSignIn = async () => {
    try {
      const authResult = await signIn(login, password);
      console.log("Authentication Result:", authResult);

      if ("ChallengeName" in authResult && authResult.ChallengeName === "NEW_PASSWORD_REQUIRED") {
        setSession(authResult.Session!); // Store session for the challenge response
        setChallengeRequired(true);

      } else if ("AccessToken" in authResult && authResult.AccessToken) {
        localStorage.setItem("accessToken", authResult.AccessToken);
        setUserAuthenticated(true);
      } else {
        alert("Authentication failed.");
      }
    } catch (error) {
      if (error instanceof Error) {
        alert("Sign-In error: " + error.message);
      } else {
        alert("Sign-In error: An unknown error occurred.");
      }
    }
  };

  // ✅ Handle New Password Submission
  const handleNewPassword = async () => {
    try {
      const authResult = await respondToNewPasswordChallenge(login, newPassword, session);
      if (authResult?.AccessToken) {
        localStorage.setItem("accessToken", authResult.AccessToken);
        setUserAuthenticated(true);
        setChallengeRequired(false);
      } else {
        alert("Password update failed.");
      }
    } catch (error) {
      if (error instanceof Error) {
        alert("Error setting new password: " + error.message);
      } else {
        alert("Error setting new password: An unknown error occurred.");
      }
    }
  };

  // ✅ Handle Sign-Up
  const handleSignUp = async () => {
    try {
      await signUp(login, password);
      alert("Sign-Up successful! You can now sign in.");
    } catch (error) {
      if (error instanceof Error) {
        alert("Sign-Up error: " + error.message);
      } else {
        alert("Sign-Up error: An unknown error occurred.");
      }
    }
  };

  // ✅ Handle Sign-Out
  const handleSignOut = () => {
    signOut();
    setUserAuthenticated(false);
  };

  return (
    <div>
      {!userAuthenticated ? (
        challengeRequired ? (
          <div>
            <h2>Set New Password</h2>
            <input
              type="password"
              placeholder="New Password"
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button onClick={handleNewPassword}>Submit</button>
          </div>
        ) : (
          <div>
            <h2>Sign Up</h2>
            <input
              type="text"
              placeholder="Login"
              onChange={(e) => setLogin(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={handleSignUp}>Sign Up</button>

            <h2>Sign In</h2>
            <input
              type="text"
              placeholder="Login"
              onChange={(e) => setLogin(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={handleSignIn}>Sign In</button>
          </div>
        )
      ) : (
        <div>
          <h2>Welcome, {login}</h2>
          <button onClick={handleSignOut}>Sign Out</button>
        </div>
      )}
    </div>
  );
};

export default App;