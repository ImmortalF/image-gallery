import React, { useState } from "react";
import { signUp, respondToNewPasswordChallenge } from "./auth";
import { useAuth } from "./components/context/AuthContext"; // ✅ Import useAuth()
import ImageUpload from "./components/forms/ImageUpload";

const App: React.FC = () => {
  const [password, setPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [challengeRequired, setChallengeRequired] = useState<boolean>(false);
  const [session, setSession] = useState<string>(""); // Stores Cognito session for password change
  const { userAuthenticated, login, signIn, signOut } = useAuth(); // ✅ Get authentication state from context
  const [loginInput, setLoginInput] = useState<string>("");


  // ✅ Handle Sign-In Flow
  const handleSignIn = async () => {
    if (!loginInput) return alert("Please enter a valid login."); // ✅ Prevents null errors
    try {
      await signIn(loginInput, password);

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
    if (!loginInput) return alert("Please enter a valid login."); // ✅ Prevents null errors
    if (!session) return alert("Invalid session, please try logging in again."); // ✅ Ensure valid session



    try {
      const authResult = await respondToNewPasswordChallenge(loginInput, newPassword, session);
      if (authResult?.AccessToken) {
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
    if (!loginInput) return alert("Please enter a valid login.");
    try {
      await signUp(loginInput, password);
      alert("Sign-Up successful! You can now sign in.");
    } catch (error) {
      if (error instanceof Error) {
        alert("Sign-Up error: " + error.message);
      } else {
        alert("Sign-Up error: An unknown error occurred.");
      }
    }
  };

  return (
    <div>
      {!userAuthenticated ? (
        challengeRequired ? (
          <div>
            <h2>Set New Password</h2>
            <input type="password" placeholder="New Password" onChange={(e) => setNewPassword(e.target.value)} />
            <button onClick={handleNewPassword}>Submit</button>
          </div>
        ) : (
          <div>
            <h2>Sign Up</h2>
            <input type="text" placeholder="Login" onChange={(e) => setLoginInput(e.target.value)} />
            <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
            <button onClick={handleSignUp}>Sign Up</button>

            <h2>Sign In</h2>
            <input type="text" placeholder="Login" onChange={(e) => setLoginInput(e.target.value)} />
            <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
            <button onClick={handleSignIn}>Sign In</button>
          </div>
        )
      ) : (
        <div>
          <h2>Welcome, {login}</h2>
          <ImageUpload />
          <button onClick={signOut}>Sign Out</button>
        </div>
      )}
    </div>
  );
};

export default App;