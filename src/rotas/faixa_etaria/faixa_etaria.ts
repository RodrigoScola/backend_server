import { Request, Response, Router } from 'express';
import { Tspec } from 'tspec';
import { connection } from '../../db';
import { ContextBuilder } from '../../lib/context/ContextBuilder';
import { ContextFactory } from '../../lib/context/DatabaseContext';
import { BadRequestError, InternalError, InvalidItemError, NotFoundError } from '../../lib/ErrorHandling/ErrorHandler';
import { logger } from '../../server';
import { ApiDeleteStatus, ApiGetStatus, ApiPostStatus, ApiUpdateStatus, QueryFilter } from '../../types/api_types';
import { FaixaEtaria, ItemStatus, NewFaixaEtaria } from '../../types/db_types';
import { BoundsValidator } from '../../Validation/ItemValidation/BoundsValidator';
import { ValidationCluster } from '../../Validation/ItemValidation/ItemValidationCluster';

export const faixa_etaria_router = Router();

async function getFaixas(req: Request<unknown, FaixaEtaria[], unknown, QueryFilter<FaixaEtaria>>, res: Response<FaixaEtaria[]>) {
	const faixa_etarias: FaixaEtaria[] = await ContextFactory.fromRequest(
		'faixa_etaria',
		connection('faixa_etaria').whereNot('status', ItemStatus.DELETADO),
		req
	)
		.SetParameters(ContextBuilder.FromParameters(req.query, FaixaEtaria))
		.Build();

	res.json(faixa_etarias);
}

async function getFaixa(req: Request<{ id: string }, FaixaEtaria[], unknown, QueryFilter<FaixaEtaria>>, res: Response<FaixaEtaria[]>) {
	assert.ok(req.params.id, 'Id Nao Especificado', BadRequestError);

	const faixa_id = Number(req.params.id);
	assert.ok(faixa_id, 'Id da faixa etaria Invalida', BadRequestError);

	const faixa = await ContextFactory.fromRequest(
		'faixa_etaria',
		connection('faixa_etaria').where('id', faixa_id).whereNot('status', ItemStatus.DELETADO),
		req
	)
		.Build()
		.first();

	assert.ok(faixa, 'faixa etaria Nao achada', NotFoundError);

	res.json(faixa);
}

async function postaFaixa(req: Request<{ id: string }, FaixaEtaria, NewFaixaEtaria, QueryFilter<FaixaEtaria>>, res: Response<FaixaEtaria>) {
	assert.ok(req.body, 'Corpo da faixa etaria invalido', BadRequestError);

	const cleaned = req.body;

	const validator = new ValidationCluster().add(new BoundsValidator(NewFaixaEtaria, { min: -1, max: 832901803928 }));

	if (!validator.isValid(cleaned)) {
		const errors = validator.getErrors();
		logger.error('nao pode criar faixa etaria', JSON.stringify(errors, null, 1));
		throw new InvalidItemError(errors);
	}

	let faixa_etaria: FaixaEtaria | undefined;

	try {
		[faixa_etaria] = await connection('faixa_etaria').insert(cleaned).returning('*');
	} catch (err) {
		logger.error('nao pode criar faixa etaria', err);
	}
	assert.ok(faixa_etaria, 'nao pode criar faixa etaria', InternalError);

	res.json(faixa_etaria);
}

async function updateFaixa(req: Request<{ id: string }, FaixaEtaria, NewFaixaEtaria, QueryFilter<FaixaEtaria>>, res: Response<FaixaEtaria>) {
	assert.ok(req.params.id, 'Id Nao Especificado', BadRequestError);

	const faixa_id = Number(req.params.id);
	assert.ok(faixa_id, 'Id da faixa etaria Invalida', BadRequestError);
	assert.ok(req.body, 'Corpo da faixa etaria invalido', BadRequestError);

	const prev_faixa_etaria = await ContextFactory.fromRequest(
		'faixa_etaria',
		connection('faixa_etaria').andWhere('id', faixa_id).whereNot('status', ItemStatus.DELETADO),
		req
	)
		.Build()
		.first();

	assert.ok(prev_faixa_etaria, 'faixa etaria Nao achada', NotFoundError);

	const cleaned = req.body;

	const validator = new ValidationCluster().add(new BoundsValidator(NewFaixaEtaria, { min: -1, max: 832901803928 }));

	if (!validator.isValid(cleaned)) {
		const errors = validator.getErrors();
		logger.error('nao pode criar faixa etaria', JSON.stringify(errors, null, 1));
		throw new InvalidItemError(errors);
	}

	//@ts-ignore
	cleaned.id = faixa_id;

	let faixa_etaria: FaixaEtaria | undefined;

	try {
		[faixa_etaria] = await connection('faixa_etaria')
			.update(cleaned)
			.where('id', faixa_id)
			.whereNot('status', ItemStatus.DELETADO)
			.returning('*');
	} catch (err) {
		logger.error('nao pode criar faixa etaria', err);
	}
	assert.ok(faixa_etaria, 'nao pode criar faixa etaria', InternalError);

	res.json(faixa_etaria);
}

async function deletaFaixa(req: Request<{ id: string }, boolean, NewFaixaEtaria, QueryFilter<FaixaEtaria>>, res: Response<boolean>) {
	assert.ok(req.params.id, 'Id Nao Especificado', BadRequestError);

	const faixa_id = Number(req.params.id);
	assert.ok(faixa_id, 'Id da faixa etaria Invalida', BadRequestError);

	const faixa_etaria = await ContextFactory.fromRequest(
		'faixa_etaria',
		connection('faixa_etaria').whereNot('status', ItemStatus.DELETADO).andWhere('id', faixa_id),
		req
	)
		.Build()
		.first();

	assert.ok(faixa_etaria, 'faixa etaria Nao achada', NotFoundError);

	let deleted: FaixaEtaria | undefined;
	try {
		[deleted] = await connection('faixa_etaria').update('status', ItemStatus.DELETADO).where('id', faixa_id).returning('*');
	} catch (err) {
		logger.error('nao pode deletar a faixa etaria', err);
	}

	res.json(Boolean(deleted));
}

faixa_etaria_router.get('/', getFaixas).get('/:id', getFaixa).post('/', postaFaixa).put('/:id', updateFaixa).delete('/:id', deletaFaixa);

export type EventoDef = Tspec.DefineApiSpec<{
	basePath: '/contratos';
	paths: {
		'/': {
			get: {
				summary: 'pega todas as faixas';
				responses: ApiGetStatus<{ 200: FaixaEtaria[] }>;
				query: QueryFilter<FaixaEtaria>;
				handler: typeof getFaixas;
			};
			post: {
				summary: 'posta um novo evento';
				responses: ApiPostStatus<{ 200: FaixaEtaria }>;
				handler: typeof postaFaixa;
			};
		};
		'/{id}': {
			get: {
				summary: 'Pega uma faixa';
				responses: ApiGetStatus<{ 200: FaixaEtaria }>;
				handler: typeof getFaixa;
			};
			put: {
				summary: 'Atualiza uma faixa etaria';
				responses: ApiUpdateStatus<{ 200: FaixaEtaria }>;
				handler: typeof updateFaixa;
			};
			delete: {
				summary: 'Exclui uma faixa etaria';
				responses: ApiDeleteStatus<{ 200: boolean }>;
				handler: typeof deletaFaixa;
			};
		};
	};
}>;
