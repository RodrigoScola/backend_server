import dotenv from 'dotenv';
import { TableFields } from './src/types/db_types';
dotenv.config();

declare module 'knex/types/tables' {
	interface Tables extends TableFields {}
}
