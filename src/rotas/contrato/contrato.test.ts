import { describe, expect, it } from 'vitest';
import { App } from '../../../vitest.setup';
import { Formatter } from '../../lib/formatter';
import { Contrato, ItemStatus, NewContrato } from '../../types/db_types';

describe.concurrent('testa os gets de contratos', () => {
	it('testa o get base de contrato', async () => {
		const response = await App.get('/contratos');

		expect(response.status).eq(200);
		expect(response.body.length).greaterThan(0);
		expect(response.body.every((r: Contrato) => r.status !== ItemStatus.DELETADO)).eq(true);
	});

	it('consegue pegar um contrato', async () => {
		const response = await App.get('/contratos/1');

		expect(response.status).eq(200);
		expect(typeof response.body === 'object' && response.body.id === 1);
	});
	it('consegue postar um novo contrato', async () => {
		const newCat: NewContrato = {
			status: ItemStatus.ATIVO,
			criadoEm: Formatter.toSqlTimeStamp(new Date()),
			evento: 1,
			prestadorId: 1,
			produtorId: 2,
		};
		const response = await App.post('/contratos').send(newCat);

		expect(response.status).eq(200);
		expect(typeof response.body === 'object' && response.body.id === 1);
	});

	it('consegue atualizar um novo contrato', async () => {
		const newCat: NewContrato = {
			status: ItemStatus.ATIVO,
			criadoEm: Formatter.toSqlTimeStamp(new Date()),
			evento: 1,
			prestadorId: 1,
			produtorId: 2,
		};
		const creationResponse = await App.post('/contratos').send(newCat);

		expect(creationResponse.status).eq(200);
		expect(typeof creationResponse.body === 'object' && creationResponse.body.id === 1);

		creationResponse.body.produtorId = 3;
		const response = await App.put('/contratos/' + creationResponse.body.id).send(creationResponse.body);

		expect(response.status).eq(200);
		expect(response.body.produtorId).eq(3);
	});

	it('consegue deletar um contrato', async () => {
		const newCat: NewContrato = {
			status: ItemStatus.ATIVO,
			criadoEm: Formatter.toSqlTimeStamp(new Date()),
			evento: 1,
			prestadorId: 1,
			produtorId: 2,
		};
		const creationResponse = await App.post('/contratos').send(newCat);

		expect(creationResponse.status).eq(200);
		expect(typeof creationResponse.body === 'object' && creationResponse.body.id === 1);

		const response = await App.delete('/contratos/' + creationResponse.body.id);

		expect(response.status).eq(200);
		expect(response.body).toBeTypeOf('boolean');
		expect(response.body).eq(true);
	});

	it('nao consegue pegar um contrato deletado', async () => {
		const newCat: NewContrato = {
			status: ItemStatus.ATIVO,
			criadoEm: Formatter.toSqlTimeStamp(new Date()),
			evento: 1,
			prestadorId: 1,
			produtorId: 2,
		};
		const creationResponse = await App.post('/contratos').send(newCat);

		expect(creationResponse.status).eq(200);
		expect(typeof creationResponse.body === 'object');

		const deleteResponse = await App.delete('/contratos/' + creationResponse.body.id);

		expect(deleteResponse.status).eq(200);
		expect(deleteResponse.body).toBeTypeOf('boolean');
		expect(deleteResponse.body).eq(true);
		const response = await App.get('/contratos/' + creationResponse.body.id);

		expect(response.status).not.eq(200);
		expect(response.status).not.eq(404);
	});
});
