/// <reference types="vite/client" />

declare namespace NodeJS {
    interface ProcessEnv {
        GEMINI_API_KEY?: string;
    }
}

declare const process: {
    env: {
        GEMINI_API_KEY?: string;
    };
};
