import { describe, expect, it } from 'vitest';
import { App } from '../../../vitest.setup';
import { Formatter } from '../../lib/formatter';
import { Evento, ItemStatus, NewEvento } from '../../types/db_types';

describe.concurrent('testa os gets de eventos', () => {
	it('testa o get base de eventos', async () => {
		const response = await App.get('/eventos');

		expect(response.status).eq(200);
		expect(response.body.length).greaterThan(0);
		expect(response.body.every((r: Evento) => r.status !== ItemStatus.DELETADO)).eq(true);
	});

	it('consegue pegar um evento ', async () => {
		const response = await App.get('/eventos/1');

		expect(response.status).eq(200);
		expect(typeof response.body === 'object' && response.body.id === 1);
	});
	it('consegue postar uma novo evento', async () => {
		const newCat: NewEvento = {
			status: ItemStatus.ATIVO,
			categorias: JSON.stringify([1]) as unknown as number[],
			comeca: Formatter.toSqlTimeStamp(new Date()),
			faixa_etaria: 1,
			local: 1,
			nome: 'nome do evento',
			produtor: 1,
			termina: Formatter.toSqlTimeStamp(new Date()),
		};
		const response = await App.post('/eventos').send(newCat);

		expect(response.status).eq(200);
		expect(typeof response.body === 'object' && response.body.id === 1);
	});

	it('consegue atualizar uma novo evento', async () => {
		const newCat: NewEvento = {
			status: ItemStatus.ATIVO,
			categorias: JSON.stringify([1]) as unknown as number[],
			comeca: Formatter.toSqlTimeStamp(new Date()),
			faixa_etaria: 1,
			local: 1,
			nome: 'nome do evento',
			produtor: 1,
			termina: Formatter.toSqlTimeStamp(new Date()),
		};
		const creationResponse = await App.post('/eventos').send(newCat);

		expect(creationResponse.status).eq(200);
		expect(typeof creationResponse.body === 'object' && creationResponse.body.id === 1);

		creationResponse.body.nome = 'novonome2';
		const response = await App.put('/eventos/' + creationResponse.body.id).send(creationResponse.body);

		expect(response.status).eq(200);
		expect(response.body.nome.includes('novonome2')).eq(true);
	});

	it('consegue deletar uma categoria', async () => {
		const newCat: NewEvento = {
			status: ItemStatus.ATIVO,
			categorias: JSON.stringify([1]) as unknown as number[],
			comeca: Formatter.toSqlTimeStamp(new Date()),
			faixa_etaria: 1,
			local: 1,
			nome: 'nome do evento',
			produtor: 1,
			termina: Formatter.toSqlTimeStamp(new Date()),
		};
		const creationResponse = await App.post('/eventos').send(newCat);

		expect(creationResponse.status).eq(200);
		expect(typeof creationResponse.body === 'object' && creationResponse.body.id === 1);

		const response = await App.delete('/eventos/' + creationResponse.body.id);

		expect(response.status).eq(200);
		expect(response.body).toBeTypeOf('boolean');
		expect(response.body).eq(true);
	});

	it('nao consegue pegar uma categoria deletada', async () => {
		const newCat: NewEvento = {
			status: ItemStatus.ATIVO,
			categorias: JSON.stringify([1]) as unknown as number[],
			comeca: Formatter.toSqlTimeStamp(new Date()),
			faixa_etaria: 1,
			local: 1,
			nome: 'nome do evento',
			produtor: 1,
			termina: Formatter.toSqlTimeStamp(new Date()),
		};
		const creationResponse = await App.post('/eventos').send(newCat);

		expect(creationResponse.status).eq(200);
		expect(typeof creationResponse.body === 'object');

		const deleteResponse = await App.delete('/eventos/' + creationResponse.body.id);

		expect(deleteResponse.status).eq(200);
		expect(deleteResponse.body).toBeTypeOf('boolean');
		expect(deleteResponse.body).eq(true);
		const response = await App.get('/eventos/' + creationResponse.body.id);

		expect(response.status).not.eq(200);
		expect(response.status).not.eq(404);
	});
});
