import { Request, Response, Router } from 'express';
import { connection } from '../../db';
import { ContextBuilder } from '../../lib/context/ContextBuilder';
import { ContextFactory } from '../../lib/context/DatabaseContext';
import { BadRequestError, InternalError, InvalidItemError, NotFoundError } from '../../lib/ErrorHandling/ErrorHandler';
import { logger } from '../../server';
import { ItemStatus, Local, NewLocal } from '../../types/db_types';
import { BoundsValidator } from '../../Validation/ItemValidation/BoundsValidator';
import { ValidationCluster } from '../../Validation/ItemValidation/ItemValidationCluster';

export const localRouter = Router();

localRouter
	.get('/', async (req: Request, res: Response<Local[]>) => {
		const Locais: Local[] = await ContextFactory.fromRequest('local', connection('local').whereNot('status', ItemStatus.DELETADO), req)
			.SetParameters(ContextBuilder.FromParameters(req.query, Local))
			.Build();

		res.json(Locais);
	})
	.get('/:id', async (req, res) => {
		assert.ok(req.params.id, 'Id Nao Especificado', BadRequestError);

		const localid = Number(req.params.id);
		assert.ok(localid, 'Id do Local Invalido', BadRequestError);

		const local = await ContextFactory.fromRequest(
			'local',
			connection('local').andWhere('id', localid).andWhereNot('status', ItemStatus.DELETADO),
			req
		)
			.Build()
			.first();

		assert.ok(local, 'Local Nao achado', NotFoundError);

		res.json(local);
	})
	.post('/', async (req, res) => {
		assert.ok(req.body, 'Corpo do local invalido', BadRequestError);

		const cleaned = req.body;

		const validator = new ValidationCluster().add(new BoundsValidator(NewLocal, { min: -1, max: 832901803928 }));

		if (!validator.isValid(cleaned)) {
			const errors = validator.getErrors();
			logger.error('nao pode criar local', JSON.stringify(errors, null, 1));
			throw new InvalidItemError(errors);
		}

		let local: Local | undefined;

		try {
			[local] = await connection('local').insert(cleaned).returning('*');
		} catch (err) {
			logger.error('nao pode criar local', err);
		}
		assert.ok(local, 'nao pode criar local', InternalError);

		res.json(local);
	})
	.put('/:id', async (req, res) => {
		assert.ok(req.params.id, 'Id Nao Especificado', BadRequestError);

		const localId = Number(req.params.id);
		assert.ok(localId, 'Id do local Invalido', BadRequestError);
		assert.ok(req.body, 'Corpo do local invalido', BadRequestError);

		const cleaned = req.body;

		const prevLocal = await ContextFactory.fromRequest(
			'local',
			connection('local').where('id', localId).whereNot('status', ItemStatus.DELETADO),
			req
		)
			.Build()
			.first();

		assert.ok(prevLocal, 'Local nao achado', NotFoundError);

		const validator = new ValidationCluster().add(new BoundsValidator(NewLocal, { min: -1, max: 832901803928 }));

		if (!validator.isValid(cleaned)) {
			const errors = validator.getErrors();
			logger.error('nao pode criar local', JSON.stringify(errors, null, 1));
			throw new InvalidItemError(errors);
		}

		let local: Local | undefined;

		try {
			[local] = await connection('local').update(cleaned).where('id', localId).whereNot('status', ItemStatus.DELETADO).returning('*');
		} catch (err) {
			logger.error('nao pode atualizar local', err);
		}
		assert.ok(local, 'nao pode atualizar local', InternalError);

		res.json(local);
	})
	.delete('/:id', async (req, res) => {
		assert.ok(req.params.id, 'Id Nao Especificado', BadRequestError);

		const localId = Number(req.params.id);
		assert.ok(localId, 'Id do local Invalido', BadRequestError);

		const local = await ContextFactory.fromRequest(
			'local',
			connection('local').where('id', req.params.id).andWhereNot('status', ItemStatus.DELETADO),
			req
		)
			.Build()
			.first();

		assert.ok(local, 'Local Nao achado', NotFoundError);

		let deleted: Local | undefined;
		try {
			[deleted] = await connection('local').update('status', ItemStatus.DELETADO).where('id', localId).returning('*');
		} catch (err) {
			logger.error('nao pode deletar o local', err);
		}
		assert.ok(deleted, 'local nao deletado', InternalError);

		res.json(Boolean(deleted));
	});
