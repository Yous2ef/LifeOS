import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef,
    type ReactNode,
} from "react";
import type {
    GoogleUser,
    AuthState,
    TokenClient,
    TokenResponse,
} from "../types/services/auth";
import { GOOGLE_CONFIG } from "../config/google";
import { DriveService } from "../services/DriveService";

// Storage keys for auth persistence
const AUTH_STORAGE_KEY = "lifeos_auth";
const TOKEN_STORAGE_KEY = "lifeos_access_token";
const TOKEN_EXPIRY_KEY = "lifeos_token_expiry";

// Google userinfo endpoint
const USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v3/userinfo";

interface AuthContextType extends AuthState {
    login: () => void;
    logout: () => void;
    refreshToken: () => Promise<void>;
    isGoogleLoaded: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

// Helper to decode JWT token
const decodeJwt = (token: string): Record<string, unknown> => {
    try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split("")
                .map(
                    (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
                )
                .join("")
        );
        return JSON.parse(jsonPayload);
    } catch {
        return {};
    }
};

// Helper to extract user info from credential
const extractUserFromCredential = (credential: string): GoogleUser | null => {
    try {
        const payload = decodeJwt(credential);
        return {
            id: payload.sub as string,
            email: payload.email as string,
            name: payload.name as string,
            givenName: payload.given_name as string,
            familyName: payload.family_name as string,
            picture: payload.picture as string,
        };
    } catch {
        return null;
    }
};

// Helper to fetch user info from Google API using access token
const fetchUserInfo = async (
    accessToken: string
): Promise<GoogleUser | null> => {
    try {
        const response = await fetch(USERINFO_ENDPOINT, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch user info: ${response.status}`);
        }

        const data = await response.json();
        return {
            id: data.sub,
            email: data.email,
            name: data.name,
            givenName: data.given_name,
            familyName: data.family_name,
            picture: data.picture,
        };
    } catch (error) {
        console.error("Error fetching user info:", error);
        return null;
    }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [state, setState] = useState<AuthState>({
        isAuthenticated: false,
        isLoading: true,
        user: null,
        accessToken: null,
        error: null,
    });
    const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

    // Use refs to avoid dependency issues in callbacks
    const tokenClientRef = useRef<TokenClient | null>(null);
    const hasRestoredSession = useRef(false);
    const pendingTokenRequest = useRef(false);

    // Get saved user from localStorage
    const getSavedUser = useCallback((): GoogleUser | null => {
        try {
            const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
            if (savedAuth) {
                return JSON.parse(savedAuth) as GoogleUser;
            }
        } catch (error) {
            console.error("Error reading saved user:", error);
        }
        return null;
    }, []);

    // Check if we have a valid saved token
    const hasValidToken = useCallback((): boolean => {
        try {
            const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
            const tokenExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

            if (savedToken && tokenExpiry) {
                const expiryTime = parseInt(tokenExpiry, 10);
                // Token is valid if it expires in more than 5 minutes
                return Date.now() < expiryTime - 5 * 60 * 1000;
            }
        } catch (error) {
            console.error("Error checking token validity:", error);
        }
        return false;
    }, []);

    // Restore session from localStorage
    const restoreSession = useCallback(() => {
        const savedUser = getSavedUser();
        const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);

        if (savedUser && savedToken && hasValidToken()) {
            console.log("Restoring session from localStorage");
            setState({
                isAuthenticated: true,
                isLoading: false,
                user: savedUser,
                accessToken: savedToken,
                error: null,
            });
            hasRestoredSession.current = true;
            return true;
        }
        return false;
    }, [getSavedUser, hasValidToken]);

    // Request a new access token silently (without user interaction)
    const requestTokenSilently = useCallback(() => {
        if (!tokenClientRef.current || pendingTokenRequest.current) {
            return;
        }

        const savedUser = getSavedUser();
        if (!savedUser) {
            setState((prev) => ({ ...prev, isLoading: false }));
            return;
        }

        console.log("Requesting token silently...");
        pendingTokenRequest.current = true;

        // Set user info immediately, token will come async
        setState((prev) => ({
            ...prev,
            user: savedUser,
        }));

        // Request token with empty prompt for silent refresh
        try {
            tokenClientRef.current.requestAccessToken({ prompt: "" });
        } catch (error) {
            console.error("Silent token request failed:", error);
            pendingTokenRequest.current = false;
            setState((prev) => ({ ...prev, isLoading: false }));
        }
    }, [getSavedUser]);

    // Initialize Google Identity Services
    useEffect(() => {
        const handleTokenResponse = (response: TokenResponse) => {
            console.log("Token received successfully");
            pendingTokenRequest.current = false;

            const expiryTime = Date.now() + response.expires_in * 1000;

            localStorage.setItem(TOKEN_STORAGE_KEY, response.access_token);
            localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());

            // Try to get saved user, or fetch from Google API
            const savedUser = getSavedUser();

            if (!savedUser) {
                console.log("No saved user, fetching from Google API...");
                // Fetch user info asynchronously
                fetchUserInfo(response.access_token).then((fetchedUser) => {
                    if (fetchedUser) {
                        console.log("User info fetched:", fetchedUser.email);
                        localStorage.setItem(
                            AUTH_STORAGE_KEY,
                            JSON.stringify(fetchedUser)
                        );
                        setState({
                            isAuthenticated: true,
                            isLoading: false,
                            user: fetchedUser,
                            accessToken: response.access_token,
                            error: null,
                        });
                    } else {
                        // Failed to fetch user info
                        setState({
                            isAuthenticated: true,
                            isLoading: false,
                            user: null,
                            accessToken: response.access_token,
                            error: "Failed to fetch user info",
                        });
                    }
                });
            } else {
                // We have saved user
                setState({
                    isAuthenticated: true,
                    isLoading: false,
                    user: savedUser,
                    accessToken: response.access_token,
                    error: null,
                });
            }
        };

        const handleTokenError = (error: { type: string; message: string }) => {
            console.error("Token error:", error);
            pendingTokenRequest.current = false;

            // If silent refresh failed, clear saved session
            if (
                error.type === "popup_closed" ||
                error.type === "access_denied"
            ) {
                // User cancelled - don't clear session, just stop loading
                setState((prev) => ({ ...prev, isLoading: false }));
            } else {
                // Other error - session might be invalid
                localStorage.removeItem(AUTH_STORAGE_KEY);
                localStorage.removeItem(TOKEN_STORAGE_KEY);
                localStorage.removeItem(TOKEN_EXPIRY_KEY);

                setState({
                    isAuthenticated: false,
                    isLoading: false,
                    user: null,
                    accessToken: null,
                    error: null, // Don't show error for silent refresh failure
                });
            }
        };

        const handleCredentialResponse = (response: { credential: string }) => {
            const user = extractUserFromCredential(response.credential);

            if (user) {
                console.log("User signed in:", user.email);
                // Save user info
                localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));

                setState((prev) => ({
                    ...prev,
                    user,
                    error: null,
                }));

                // Now request access token for Drive API
                if (tokenClientRef.current) {
                    pendingTokenRequest.current = true;
                    tokenClientRef.current.requestAccessToken({
                        prompt: "consent",
                    });
                }
            } else {
                setState((prev) => ({
                    ...prev,
                    error: "Failed to extract user information",
                }));
            }
        };

        const setupGoogle = () => {
            if (!window.google) return;

            try {
                // Initialize Google Identity Services for Sign-In
                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CONFIG.clientId,
                    callback: handleCredentialResponse,
                    auto_select: true, // Enable auto-select for returning users
                    cancel_on_tap_outside: true,
                });

                // Initialize Token Client for Drive API access
                const client = window.google.accounts.oauth2.initTokenClient({
                    client_id: GOOGLE_CONFIG.clientId,
                    scope: GOOGLE_CONFIG.scopes,
                    callback: handleTokenResponse,
                    error_callback: handleTokenError,
                });

                tokenClientRef.current = client;
                setIsGoogleLoaded(true);
                console.log("Google SDK initialized");

                // After Google is loaded, check if we need to restore session
                // First try to restore from valid localStorage token
                if (restoreSession()) {
                    console.log("Session restored from localStorage");
                    return;
                }

                // If we have a saved user but no valid token, try to refresh silently
                const savedUser = getSavedUser();
                if (savedUser) {
                    console.log(
                        "Saved user found, attempting silent token refresh"
                    );
                    requestTokenSilently();
                } else {
                    // No saved user, just finish loading
                    setState((prev) => ({ ...prev, isLoading: false }));
                }
            } catch (error) {
                console.error("Error initializing Google:", error);
                setState((prev) => ({
                    ...prev,
                    isLoading: false,
                    error: "Failed to initialize Google Sign-In",
                }));
            }
        };

        const initializeGoogle = () => {
            if (window.google) {
                setupGoogle();
            } else {
                // Wait for Google script to load
                const checkGoogle = setInterval(() => {
                    if (window.google) {
                        clearInterval(checkGoogle);
                        setupGoogle();
                    }
                }, 100);

                // Timeout after 5 seconds - just continue without Google (guest mode)
                setTimeout(() => {
                    clearInterval(checkGoogle);
                    if (!window.google) {
                        console.warn(
                            "Google Sign-In not available in this environment. Continuing in guest mode."
                        );
                        setState((prev) => ({
                            ...prev,
                            isLoading: false,
                            // Don't set error - just continue in guest mode
                        }));
                        // Mark as "loaded" so button doesn't stay disabled
                        setIsGoogleLoaded(false);
                    }
                }, 5000);
            }
        };

        initializeGoogle();
    }, [getSavedUser, restoreSession, requestTokenSilently]);

    // Login function
    const login = useCallback(() => {
        if (!window.google) {
            setState((prev) => ({
                ...prev,
                error: "Google Sign-In not loaded",
            }));
            return;
        }

        // If we already have user info but no token, request token directly
        if (state.user && !state.accessToken && tokenClientRef.current) {
            pendingTokenRequest.current = true;
            tokenClientRef.current.requestAccessToken({ prompt: "consent" });
            return;
        }

        // Try the One Tap prompt first
        window.google.accounts.id.prompt((notification) => {
            if (
                notification.isNotDisplayed() ||
                notification.isSkippedMoment()
            ) {
                console.log("One Tap not displayed, using token client");
                // If One Tap not displayed, try with token client directly
                if (tokenClientRef.current) {
                    pendingTokenRequest.current = true;
                    tokenClientRef.current.requestAccessToken({
                        prompt: "select_account",
                    });
                }
            }
        });
    }, [state.user, state.accessToken]);

    // Logout function
    const logout = useCallback(() => {
        console.log("Logging out...");

        // Revoke token if exists
        if (state.accessToken && window.google) {
            window.google.accounts.oauth2.revoke(state.accessToken, () => {
                console.log("Token revoked");
            });
        }

        // Disable auto-select for next login
        if (window.google) {
            window.google.accounts.id.disableAutoSelect();
        }

        // Clear storage
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);

        // Reset state
        setState({
            isAuthenticated: false,
            isLoading: false,
            user: null,
            accessToken: null,
            error: null,
        });

        hasRestoredSession.current = false;
    }, [state.accessToken]);

    // Refresh token function
    const refreshToken = useCallback(async (): Promise<void> => {
        if (!tokenClientRef.current) {
            throw new Error("Token client not initialized");
        }

        return new Promise<void>((resolve, reject) => {
            const client = window.google?.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CONFIG.clientId,
                scope: GOOGLE_CONFIG.scopes,
                callback: (response: TokenResponse) => {
                    const expiryTime = Date.now() + response.expires_in * 1000;

                    localStorage.setItem(
                        TOKEN_STORAGE_KEY,
                        response.access_token
                    );
                    localStorage.setItem(
                        TOKEN_EXPIRY_KEY,
                        expiryTime.toString()
                    );

                    setState((prev) => ({
                        ...prev,
                        accessToken: response.access_token,
                    }));
                    resolve();
                },
                error_callback: (error) => {
                    reject(new Error(error.message));
                },
            });

            if (client) {
                client.requestAccessToken({ prompt: "" });
            } else {
                reject(new Error("Failed to create token client"));
            }
        });
    }, []);

    // Check token expiry periodically and refresh if needed
    useEffect(() => {
        if (!state.isAuthenticated || !state.accessToken) return;

        const checkTokenExpiry = () => {
            const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
            if (expiry) {
                const expiryTime = parseInt(expiry, 10);
                const timeUntilExpiry = expiryTime - Date.now();

                // Refresh if token expires in less than 5 minutes
                if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
                    console.log("Token expiring soon, refreshing...");
                    refreshToken().catch(console.error);
                }
            }
        };

        // Check immediately and then every minute
        checkTokenExpiry();
        const interval = setInterval(checkTokenExpiry, 60 * 1000);
        return () => clearInterval(interval);
    }, [state.isAuthenticated, state.accessToken, refreshToken]);

    // Sync access token with DriveService
    useEffect(() => {
        DriveService.setAccessToken(state.accessToken);
        console.log(
            "DriveService token updated:",
            state.accessToken ? "set" : "cleared"
        );
    }, [state.accessToken]);

    return (
        <AuthContext.Provider
            value={{
                ...state,
                login,
                logout,
                refreshToken,
                isGoogleLoaded,
            }}>
            {children}
        </AuthContext.Provider>
    );
};
