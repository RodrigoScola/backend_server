import { Request, Response, Router } from 'express';
import { Tspec } from 'tspec';
import { connection } from '../../db';
import { ContextBuilder } from '../../lib/context/ContextBuilder';
import { ContextFactory } from '../../lib/context/DatabaseContext';
import {
	BadRequestError,
	InternalError,
	InvalidItemError,
	NotFoundError,
} from '../../lib/ErrorHandling/ErrorHandler';
import { addCategorias } from '../../lib/utils';
import { logger } from '../../server';
import {
	ApiDeleteStatus,
	ApiGetStatus,
	ApiPostStatus,
	ApiUpdateStatus,
	QueryFilter,
} from '../../types/api_types';
import { Evento, ItemStatus, NewEvento } from '../../types/db_types';
import { BoundsValidator } from '../../Validation/ItemValidation/BoundsValidator';
import { ValidationCluster } from '../../Validation/ItemValidation/ItemValidationCluster';

export const eventosRouter = Router();

async function pegaEventos(
	req: Request<
		unknown,
		Evento[],
		unknown,
		QueryFilter<
			Omit<Evento, 'categorias'> & {
				categorias: number[];
			}
		>
	>,
	res: Response<Evento[]>
) {
	const query = connection('eventos').whereNot('status', ItemStatus.DELETADO);

	const params = ContextBuilder.FromParameters(addCategorias(req.query, query), Evento);

	const eventos: Evento[] = await ContextFactory.fromRequest('eventos', query, req)
		.SetParameters(params)
		.Build();

	res.json(eventos);
}

async function pegaEvento(
	req: Request<{ id: string }, Evento, unknown, QueryFilter<Evento>>,
	res: Response<Evento>
) {
	assert.ok(req.params.id, 'Id Nao Especificado', BadRequestError);

	const eventoId = Number(req.params.id);
	assert.ok(eventoId, 'Id do evento Invalido', BadRequestError);

	const evento = await ContextFactory.fromRequest(
		'eventos',
		connection('eventos').where('id', eventoId).whereNot('status', ItemStatus.DELETADO),
		req
	)
		.Build()
		.first();

	assert.ok(evento, 'evento Nao achado', NotFoundError);

	res.json(evento);
}

async function postaEvento(req: Request<unknown, Evento, NewEvento, QueryFilter<Evento>>, res: Response<Evento>) {
	assert.ok(req.body, 'Corpo do evento invalido', BadRequestError);

	const cleaned = req.body;

	const validator = new ValidationCluster().add(
		new BoundsValidator(NewEvento, { min: -1, max: 832901803928 })
	);

	if (!validator.isValid(cleaned)) {
		const errors = validator.getErrors();
		logger.error('nao pode criar eventos', JSON.stringify(errors, null, 1));
		throw new InvalidItemError(errors);
	}

	let evento: Evento | undefined;

	try {
		[evento] = await connection('eventos').insert(cleaned).returning('*');
	} catch (err) {
		logger.error('nao pode criar eventos', err);
	}
	assert.ok(evento, 'nao pode criar evento', InternalError);

	res.json(evento);
}

async function updateEvento(
	req: Request<{ id: string }, Evento, NewEvento, QueryFilter<Evento>>,
	res: Response<Evento>
) {
	assert.ok(req.params.id, 'Id Nao Especificado', BadRequestError);

	const eventoId = Number(req.params.id);
	assert.ok(eventoId, 'Id do evento Invalida', BadRequestError);
	assert.ok(req.body, 'Corpo do evento invalido', BadRequestError);

	const prevEvento = await ContextFactory.fromRequest(
		'eventos',
		connection('eventos').andWhere('id', eventoId).whereNot('status', ItemStatus.DELETADO),
		req
	)
		.Build()
		.first();

	assert.ok(prevEvento, 'Evento Nao achado', NotFoundError);

	const cleaned = req.body;

	const validator = new ValidationCluster().add(
		new BoundsValidator(NewEvento, { min: -1, max: 832901803928 })
	);

	if (!validator.isValid(cleaned)) {
		const errors = validator.getErrors();
		logger.error('nao pode criar Evento', JSON.stringify(errors, null, 1));
		throw new InvalidItemError(errors);
	}

	//@ts-ignore
	cleaned.id = eventoId;

	let evento: Evento | undefined;

	try {
		[evento] = await connection('eventos')
			.update(cleaned)
			.where('id', eventoId)
			.whereNot('status', ItemStatus.DELETADO)
			.returning('*');
	} catch (err) {
		logger.error('nao pode criar evento', err);
	}
	assert.ok(evento, 'nao pode criar evento', InternalError);

	res.json(evento);
}

async function deletaEvento(
	req: Request<{ id: string }, boolean, NewEvento, QueryFilter<Evento>>,
	res: Response<boolean>
) {
	assert.ok(req.params.id, 'Id Nao Especificado', BadRequestError);

	const eventoId = Number(req.params.id);
	assert.ok(eventoId, 'Id do evento Invalida', BadRequestError);

	const evento = await ContextFactory.fromRequest(
		'eventos',
		connection('eventos').whereNot('status', ItemStatus.DELETADO).andWhere('id', eventoId),
		req
	)
		.Build()
		.first();

	assert.ok(evento, 'evento Nao achada', NotFoundError);

	let deleted: Evento | undefined;
	try {
		[deleted] = await connection('eventos')
			.update('status', ItemStatus.DELETADO)
			.where('id', eventoId)
			.returning('*');
	} catch (err) {
		logger.error('nao pode deletar a evento', err);
	}

	res.json(Boolean(deleted));
}

eventosRouter
	.get('/', pegaEventos)
	.get('/:id', pegaEvento)
	.post('/', postaEvento)
	.put('/:id', updateEvento)
	.delete('/:id', deletaEvento);

export type EventoDef = Tspec.DefineApiSpec<{
	basePath: '/eventos';
	paths: {
		'/': {
			get: {
				summary: 'pega todos os eventos';
				responses: ApiGetStatus<{ 200: Evento[] }>;
				query: QueryFilter<Evento>;
				handler: typeof pegaEventos;
			};
			post: {
				summary: 'posta um novo evento';
				responses: ApiPostStatus<{ 200: Evento }>;
				handler: typeof postaEvento;
			};
		};
		'/{id}': {
			get: {
				summary: 'Pega um evento em especifico';
				responses: ApiGetStatus<{ 200: Evento }>;
				handler: typeof pegaEvento;
			};
			put: {
				summary: 'Atualiza um contrato';
				responses: ApiUpdateStatus<{ 200: Evento }>;
				handler: typeof updateEvento;
			};
			delete: {
				summary: 'Exclui um contrato';
				responses: ApiDeleteStatus<{ 200: boolean }>;
				handler: typeof deletaEvento;
			};
		};
	};
}>;
