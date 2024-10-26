import { Application, ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import 'express-async-errors';
import { app } from './app';
import { PORT } from './constants';
import { connection } from './db';
import { CuboAssert } from './lib/assert/assert';
import { ErrorHandler } from './lib/ErrorHandling/ErrorHandler';
import { Formatter } from './lib/formatter';
import { createLogger, Logging } from './lib/logger/createLogger';
import './process';
import { Contrato, Evento, FaixaEtaria, ItemStatus, Local, Usuario } from './types/db_types';

global.assert = new CuboAssert();

export const logger = new Logging(createLogger({ stout: true }));

initServer(app);

function initServer(app?: Application) {
	if (!app) return;

	const EFunction: ErrorRequestHandler = (
		err: Error,
		__: Request,
		res: Response,
		//!AAAAAAAAAAAAAAAAAAAA DO NOT REMOVE THIS
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		___: NextFunction
	) => {
		ErrorHandler.handle(err, res);
	};

	app.use(EFunction);

	app.listen(PORT, async () => {
		await Promise.all([
			connection.raw(`
		    create table if not exists categorias (
		       id INTEGER PRIMARY KEY AUTOINCREMENT,
		nome varchar(150),
		status int not null default 1,
		descricao text,
		parente int not null default -1
		    )
		    `),

			connection.raw(`
		        create table if not exists local (
		        id integer primary key autoincrement,

		nome varchar(150),
		descricao text,
		bairro varchar(150),
		cidade varchar(150),
		estado varchar(150),
		status integer not null default 1,
		categorias json,
		pais varchar(150)
		    )
		        `),

			connection.raw(`
		        create table if not exists faixa_etaria (
		        id integer primary key autoincrement,
		        nome varchar(150),
		        minIdade int not null,
		        status int not null default 1,
		        maxIdade int
		)
		    `),
			connection.raw(`
		        create table if not exists usuarios (
		        id integer primary key autoincrement,
				categorias json,
				cnpj varchar(52),
				data_nascimento timestamp not null,
				genero varchar(64) not null,
				nacionalidade varchar(64) not null,
				nome varchar(150) not null,
				prestador boolean not null default false,
				produtor boolean not null default false,
				status int not null default 1

		    )
		        `),
			connection.raw(`
		            create table if not exists eventos (
		        id integer primary key autoincrement,
				categorias json,
				comeca timestamp not null,
				faixa_etaria int ,
				local int,
				nome varchar(150),
				produtor int not null,
				termina timestamp,
				status int not null default 1
		            )
		            `),
			connection.raw(`
		                create table if not exists contrato (
		                id integer primary key autoincrement,
		                criadoEm timestamp default current_timestamp,
		                evento int not null,
		                prestadorId int not null,
		                produtorId int not null,
		                status int not null default 1
		            )
		                `),
		]);

		await Promise.all([createCategorias(), createLocais(), createFaixaEtaria(), await createUsuarios(), createEventos(), createContratos()]);

		logger.debug('Server started on port ' + PORT);
	});
}

async function createContratos() {
	const cont: Contrato[] = [
		{
			evento: 1,
			criadoEm: Formatter.toSqlTimeStamp(new Date()),
			id: 1,
			prestadorId: 1,
			produtorId: 2,
			status: ItemStatus.ATIVO,
		},
	];
	await connection('contrato').insert(cont).onConflict('id').merge();
}

async function createEventos() {
	const events: Evento[] = [
		{
			categorias: JSON.stringify([1]) as unknown as number[],
			comeca: Formatter.toSqlTimeStamp(new Date()),
			faixa_etaria: 1,
			id: 1,
			local: 1,
			nome: 'this namne',
			produtor: 1,
			termina: Formatter.toSqlTimeStamp(new Date()),
			status: ItemStatus.ATIVO,
		},
	];

	await connection('eventos').insert(events).onConflict('id').merge();
}

async function createUsuarios() {
	const users: Usuario[] = [
		{
			categorias: JSON.stringify([1]) as unknown as number[],
			cnpj: '0890fd80s',
			data_nascimento: Formatter.toSqlTimeStamp(new Date()),
			genero: 'Masculino',
			id: 1,
			nacionalidade: 'brasileiro',
			nome: 'rodrigo',
			prestador: true,
			produtor: false,
			status: ItemStatus.ATIVO,
		},

		{
			categorias: JSON.stringify([1]) as unknown as number[],
			cnpj: '0890fd80s',
			data_nascimento: Formatter.toSqlTimeStamp(new Date()),
			genero: 'Feminino',
			id: 1,
			nacionalidade: 'brasileiro',
			nome: 'Fernanda',
			prestador: false,
			produtor: true,
			status: ItemStatus.ATIVO,
		},
	];
	await connection('usuarios').insert(users).onConflict('id').merge();
}

async function createFaixaEtaria() {
	const faixas: FaixaEtaria[] = [
		{
			nome: 'Adulto',
			minIdade: 18,
			maxIdade: 60,
			status: ItemStatus.ATIVO,
			id: 1,
		},
		{
			nome: 'Idoso',
			minIdade: 60,
			maxIdade: undefined,
			status: ItemStatus.ATIVO,
			id: 2,
		},
		{
			nome: 'Jovem',
			minIdade: 12,
			maxIdade: 17,
			status: ItemStatus.ATIVO,
			id: 3,
		},
		{
			nome: 'Infantil',
			minIdade: 0,
			maxIdade: 12,
			status: ItemStatus.ATIVO,
			id: 4,
		},
	];

	await connection('faixa_etaria').insert(faixas).onConflict('id').merge();
}

async function createLocais() {
	const locais: Local[] = [
		{
			id: 1,
			cidade: 'Caxias Do Sul',
			descricao: 'tulipa restaurante',
			estado: 'RS',
			nome: 'restaurante tulipa',
			status: ItemStatus.ATIVO,
			categorias: JSON.stringify([1]) as unknown as number[],
			pais: 'brasil',
			bairro: '',
		},
		{
			id: 2,
			cidade: 'Caxias Do Sul',
			descricao: 'tulipa xis',
			estado: 'RS',
			nome: 'xis do tulipa',
			status: ItemStatus.ATIVO,
			categorias: JSON.stringify([1]) as unknown as number[],
			pais: 'brasil',
			bairro: '',
		},
	];
	await connection('local').insert(locais).onConflict('id').merge();
}

async function createCategorias() {
	const baseIds = {
		alimentacao: 1,
		entreterimento: 2,
		infraestrutura: 3,
		cardapio: 4,
		restricao: 5,
		artes_cenicas: 6,
		musica: 7,
		danca: 8,
		atendimento: 9,
		cenario: 10,
		limpeza: 11,
		som: 12,
	};
	await connection('categorias')
		.insert(
			[
				{ id: baseIds.alimentacao, nome: 'Alimentacao', parente: -1, status: ItemStatus.ATIVO, descricao: 'descricao para alimentacao' },
				{
					id: baseIds.entreterimento,
					nome: 'Entreterimento',
					parente: -1,
					status: ItemStatus.ATIVO,
					descricao: 'descricao para Entreterimento',
				},
				{
					id: baseIds.infraestrutura,
					nome: 'Infraestrutura',
					parente: -1,
					status: ItemStatus.ATIVO,
					descricao: 'descricao para Infraestrutura',
				},
				{
					id: baseIds.cardapio,
					nome: 'cardapio',
					parente: baseIds.alimentacao,
					status: ItemStatus.ATIVO,
					descricao: 'descricao para cardapio',
				},
				{
					id: baseIds.restricao,
					nome: 'restricao',
					parente: baseIds.alimentacao,
					status: ItemStatus.ATIVO,
					descricao: 'descricao para restricao',
				},
				{
					id: baseIds.artes_cenicas,
					nome: 'artes_cenicas',
					parente: baseIds.entreterimento,
					status: ItemStatus.ATIVO,
					descricao: 'descricao para artes_cenicas',
				},
				{
					id: baseIds.musica,
					nome: 'musica',
					parente: baseIds.entreterimento,
					status: ItemStatus.ATIVO,
					descricao: 'descricao para musica',
				},
				{
					id: baseIds.danca,
					nome: 'danca',
					parente: baseIds.entreterimento,
					status: ItemStatus.ATIVO,
					descricao: 'descricao para danca',
				},
				{
					id: baseIds.atendimento,
					nome: 'atendimento',
					parente: baseIds.infraestrutura,
					status: ItemStatus.ATIVO,
					descricao: 'descricao para atendimento',
				},
				{
					id: baseIds.cenario,
					nome: 'cenario',
					parente: baseIds.infraestrutura,
					status: ItemStatus.ATIVO,
					descricao: 'descricao para cenario',
				},
				{
					id: baseIds.limpeza,
					nome: 'limpeza',
					parente: baseIds.infraestrutura,
					status: ItemStatus.ATIVO,
					descricao: 'descricao para limpeza',
				},
				{ id: baseIds.som, nome: 'som', parente: baseIds.infraestrutura, status: ItemStatus.ATIVO, descricao: 'descricao para som' },
			],
			'*'
		)
		.onConflict('id')
		.merge();
}
