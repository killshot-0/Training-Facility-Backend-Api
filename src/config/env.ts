import 'dotenv/config';
import { envSchema } from '../schemas/env.schemas.js';

export const env = envSchema.parse(process.env)