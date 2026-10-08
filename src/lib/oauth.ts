import { Configuration, discovery, ClientSecretPost } from "openid-client";

const issuer = new URL(process.env.GOOGLE_ISSUER!);

let googleClient: Configuration | undefined;

export async function getGoogleClient(): Promise<Configuration>{
    if(googleClient){
        return googleClient;
    };

    googleClient = await discovery(
        issuer, 
        process.env.GOOGLE_CLIENT_ID!, 
        {
            redirect_uris: [process.env.GOOGLE_CALLBACK_URL!],
            response_types: ["code"]
        },
        ClientSecretPost(process.env.GOOGLE_CLIENT_SECRET!)
    );

    return googleClient;
};