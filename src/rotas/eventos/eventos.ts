import { Request, Response, Router } from 'express';
import { connection } from '../../db';
import { ContextBuilder } from '../../lib/context/ContextBuilder';
import { ContextFactory } from '../../lib/context/DatabaseContext';
import { BadRequestError, InternalError, InvalidItemError, NotFoundError } from '../../lib/ErrorHandling/ErrorHandler';
import { logger } from '../../server';
import { Evento, ItemStatus, NewEvento } from '../../types/db_types';
import { BoundsValidator } from '../../Validation/ItemValidation/BoundsValidator';
import { ValidationCluster } from '../../Validation/ItemValidation/ItemValidationCluster';

export const eventosRouter = Router();

eventosRouter
	.get('/', async (req: Request, res: Response<Evento[]>) => {
		const eventos: Evento[] = await ContextFactory.fromRequest('eventos', connection('eventos').whereNot('status', ItemStatus.DELETADO), req)
			.SetParameters(ContextBuilder.FromParameters(req.query, Evento))
			.Build();

		res.json(eventos);
	})
	.get('/:id', async (req, res) => {
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
	})
	.post('/', async (req, res) => {
		assert.ok(req.body, 'Corpo do evento invalido', BadRequestError);

		const cleaned = req.body;

		const validator = new ValidationCluster().add(new BoundsValidator(NewEvento, { min: -1, max: 832901803928 }));

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
	})
	.put('/:id', async (req, res) => {
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

		const validator = new ValidationCluster().add(new BoundsValidator(NewEvento, { min: -1, max: 832901803928 }));

		if (!validator.isValid(cleaned)) {
			const errors = validator.getErrors();
			logger.error('nao pode criar Evento', JSON.stringify(errors, null, 1));
			throw new InvalidItemError(errors);
		}

		//@ts-ignore
		cleaned.id = eventoId;

		let evento: Evento | undefined;

		try {
			[evento] = await connection('eventos').update(cleaned).where('id', eventoId).whereNot('status', ItemStatus.DELETADO).returning('*');
		} catch (err) {
			logger.error('nao pode criar evento', err);
		}
		assert.ok(evento, 'nao pode criar evento', InternalError);

		res.json(evento);
	})
	.delete('/:id', async (req, res) => {
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
			[deleted] = await connection('eventos').update('status', ItemStatus.DELETADO).where('id', eventoId).returning('*');
		} catch (err) {
			logger.error('nao pode deletar a evento', err);
		}

		res.json(Boolean(deleted));
	});
