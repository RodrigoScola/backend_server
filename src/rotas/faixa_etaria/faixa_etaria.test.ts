import { describe, expect, it } from 'vitest';
import { App } from '../../../vitest.setup';
import { FaixaEtaria, ItemStatus, NewFaixaEtaria } from '../../types/db_types';

describe.concurrent('testa os gets de categorias', () => {
	it('testa o get base de faixa etaria', async () => {
		const response = await App.get('/faixa_etaria');

		expect(response.status).eq(200);
		expect(response.body.length).greaterThan(0);
		expect(response.body.every((r: FaixaEtaria) => r.status !== ItemStatus.DELETADO)).eq(true);
	});

	it('consegue pegar uma faixa etaria', async () => {
		const response = await App.get('/faixa_etaria/1');

		expect(response.status).eq(200);
		expect(typeof response.body === 'object' && response.body.id === 1);
	});
	it('consegue postar uma nova faixa etaria', async () => {
		const newCat: NewFaixaEtaria = {
			status: ItemStatus.ATIVO,
			nome: 'novonome',
			maxIdade: 18,
			minIdade: 0,
		};
		const response = await App.post('/faixa_etaria').send(newCat);

		expect(response.status).eq(200);
		expect(typeof response.body === 'object' && response.body.id === 1);
	});

	it('consegue atualizar uma nova faixa etaria', async () => {
		const newCat: NewFaixaEtaria = {
			status: ItemStatus.ATIVO,
			nome: 'novonome',
			maxIdade: 18,
			minIdade: 0,
		};
		const creationResponse = await App.post('/faixa_etaria').send(newCat);

		expect(creationResponse.status).eq(200);
		expect(typeof creationResponse.body === 'object' && creationResponse.body.id === 1);

		creationResponse.body.nome = 'novonome2';
		const response = await App.put('/faixa_etaria/' + creationResponse.body.id).send(creationResponse.body);

		expect(response.status).eq(200);
		expect(response.body.nome.includes('novonome2')).eq(true);
	});

	it('consegue deletar uma faixa etaria', async () => {
		const newCat: NewFaixaEtaria = {
			status: ItemStatus.ATIVO,
			nome: 'novonome',
			maxIdade: 18,
			minIdade: 0,
		};
		const creationResponse = await App.post('/faixa_etaria').send(newCat);

		expect(creationResponse.status).eq(200);
		expect(typeof creationResponse.body === 'object' && creationResponse.body.id === 1);

		const response = await App.delete('/faixa_etaria/' + creationResponse.body.id);

		expect(response.status).eq(200);
		expect(response.body).toBeTypeOf('boolean');
		expect(response.body).eq(true);
	});

	it('nao consegue pegar uma faixa etaria deletada', async () => {
		const newCat: NewFaixaEtaria = {
			status: ItemStatus.ATIVO,
			nome: 'novonome',
			maxIdade: 18,
			minIdade: 0,
		};
		const creationResponse = await App.post('/faixa_etaria').send(newCat);

		expect(creationResponse.status).eq(200);
		expect(typeof creationResponse.body === 'object');

		const deleteResponse = await App.delete('/faixa_etaria/' + creationResponse.body.id);

		expect(deleteResponse.status).eq(200);
		expect(deleteResponse.body).toBeTypeOf('boolean');
		expect(deleteResponse.body).eq(true);
		const response = await App.get('/faixa_etaria/' + creationResponse.body.id);

		expect(response.status).not.eq(200);
		expect(response.status).not.eq(404);
	});
});
