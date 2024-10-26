import { describe, expect, it } from 'vitest';
import { App } from '../../../vitest.setup';
import { Categoria, ItemStatus, NewCategory } from '../../types/db_types';

describe.concurrent('testa os gets de categorias', () => {
	it('testa o get base de categoria', async () => {
		const response = await App.get('/categorias');

		expect(response.status).eq(200);
		expect(response.body.length).greaterThan(0);
		expect(response.body.every((r: Categoria) => r.status !== ItemStatus.DELETADO)).eq(true);
	});

	it('consegue pegar uma categoria', async () => {
		const response = await App.get('/categorias/1');

		expect(response.status).eq(200);
		expect(typeof response.body === 'object' && response.body.id === 1);
	});
	it('consegue postar uma nova categoria', async () => {
		const newCat: NewCategory = {
			status: ItemStatus.ATIVO,
			nome: 'novonome',
			descricao: 'desc do novo nome',
			parente: 1,
		};
		const response = await App.post('/categorias').send(newCat);

		expect(response.status).eq(200);
		expect(typeof response.body === 'object' && response.body.id === 1);
	});

	it('consegue atualizar uma nova categoria', async () => {
		const creationResponse = await App.post('/categorias').send({
			status: ItemStatus.ATIVO,
			nome: 'novonome',
			descricao: 'desc do novo nome',
			parente: 1,
		});

		expect(creationResponse.status).eq(200);
		expect(typeof creationResponse.body === 'object' && creationResponse.body.id === 1);

		creationResponse.body.nome = 'novonome2';
		const response = await App.put('/categorias/' + creationResponse.body.id).send(creationResponse.body);

		expect(response.status).eq(200);
		expect(response.body.nome.includes('novonome2')).eq(true);
	});

	it('consegue deletar uma categoria', async () => {
		const creationResponse = await App.post('/categorias').send({
			status: ItemStatus.ATIVO,
			nome: 'novonome',
			descricao: 'desc do novo nome',
			parente: 1,
		});

		expect(creationResponse.status).eq(200);
		expect(typeof creationResponse.body === 'object' && creationResponse.body.id === 1);

		const response = await App.delete('/categorias/' + creationResponse.body.id);

		expect(response.status).eq(200);
		expect(response.body).toBeTypeOf('boolean');
		expect(response.body).eq(true);
	});

	it('nao consegue pegar uma categoria deletada', async () => {
		const creationResponse = await App.post('/categorias').send({
			status: ItemStatus.ATIVO,
			nome: 'novonome',
			descricao: 'desc do novo nome',
			parente: 1,
		});

		expect(creationResponse.status).eq(200);
		expect(typeof creationResponse.body === 'object');

		const deleteResponse = await App.delete('/categorias/' + creationResponse.body.id);

		expect(deleteResponse.status).eq(200);
		expect(deleteResponse.body).toBeTypeOf('boolean');
		expect(deleteResponse.body).eq(true);
		const response = await App.get('/categorias/' + creationResponse.body.id);

		expect(response.status).not.eq(200);
		expect(response.status).not.eq(404);
	});
});
