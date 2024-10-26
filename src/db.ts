import { Knex, knex } from 'knex';

// const mysqlconfig = {
// 	client: 'mysql2',
// 	// connection: process.env.DATABASE_URL ?? global.DATABASE_URL,
// 	connection: DATABASE_URL,
// 	pool: {
// 		min: 2,
// 		max: 10,
// 	},
// 	acquireConnectionTimeout: 60000,
// 	migrations: {
// 		tableName: 'knex_migrations',
// 	},
// };

const sqliteconfig = {
	client: 'sqlite3',
	useNullAsDefault: true,

	connection: {
		filename: './data/db.sqlite3',
	},
};

export const config: { [key: string]: Knex.Config } = {
	development: sqliteconfig,
	test: sqliteconfig,
	staging: sqliteconfig,
	production: sqliteconfig,
	// staging: mysqlconfig,
	// production: mysqlconfig,
};

const node_env = 'development';
const currentConfig = config[node_env];

if (!currentConfig) {
	throw new Error('config not found, looking for ' + node_env);
}
export const connection = knex(currentConfig);
