import { Request, Response, Router } from 'express';
import { Tspec } from 'tspec';
import { connection } from '../../db';
import { ContextBuilder } from '../../lib/context/ContextBuilder';
import { ContextFactory } from '../../lib/context/DatabaseContext';
import { BadRequestError, InternalError, InvalidItemError, NotFoundError } from '../../lib/ErrorHandling/ErrorHandler';
import { logger } from '../../server';
import { ApiDeleteStatus, ApiGetStatus, ApiPostStatus, ApiUpdateStatus, QueryFilter } from '../../types/api_types';
import { Contrato, ItemStatus, NewContrato } from '../../types/db_types';
import { BoundsValidator } from '../../Validation/ItemValidation/BoundsValidator';
import { ValidationCluster } from '../../Validation/ItemValidation/ItemValidationCluster';

export const contratoRouter = Router();

async function pegaContratos(req: Request<unknown, Contrato[], undefined, QueryFilter<Contrato>>, res: Response<Contrato[]>) {
	const contratos: Contrato[] = await ContextFactory.fromRequest('contrato', connection('contrato').whereNot('status', ItemStatus.DELETADO), req)
		.SetParameters(ContextBuilder.FromParameters(req.query, Contrato))
		.Build();

	res.json(contratos);
}

async function pegaContrato(req: Request<{ id: string }, Contrato>, res: Response<Contrato>) {
	assert.ok(req.params.id, 'Id Nao Especificado', BadRequestError);

	const contratoId = Number(req.params.id);
	assert.ok(contratoId, 'Id do Contrato Invalido', BadRequestError);

	const contrato = await ContextFactory.fromRequest(
		'contrato',
		connection('contrato').where('id', contratoId).whereNot('status', ItemStatus.DELETADO),
		req
	)
		.Build()
		.first();

	assert.ok(contrato, 'Contrato Nao achado', NotFoundError);

	res.json(contrato);
}

async function postaContrato(req: Request<unknown, Contrato, NewContrato>, res: Response<Contrato>) {
	assert.ok(req.body, 'Corpo do contrato invalido', BadRequestError);

	const cleaned = req.body;

	const validator = new ValidationCluster().add(new BoundsValidator(NewContrato, { min: -1, max: 832901803928 }));

	if (!validator.isValid(cleaned)) {
		const errors = validator.getErrors();
		logger.error('nao pode criar contrato', JSON.stringify(errors, null, 1));
		throw new InvalidItemError(errors);
	}

	let contrato: Contrato | undefined;

	try {
		[contrato] = await connection('contrato').insert(cleaned).returning('*');
	} catch (err) {
		logger.error('nao pode criar contrato', err);
	}
	assert.ok(contrato, 'nao pode criar contrato', InternalError);

	res.json(contrato);
}

async function UpdateContrato(req: Request<{ id: number }, Contrato>, res: Response<Contrato>) {
	assert.ok(req.params.id, 'Id Nao Especificado', BadRequestError);

	const contratoId = Number(req.params.id);
	assert.ok(contratoId, 'Id do contrato Invalido', BadRequestError);
	assert.ok(req.body, 'Corpo da contrato invalido', BadRequestError);

	const prevContrato = await ContextFactory.fromRequest(
		'contrato',
		connection('contrato').andWhere('id', contratoId).whereNot('status', ItemStatus.DELETADO),
		req
	)
		.Build()
		.first();

	assert.ok(prevContrato, 'Contrato Nao achado', NotFoundError);

	const cleaned = req.body;

	const validator = new ValidationCluster().add(new BoundsValidator(NewContrato, { min: -1, max: 832901803928 }));

	if (!validator.isValid(cleaned)) {
		const errors = validator.getErrors();
		logger.error('nao pode criar contrato', JSON.stringify(errors, null, 1));
		throw new InvalidItemError(errors);
	}

	//@ts-ignore
	cleaned.id = contratoId;

	let contrato: Contrato | undefined;

	try {
		[contrato] = await connection('contrato').update(cleaned).where('id', contratoId).whereNot('status', ItemStatus.DELETADO).returning('*');
	} catch (err) {
		logger.error('nao pode criar contrato', err);
	}
	assert.ok(contrato, 'nao pode criar contrato', InternalError);

	res.json(contrato);
}

async function deletaContrato(req: Request<{ id: number }, boolean>, res: Response<boolean>) {
	assert.ok(req.params.id, 'Id Nao Especificado', BadRequestError);

	const contratoId = Number(req.params.id);
	assert.ok(contratoId, 'Id do contrato Invalido', BadRequestError);

	const contrato = await ContextFactory.fromRequest(
		'contrato',
		connection('contrato').whereNot('status', ItemStatus.DELETADO).andWhere('id', contratoId),
		req
	)
		.Build()
		.first();

	assert.ok(contrato, 'Contrato Nao achado', NotFoundError);

	let deleted: Contrato | undefined;
	try {
		[deleted] = await connection('contrato').update('status', ItemStatus.DELETADO).where('id', contratoId).returning('*');
	} catch (err) {
		logger.error('nao pode deletar o contrato', err);
	}

	res.json(Boolean(deleted));
}

contratoRouter.get('/', pegaContratos).get('/:id', pegaContrato).post('/', postaContrato).put('/:id', UpdateContrato).delete('/:id', deletaContrato);

export type ContratoDef = Tspec.DefineApiSpec<{
	basePath: '/contratos';
	paths: {
		'/': {
			get: {
				summary: 'pega todos os contratos';
				responses: ApiGetStatus<{ 200: Contrato[] }>;
				query: QueryFilter<Contrato>;
				handler: typeof pegaContrato;
			};
			post: {
				summary: 'posta um novo contrato';
				responses: ApiPostStatus<{ 200: Contrato }>;
				handler: typeof postaContrato;
			};
		};
		'/{id}': {
			get: {
				summary: 'Pega um contrato especifico';
				responses: ApiGetStatus<{ 200: Contrato }>;
				handler: typeof pegaContrato;
			};
			put: {
				summary: 'Atualiza um contrato';
				responses: ApiUpdateStatus<{ 200: Contrato }>;
				handler: typeof UpdateContrato;
			};
			delete: {
				summary: 'Exclui um contrato';
				responses: ApiDeleteStatus<{ 200: boolean }>;
				handler: typeof deletaContrato;
			};
		};
	};
}>;
