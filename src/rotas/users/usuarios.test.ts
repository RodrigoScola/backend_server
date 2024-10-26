import { describe, expect, it } from 'vitest';
import { App } from '../../../vitest.setup';
import { Formatter } from '../../lib/formatter';
import { ItemStatus, NewUsuario, Usuario } from '../../types/db_types';

describe.concurrent('testa os gets de usuarios', () => {
	it('testa o get base de usuario', async () => {
		const response = await App.get('/usuarios');

		expect(response.status).eq(200);
		expect(response.body.length).greaterThan(0);
		expect(response.body.every((r: Usuario) => r.status !== ItemStatus.DELETADO)).eq(true);
	});

	it('consegue pegar um usuario', async () => {
		const response = await App.get('/usuarios/1');

		expect(response.status).eq(200);
		expect(typeof response.body === 'object' && response.body.id === 1);
	});
	it('consegue postar uma novo usuario', async () => {
		const newCat: NewUsuario = {
			categorias: JSON.stringify([1]) as unknown as number[],
			status: ItemStatus.ATIVO,
			cnpj: '30248203948',
			data_nascimento: Formatter.toSqlTimeStamp(new Date()),
			genero: 'Masculino',
			nacionalidade: 'brazil',
			nome: 'rodrigo',
			prestador: true,
			produtor: false,
		};
		const response = await App.post('/usuarios').send(newCat);

		expect(response.status).eq(200);
		expect(typeof response.body === 'object' && response.body.id === 1);
	});

	it('consegue atualizar uma novo usuario', async () => {
		const newCat: NewUsuario = {
			categorias: JSON.stringify([1]) as unknown as number[],
			status: ItemStatus.ATIVO,
			cnpj: '30248203948',
			data_nascimento: Formatter.toSqlTimeStamp(new Date()),
			genero: 'Masculino',
			nacionalidade: 'brazil',
			nome: 'rodrigo',
			prestador: true,
			produtor: false,
		};
		const creationResponse = await App.post('/usuarios').send(newCat);

		expect(creationResponse.status).eq(200);
		expect(typeof creationResponse.body === 'object' && creationResponse.body.id === 1);

		creationResponse.body.nome = 'novonome2';
		const response = await App.put('/usuarios/' + creationResponse.body.id).send(creationResponse.body);

		expect(response.status).eq(200);
		expect(response.body.nome.includes('novonome2')).eq(true);
	});

	it('consegue deletar um usuario', async () => {
		const newCat: NewUsuario = {
			categorias: JSON.stringify([1]) as unknown as number[],
			status: ItemStatus.ATIVO,
			cnpj: '30248203948',
			data_nascimento: Formatter.toSqlTimeStamp(new Date()),
			genero: 'Masculino',
			nacionalidade: 'brazil',
			nome: 'rodrigo',
			prestador: true,
			produtor: false,
		};
		const creationResponse = await App.post('/usuarios').send(newCat);

		expect(creationResponse.status).eq(200);
		expect(typeof creationResponse.body === 'object' && creationResponse.body.id === 1);

		const response = await App.delete('/usuarios/' + creationResponse.body.id);

		expect(response.status).eq(200);
		expect(response.body).toBeTypeOf('boolean');
		expect(response.body).eq(true);
	});

	it('nao consegue pegar um usuario deletado', async () => {
		const newCat: NewUsuario = {
			categorias: JSON.stringify([1]) as unknown as number[],
			status: ItemStatus.ATIVO,
			cnpj: '30248203948',
			data_nascimento: Formatter.toSqlTimeStamp(new Date()),
			genero: 'Masculino',
			nacionalidade: 'brazil',
			nome: 'rodrigo',
			prestador: true,
			produtor: false,
		};
		const creationResponse = await App.post('/usuarios').send(newCat);

		expect(creationResponse.status).eq(200);
		expect(typeof creationResponse.body === 'object');

		const deleteResponse = await App.delete('/usuarios/' + creationResponse.body.id);

		expect(deleteResponse.status).eq(200);
		expect(deleteResponse.body).toBeTypeOf('boolean');
		expect(deleteResponse.body).eq(true);
		const response = await App.get('/usuarios/' + creationResponse.body.id);

		expect(response.status).not.eq(200);
		expect(response.status).not.eq(404);
	});

	it.only('consegue buscar usuarios por categorias', async () => {
		const newCat: NewUsuario = {
			categorias: JSON.stringify([2]) as unknown as number[],
			status: ItemStatus.ATIVO,
			cnpj: '30248203948',
			data_nascimento: Formatter.toSqlTimeStamp(new Date()),
			genero: 'Masculino',
			nacionalidade: 'brazil',
			nome: 'rodrigo',
			prestador: true,
			produtor: false,
		};
		const creationResponse = await App.post('/usuarios').send(newCat);

		expect(creationResponse.status).eq(200);
		expect(typeof creationResponse.body === 'object');

		const response = await App.get('/usuarios/?categorias=2');

		expect(response.status).eq(200);
		expect(response.body.length).greaterThan(0);
		expect(response.body.every((u: Usuario) => u.categorias.includes(2))).eq(true);
	});
});
