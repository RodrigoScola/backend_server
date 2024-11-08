import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT || 3000;

export const __DEV__ = process.env.NODE_ENV === 'development';
export const __PROD__ = process.env.NODE_ENV === 'production';
