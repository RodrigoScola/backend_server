import supertest from 'supertest';
import { app } from './src/app';
import { connection } from './src/db';

export const dbconnection = connection;

export const App = supertest(app);
