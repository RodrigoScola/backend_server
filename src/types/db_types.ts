import { Knex } from 'knex';

export enum ItemStatus {
	DELETADO = 0,
	ATIVO = 1,
	Inativo = 2,
}

export const NewLocal = {
	nome: '',
	descricao: '',
	bairro: '',
	cidade: '',
	estado: '',
	status: ItemStatus.ATIVO as ItemStatus,
	categorias: [1] as number[],
	pais: '',
};

export const Local = {
	id: 0,
	...NewLocal,
};

export type NewLocal = typeof NewLocal;
export type Local = typeof Local;

export const NewUsuario = {
	nome: '',
	prestador: true,
	produtor: true,
	data_nascimento: '',
	status: ItemStatus.ATIVO as ItemStatus,
	categorias: [1] as number[],
	cnpj: '',
	nacionalidade: '',
	genero: '',
};

export type NewUsuario = typeof NewUsuario;

export const Usuario = {
	...NewUsuario,
	id: 0,
};

export type Usuario = typeof Usuario;

export const NewFaixaEtaria = {
	nome: '',
	minIdade: 0,
	status: ItemStatus.ATIVO as ItemStatus,
	maxIdade: 0 as number | undefined,
};

export const FaixaEtaria = {
	...NewFaixaEtaria,
	id: 0,
};

export type NewFaixaEtaria = typeof NewFaixaEtaria;
export type FaixaEtaria = typeof FaixaEtaria;

export const NewContrato = {
	prestadorId: 1,
	produtorId: 1,
	evento: 0,
	status: ItemStatus.ATIVO as ItemStatus,
	criadoEm: '',
};

export type NewContrato = typeof NewContrato;

export const Contrato = {
	...NewContrato,
	id: 0,
};

export type Contrato = typeof Contrato;
export const NewEvento = {
	nome: '',
	produtor: 1,
	status: ItemStatus.ATIVO as ItemStatus,
	local: 1,
	faixa_etaria: 0,
	categorias: [1] as number[],
	comeca: '',
	termina: '',
};

export type NewEvento = typeof NewEvento;

export const Evento = { ...NewEvento, id: 0 };

export type Evento = typeof Evento;

export const NewCategory = {
	nome: '',
	status: ItemStatus.ATIVO as ItemStatus,
	descricao: '',
	parente: 0,
};

export type NewCategory = typeof NewCategory;

export const Category = {
	...NewCategory,
	id: 0,
};

export type Categoria = typeof Category;

export const ActiveStatus = [ItemStatus.ATIVO, ItemStatus.Inativo];

export const HiddenStatus = [ItemStatus.DELETADO];

export type TableFields = {
	categorias: Categoria;
	eventos: Evento;
	contrato: Contrato;
	faixa_etaria: FaixaEtaria;
	usuarios: Usuario;
	local: Local;
};

export type TableNames = keyof TableFields;

export type DatabaseQuery<T extends TableNames = TableNames, RequiredProps extends object = TableFields[T]> = Knex.QueryBuilder<
	TableFields[T] & RequiredProps
>;
