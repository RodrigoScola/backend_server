import { Request, Response, Router } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { Tspec } from 'tspec';
import { connection } from '../../db';
import { ContextBuilder } from '../../lib/context/ContextBuilder';
import { ContextFactory } from '../../lib/context/DatabaseContext';
import { BadRequestError, InternalError, InvalidItemError, NotFoundError } from '../../lib/ErrorHandling/ErrorHandler';
import { logger } from '../../server';
import { ApiDeleteStatus, ApiGetStatus, ApiPostStatus, ApiUpdateStatus, QueryFilter } from '../../types/api_types';
import { Categoria, Category, ItemStatus, NewCategory } from '../../types/db_types';
import { BoundsValidator } from '../../Validation/ItemValidation/BoundsValidator';
import { ValidationCluster } from '../../Validation/ItemValidation/ItemValidationCluster';

export const categoryRouter = Router();

async function pegaCategorias(req: Request<unknown, Categoria[], unknown, QueryFilter<Categoria>>, res: Response<Categoria[]>) {
	const categories: Categoria[] = await ContextFactory.fromRequest(
		'categorias',
		connection('categorias').whereNot('status', ItemStatus.DELETADO),
		req
	)
		.SetParameters(ContextBuilder.FromParameters(req.query, Category))
		.Build();

	res.json(categories);
}
async function pegaCategoria(req: Request, res: Response<Categoria>) {
	assert.ok(req.params.id, 'Id Nao Especificado', BadRequestError);

	const categoryId = Number(req.params.id);
	assert.ok(categoryId, 'Id da categoria Invalida', BadRequestError);

	const categoria = await ContextFactory.fromRequest(
		'categorias',
		connection('categorias').where('id', categoryId).whereNot('status', ItemStatus.DELETADO),
		req
	)
		.Build()
		.first();

	assert.ok(categoria, 'Categoria Nao achada', NotFoundError);

	res.json(categoria);
}

async function postaCategoria(req: Request<ParamsDictionary, Categoria, NewCategory>, res: Response<Categoria>) {
	assert.ok(req.body, 'Corpo da categoria invalido', BadRequestError);

	const cleaned = req.body;

	const validator = new ValidationCluster().add(new BoundsValidator(NewCategory, { min: -1, max: 832901803928 }));

	if (!validator.isValid(cleaned)) {
		const errors = validator.getErrors();
		logger.error('nao pode criar categoria', JSON.stringify(errors, null, 1));
		throw new InvalidItemError(errors);
	}

	let categoria: Categoria | undefined;

	try {
		[categoria] = await connection('categorias').insert(cleaned).returning('*');
	} catch (err) {
		logger.error('nao pode criar categoria', err);
	}
	assert.ok(categoria, 'nao pode criar categoria', InternalError);

	res.json(categoria);
}

async function UpdateCategoria(req: Request<ParamsDictionary, Categoria, Categoria>, res: Response<Categoria>) {
	assert.ok(req.params.id, 'Id Nao Especificado', BadRequestError);

	const categoryId = Number(req.params.id);
	assert.ok(categoryId, 'Id da categoria Invalida', BadRequestError);
	assert.ok(req.body, 'Corpo da categoria invalido', BadRequestError);

	const prevcategory = await ContextFactory.fromRequest(
		'categorias',
		connection('categorias').andWhere('id', categoryId).whereNot('status', ItemStatus.DELETADO),
		req
	)
		.Build()
		.first();

	assert.ok(prevcategory, 'Categoria Nao achada', NotFoundError);

	const cleaned = req.body;

	const validator = new ValidationCluster().add(new BoundsValidator(NewCategory, { min: -1, max: 832901803928 }));

	if (!validator.isValid(cleaned)) {
		const errors = validator.getErrors();
		logger.error('nao pode criar categoria', JSON.stringify(errors, null, 1));
		throw new InvalidItemError(errors);
	}

	//@ts-ignore
	cleaned.id = categoryId;

	let categoria: Categoria | undefined;

	try {
		[categoria] = await connection('categorias').update(cleaned).where('id', categoryId).whereNot('status', ItemStatus.DELETADO).returning('*');
	} catch (err) {
		logger.error('nao pode criar categoria', err);
	}
	assert.ok(categoria, 'nao pode criar categoria', InternalError);

	res.json(categoria);
}

async function DeletaCategoria(req: Request<{ id: string }>, res: Response<boolean>) {
	assert.ok(req.params.id, 'Id Nao Especificado', BadRequestError);

	const categoryId = Number(req.params.id);
	assert.ok(categoryId, 'Id da categoria Invalida', BadRequestError);

	const categoria = await ContextFactory.fromRequest(
		'categorias',
		connection('categorias').whereNot('status', ItemStatus.DELETADO).andWhere('id', categoryId),
		req
	)
		.Build()
		.first();

	assert.ok(categoria, 'Categoria Nao achada', NotFoundError);

	let deleted: Categoria | undefined;
	try {
		[deleted] = await connection('categorias').update('status', ItemStatus.DELETADO).where('id', categoryId).returning('*');
	} catch (err) {
		logger.error('nao pode deletar a categoria', err);
	}

	res.json(Boolean(deleted));
}
categoryRouter
	.get('/', pegaCategorias)
	.get('/:id', pegaCategoria)
	.post('/', postaCategoria)
	.put('/:id', UpdateCategoria)
	.delete('/:id', DeletaCategoria);

export type CategoriasDef = Tspec.DefineApiSpec<{
	basePath: '/categorias';
	paths: {
		'/': {
			get: {
				summary: 'Pega todas as categorias';
				responses: ApiGetStatus<{ 200: Categoria[] }>;
				query: QueryFilter<Categoria>;
				handler: typeof pegaCategorias;
			};
			post: {
				summary: 'Cria uma nova categoria';
				responses: ApiPostStatus<{ 200: Categoria }>;
				handler: typeof postaCategoria;
			};
		};
		'/{id}': {
			get: {
				summary: 'Pega uma categoria em especifico';
				responses: ApiGetStatus<{ 200: Categoria }>;
				handler: typeof pegaCategoria;
			};
			put: {
				summary: 'Atualiza uma categoria em expecifica';
				responses: ApiUpdateStatus<{ 200: Categoria }>;
				handler: typeof UpdateCategoria;
			};
			delete: {
				summary: 'Exclui uma categoria em especifico';
				responses: ApiDeleteStatus<{ 200: boolean }>;
				handler: typeof DeletaCategoria;
			};
		};
	};
}>;
