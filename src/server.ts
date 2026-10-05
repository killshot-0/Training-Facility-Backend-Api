import app from "./app.js";
import { env } from './config/env.js';
import { prisma } from "./lib/prisma.js";

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server running on http:localhost:${PORT}`);
});

async function shutdown(signal: string){
    console.log(`${signal} recieved: shutting down!`);
    server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
    });
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));