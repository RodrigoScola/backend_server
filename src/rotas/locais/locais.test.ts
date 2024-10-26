import { describe, expect, it } from 'vitest';
import { App } from '../../../vitest.setup';
import { ItemStatus, Local, NewLocal } from '../../types/db_types';

describe('testa os gets de locais', () => {
	it('testa o get base de locais', async () => {
		const response = await App.get('/locais');

		expect(response.status).eq(200);
		expect(response.body.length).greaterThan(0);
		expect(response.body.every((r: Local) => r.status !== ItemStatus.DELETADO)).eq(true);
	});

	it('consegue pegar um local', async () => {
		const response = await App.get('/locais/1');

		expect(response.status).eq(200);
		expect(typeof response.body === 'object' && response.body.id === 1);
	});
	it('consegue postar um novo local', async () => {
		const newCat: NewLocal = {
			cidade: 'Caxias Do Sul',
			descricao: 'tulipa restaurante',
			estado: 'RS',
			nome: 'restaurante tulipa',
			status: ItemStatus.ATIVO,
			categorias: JSON.stringify([1]) as unknown as number[],
			pais: 'brasil',
			bairro: '',
		};
		const response = await App.post('/locais').send(newCat);

		expect(response.status).eq(200);
		expect(typeof response.body === 'object' && response.body.id === 1);
	});

	it('consegue atualizar uma novo local', async () => {
		const newCat: NewLocal = {
			cidade: 'Caxias Do Sul',
			descricao: 'tulipa restaurante',
			estado: 'RS',
			nome: 'restaurante tulipa',
			status: ItemStatus.ATIVO,
			categorias: JSON.stringify([1]) as unknown as number[],
			pais: 'brasil',
			bairro: '',
		};
		const creationResponse = await App.post('/locais').send(newCat);

		expect(creationResponse.status).eq(200);
		expect(typeof creationResponse.body === 'object' && creationResponse.body.id === 1);

		creationResponse.body.nome = 'novonome2';
		const response = await App.put('/locais/' + creationResponse.body.id).send(creationResponse.body);

		expect(response.status).eq(200);
		expect(response.body.nome.includes('novonome2')).eq(true);
	});

	it('consegue deletar um local', async () => {
		const newCat: NewLocal = {
			cidade: 'Caxias Do Sul',
			descricao: 'tulipa restaurante',
			estado: 'RS',
			nome: 'restaurante tulipa',
			status: ItemStatus.ATIVO,
			categorias: JSON.stringify([1]) as unknown as number[],
			pais: 'brasil',
			bairro: '',
		};
		const creationResponse = await App.post('/locais').send(newCat);

		expect(creationResponse.status).eq(200);
		expect(typeof creationResponse.body === 'object' && creationResponse.body.id === 1);

		const response = await App.delete('/locais/' + creationResponse.body.id);

		expect(response.status).eq(200);
		expect(response.body).toBeTypeOf('boolean');
		expect(response.body).eq(true);
	});

	it('nao consegue pegar um local deletado', async () => {
		const newCat: NewLocal = {
			cidade: 'Caxias Do Sul',
			descricao: 'tulipa restaurante',
			estado: 'RS',
			nome: 'restaurante tulipa',
			status: ItemStatus.ATIVO,
			categorias: JSON.stringify([1]) as unknown as number[],
			pais: 'brasil',
			bairro: '',
		};
		const creationResponse = await App.post('/locais').send(newCat);

		expect(creationResponse.status).eq(200);
		expect(typeof creationResponse.body === 'object');

		const deleteResponse = await App.delete('/locais/' + creationResponse.body.id);

		expect(deleteResponse.status).eq(200);
		expect(deleteResponse.body).toBeTypeOf('boolean');
		expect(deleteResponse.body).eq(true);
		const response = await App.get('/locais/' + creationResponse.body.id);

		console.log(response.body.status, response.body.id, creationResponse.body.id);

		expect(response.status).not.eq(200);
		expect(response.status).not.eq(404);
	});
});
