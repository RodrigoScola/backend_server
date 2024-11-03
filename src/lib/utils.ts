import { DatabaseQuery } from '../types/db_types';

export function addCategorias(
	baseQuery: object,
	dbQuery: DatabaseQuery<'local'> | DatabaseQuery<'usuarios'> | DatabaseQuery<'eventos'>
) {
	const urlSearchParams = new URLSearchParams(new URLSearchParams(baseQuery as any).toString());
	if (urlSearchParams.has('categorias')) {
		for (const categoria of urlSearchParams.get('categorias')!.split(',')) {
			dbQuery.orWhereLike('categorias', '%' + categoria + '%');
		}
		urlSearchParams.delete('categorias');
	}
	return urlSearchParams;
}
