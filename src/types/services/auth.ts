// Authentication Types

export interface GoogleUser {
    id: string;
    email: string;
    name: string;
    givenName: string;
    familyName: string;
    picture: string;
}

export interface AuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: GoogleUser | null;
    accessToken: string | null;
    error: string | null;
}

export interface TokenResponse {
    access_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
}

// Google Identity Services types
declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: GoogleIdConfig) => void;
                    renderButton: (element: HTMLElement, config: GoogleButtonConfig) => void;
                    prompt: (callback?: (notification: PromptNotification) => void) => void;
                    revoke: (email: string, callback: () => void) => void;
                    disableAutoSelect: () => void;
                };
                oauth2: {
                    initTokenClient: (config: TokenClientConfig) => TokenClient;
                    revoke: (token: string, callback?: () => void) => void;
                };
            };
        };
    }
}

interface GoogleIdConfig {
    client_id: string;
    callback: (response: CredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    context?: "signin" | "signup" | "use";
    itp_support?: boolean;
    use_fedcm_for_prompt?: boolean;
}

interface GoogleButtonConfig {
    type?: "standard" | "icon";
    theme?: "outline" | "filled_blue" | "filled_black";
    size?: "large" | "medium" | "small";
    text?: "signin_with" | "signup_with" | "continue_with" | "signin";
    shape?: "rectangular" | "pill" | "circle" | "square";
    logo_alignment?: "left" | "center";
    width?: number;
    locale?: string;
}

interface CredentialResponse {
    credential: string;
    select_by: string;
    clientId?: string;
}

interface PromptNotification {
    isDisplayed: () => boolean;
    isNotDisplayed: () => boolean;
    getNotDisplayedReason: () => string;
    isSkippedMoment: () => boolean;
    getSkippedReason: () => string;
    isDismissedMoment: () => boolean;
    getDismissedReason: () => string;
}

interface TokenClientConfig {
    client_id: string;
    scope: string;
    callback: (response: TokenResponse) => void;
    error_callback?: (error: { type: string; message: string }) => void;
    prompt?: string;
}

interface TokenClient {
    requestAccessToken: (config?: { prompt?: string }) => void;
}

export type {
    GoogleIdConfig,
    GoogleButtonConfig,
    CredentialResponse,
    PromptNotification,
    TokenClientConfig,
    TokenClient,
};
