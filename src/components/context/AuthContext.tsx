import { createContext, useEffect, useState, useContext } from "react";
import { refreshAccessToken, signIn, signOut } from "../../auth";
import type { AuthenticationResultType } from "@aws-sdk/client-cognito-identity-provider";

type AuthContextType = {
    userAuthenticated: boolean;
    login: string | null;
    signIn: (username: string, password: string) => Promise<AuthenticationResultType | { ChallengeName: string; Session: string | undefined; }>;
    signOut: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [userAuthenticated, setUserAuthenticated] = useState<boolean>(false);
    const [login, setLogin] = useState<string | null>(null);

    useEffect(() => {
        const checkToken = async () => {
            if (userAuthenticated) return; // ✅ Prevent unnecessary checks

            const token = localStorage.getItem("accessToken");
            const idToken = localStorage.getItem("idToken");

            if (!token) {
                const newToken = await refreshAccessToken();
                if (newToken) {
                    setUserAuthenticated(true);
                } else {
                    signOutWrapper();
                }
            } else {
                setUserAuthenticated(true);
                if (idToken) {
                    const decoded = JSON.parse(atob(idToken.split(".")[1]));
                    setLogin(decoded.preferred_username || decoded.email || decoded.sub || null);
                }
            }
        };

        checkToken();
    }, [userAuthenticated]); // ✅ Only runs when authentication state changes

    const signInWrapper = async (username: string, password: string): Promise<AuthenticationResultType | { ChallengeName: string; Session: string | undefined; }> => {
        try {
            const authResult = await signIn(username, password);

            if ("ChallengeName" in authResult && authResult.ChallengeName === "NEW_PASSWORD_REQUIRED") {
                return authResult; // ✅ Return challenge response
            }

            if ("AccessToken" in authResult) {
                if (authResult?.AccessToken) {
                    localStorage.setItem("accessToken", authResult.AccessToken);
                };
                setUserAuthenticated(true);
                setLogin(username);
                return authResult; // ✅ Return authentication result
            }

            throw new Error("Authentication failed."); // ✅ Ensure we never return `null`
        } catch (error) {
            console.error("Sign-in error:", error);
            throw new Error(error as string); // ✅ Throw error instead of returning `null`
        }
    };

    const signOutWrapper = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setUserAuthenticated(false); // ✅ Immediately trigger re-render
        setLogin(null); // ✅ Clears login state instantly
    };

    return (
        <AuthContext.Provider value={{ userAuthenticated, login, signIn: signInWrapper, signOut: signOutWrapper }}>
            {children}
        </AuthContext.Provider>
    );
};



export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

