import { Request, Response, Router } from 'express';
import { connection } from '../../db';
import { ContextBuilder } from '../../lib/context/ContextBuilder';
import { ContextFactory } from '../../lib/context/DatabaseContext';
import { BadRequestError, InternalError, InvalidItemError, NotFoundError } from '../../lib/ErrorHandling/ErrorHandler';
import { logger } from '../../server';
import { Contrato, ItemStatus, NewContrato } from '../../types/db_types';
import { BoundsValidator } from '../../Validation/ItemValidation/BoundsValidator';
import { ValidationCluster } from '../../Validation/ItemValidation/ItemValidationCluster';

export const contratoRouter = Router();

contratoRouter
	.get('/', async (req: Request, res: Response<Contrato[]>) => {
		const contratos: Contrato[] = await ContextFactory.fromRequest(
			'contrato',
			connection('contrato').whereNot('status', ItemStatus.DELETADO),
			req
		)
			.SetParameters(ContextBuilder.FromParameters(req.query, Contrato))
			.Build();

		res.json(contratos);
	})
	.get('/:id', async (req, res) => {
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
	})
	.post('/', async (req, res) => {
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
	})
	.put('/:id', async (req, res) => {
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
			[contrato] = await connection('contrato')
				.update(cleaned)
				.where('id', contratoId)
				.whereNot('status', ItemStatus.DELETADO)
				.returning('*');
		} catch (err) {
			logger.error('nao pode criar contrato', err);
		}
		assert.ok(contrato, 'nao pode criar contrato', InternalError);

		res.json(contrato);
	})
	.delete('/:id', async (req, res) => {
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
	});
