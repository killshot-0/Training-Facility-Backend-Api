import bcrypt from 'bcrypt';
import { PasswordInput } from '../schemas/auth.schemas.js';

export function hashPassword(password: PasswordInput): Promise<string>{
    return bcrypt.hash(password, 12)
};

export async function verifyPassword(password: PasswordInput, hash: string): Promise<boolean>{
    try {
        return await bcrypt.compare(password, hash)      
    } catch (error) {
        return false
    }
};