import { seed } from "./seed";
import { prisma } from "../src/lib/prisma";

seed()
    .catch((error) => {
        console.error("Seeding Failed", error.message);
        process.exitCode = 1;
    }).finally(async () => {
        await prisma.$disconnect();
    });