import cors from 'cors';
import express from 'express';
import fs from 'fs';
import morgan from 'morgan';
import path from 'path';
import { __PROD__ } from './constants';
import { categoryRouter } from './rotas/categorias/categorias';
import { contratoRouter } from './rotas/contrato/contrato';
import { eventosRouter } from './rotas/eventos/eventos';
import { faixa_etaria_router } from './rotas/faixa_etaria/faixa_etaria';
import { localRouter } from './rotas/locais/locais';
import { usuariosRouter } from './rotas/users/usuarios';
import { logger } from './server';

export const app = express();

app.post('/', (req, _, next) => {
	logger.debug(req.url);
	logger.debug(JSON.stringify(req.body));
	next();
});

const accessLogStream = fs.createWriteStream(path.join(__dirname, '..', 'data', 'logs', 'access.log'), { flags: 'a' });
app.use(
	morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer"', {
		stream: accessLogStream,
	})
);

app.use(morgan('combined', { stream: accessLogStream }));
if (__PROD__) {
	app.use(morgan('common'));
} else {
	app.use(morgan('dev'));
}
app.use(cors({ origin: '*', credentials: false }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/categorias', categoryRouter);
app.use('/locais', localRouter);
app.use('/faixa_etaria', faixa_etaria_router);
app.use('/contratos', contratoRouter);
app.use('/usuarios', usuariosRouter);
app.use('/eventos', eventosRouter);
