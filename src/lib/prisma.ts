import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

const connectionString = process.env.NODE_ENV === "test" ? process.env.DATABASE_URL_TEST : process.env.DATABASE_URL;

if(!connectionString){
    throw new Error("DATABASE_URL is not defined!")
}

const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({ adapter });