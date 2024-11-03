import { Request, Response, Router } from 'express';
import { connection } from '../../db';
import { ContextBuilder } from '../../lib/context/ContextBuilder';
import { ContextFactory } from '../../lib/context/DatabaseContext';
import {
	BadRequestError,
	InternalError,
	InvalidItemError,
	NotFoundError,
} from '../../lib/ErrorHandling/ErrorHandler';
import { logger } from '../../server';
import { ItemStatus, NewUsuario, Usuario } from '../../types/db_types';
import { BoundsValidator } from '../../Validation/ItemValidation/BoundsValidator';
import { ValidationCluster } from '../../Validation/ItemValidation/ItemValidationCluster';

export const usuariosRouter = Router();

usuariosRouter
	.get('/', async (req: Request, res: Response<Usuario[]>) => {
		const params = ContextBuilder.FromParameters(req.query, Usuario);

		const usuarios: Usuario[] = await ContextFactory.fromRequest(
			'usuarios',
			connection('usuarios').whereNot('status', ItemStatus.DELETADO),
			req
		)
			.SetParameters(params)
			.Build();

		res.json(usuarios);
	})
	.get('/:id', async (req, res) => {
		assert.ok(req.params.id, 'Id Nao Especificado', BadRequestError);

		const usuarioId = Number(req.params.id);
		assert.ok(usuarioId, 'Id do Usuario Invalida', BadRequestError);

		const usuario = await ContextFactory.fromRequest(
			'usuarios',
			connection('usuarios').where('id', usuarioId).whereNot('status', ItemStatus.DELETADO),
			req
		)
			.Build()
			.first();

		assert.ok(usuario, 'usuario Nao achada', NotFoundError);

		res.json(usuario);
	})
	.post('/', async (req, res) => {
		assert.ok(req.body, 'Corpo da usuario invalido', BadRequestError);

		const cleaned: Partial<NewUsuario> = req.body;

		if (Array.isArray(cleaned.categorias)) {
			cleaned.categorias = JSON.stringify(cleaned.categorias) as unknown as number[];
		}

		const validator = new ValidationCluster().add(
			new BoundsValidator(NewUsuario, { min: -1, max: 832901803928 })
		);

		if (!validator.isValid(cleaned)) {
			const errors = validator.getErrors();
			logger.error('nao pode criar usuario', JSON.stringify(errors, null, 1));
			throw new InvalidItemError(errors);
		}

		let usuario: Usuario | undefined;

		try {
			[usuario] = await connection('usuarios').insert(cleaned).returning('*');
		} catch (err) {
			logger.error('nao pode criar usuario', err);
		}
		assert.ok(usuario, 'nao pode criar usuario', InternalError);

		res.json(usuario);
	})
	.put('/:id', async (req, res) => {
		assert.ok(req.params.id, 'Id Nao Especificado', BadRequestError);

		const usuarioId = Number(req.params.id);
		assert.ok(usuarioId, 'Id do usuario Invalida', BadRequestError);
		assert.ok(req.body, 'Corpo da usuario invalido', BadRequestError);

		const prevuser = await ContextFactory.fromRequest(
			'usuarios',
			connection('usuarios').andWhere('id', usuarioId).whereNot('status', ItemStatus.DELETADO),
			req
		)
			.Build()
			.first();

		assert.ok(prevuser, 'usuario Nao achada', NotFoundError);

		const cleaned = req.body;

		const validator = new ValidationCluster().add(
			new BoundsValidator(NewUsuario, { min: -1, max: 832901803928 })
		);

		if (!validator.isValid(cleaned)) {
			const errors = validator.getErrors();
			logger.error('nao pode criar usuario', JSON.stringify(errors, null, 1));
			throw new InvalidItemError(errors);
		}

		//@ts-ignore
		cleaned.id = usuarioId;

		let usuario: Usuario | undefined;

		try {
			[usuario] = await connection('usuarios')
				.update(cleaned)
				.where('id', usuarioId)
				.whereNot('status', ItemStatus.DELETADO)
				.returning('*');
		} catch (err) {
			logger.error('nao pode criar usuario', err);
		}
		assert.ok(usuario, 'nao pode criar usuario', InternalError);

		res.json(usuario);
	})
	.delete('/:id', async (req, res) => {
		assert.ok(req.params.id, 'Id Nao Especificado', BadRequestError);

		const usuarioId = Number(req.params.id);
		assert.ok(usuarioId, 'Id da usuario Invalida', BadRequestError);

		const usuario = await ContextFactory.fromRequest(
			'usuarios',
			connection('usuarios').whereNot('status', ItemStatus.DELETADO).andWhere('id', usuarioId),
			req
		)
			.Build()
			.first();

		assert.ok(usuario, 'usuario Nao achada', NotFoundError);

		let deleted: Usuario | undefined;
		try {
			[deleted] = await connection('usuarios')
				.update('status', ItemStatus.DELETADO)
				.where('id', usuarioId)
				.returning('*');
		} catch (err) {
			logger.error('nao pode deletar a usuario', err);
		}

		res.json(Boolean(deleted));
	});
