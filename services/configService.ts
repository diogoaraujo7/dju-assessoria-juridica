export const getApiKey = (): string => {
    const key = process.env.API_KEY;
    
    if (!key) {
        console.error("Critical Configuration Error: API_KEY is missing.");
        throw new Error("API Key not configured. Please check your environment settings.");
    }
    
    return key;
};