import { AvailableContextItems, ContextInstance, ContextQuery, SEARCH_MODE } from '../../types/contextTypes';
import { DatabaseQuery, TableNames } from '../../types/db_types';
import { ContextBuilder } from './ContextBuilder';
import { PrivateItemContextMaker } from './contextItems/PrivateItemContext';

export function GetSearchModeMessage(mode: SEARCH_MODE) {
	switch (mode) {
		case SEARCH_MODE.BOOLEAN_MODE:
			return 'in boolean mode';

		case SEARCH_MODE.WITH_QUERY_EXPANSION:
			return 'with query expansion';

		case SEARCH_MODE.NATURAL_LANGUAGE:
			return 'in natural language mode';

		case SEARCH_MODE.NATURAL_LANGUAGE_WITH_QUERY:
			return 'in natural language mode with query expansion';

		default:
			throw new Error('Invalid Mode');
	}
}

export class ContextFactory {
	static Builder = ContextBuilder;
	private static readonly items = {
		categorias: (contextQuery: ContextQuery<'categorias'>) =>
			new PrivateItemContextMaker<'categorias'>().init({
				name: 'categorias',
				query: contextQuery,
			}),

		local: (contextQuery: ContextQuery<'local'>) =>
			new PrivateItemContextMaker<'local'>().init({
				name: 'local',
				query: contextQuery,
			}),
		contrato: (contextQuery: ContextQuery<'contrato'>) =>
			new PrivateItemContextMaker<'contrato'>().init({
				name: 'contrato',
				query: contextQuery,
			}),
		eventos: (contextQuery: ContextQuery<'eventos'>) =>
			new PrivateItemContextMaker<'eventos'>().init({
				name: 'eventos',
				query: contextQuery,
			}),
		usuarios: (contextQuery: ContextQuery<'usuarios'>) =>
			new PrivateItemContextMaker<'usuarios'>().init({
				name: 'usuarios',
				query: contextQuery,
			}),

		faixa_etaria: (contextQuery: ContextQuery<'faixa_etaria'>) =>
			new PrivateItemContextMaker<'faixa_etaria'>().init({
				name: 'faixa_etaria',
				query: contextQuery,
			}),
	} as const satisfies Partial<Record<TableNames, unknown>>;

	static Make<T extends AvailableContextItems>(name: T) {
		if (!(name in ContextFactory.items)) throw new Error('Context item inot found' + name);
		return ContextFactory.items[name];
	}
	static fromRequest<T extends AvailableContextItems>(name: T, query: DatabaseQuery<T>, _: object /**  { user: Usuario } */): ContextInstance<T> {
		if (!(name in ContextFactory.items)) {
			throw new Error('Context item not found');
		}

		//@ts-ignore
		const item = ContextFactory.items[name](query);

		if (item instanceof PrivateItemContextMaker) {
			//@ts-ignore
			item.init({ name, query });
		}

		//@ts-ignore
		return item;
	}
}
