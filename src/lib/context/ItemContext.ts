import { ContextParameters, ParameterActions, SEARCH_MODE } from '../../types/contextTypes';
import { DatabaseQuery, ItemStatus, TableNames } from '../../types/db_types';
import { GetSearchModeMessage } from './DatabaseContext';

export type ContextMakerProps<T extends object> = {
	ignoreWithStatus?: ItemStatus[] | ItemStatus | null | undefined;
	parameters?: ContextParameters<T> | undefined;
};

const MAX_DEFAULT_QUERY = 150;

export class ContextMaker {
	static setLimit<T extends object, TableName extends TableNames>(parameters: ContextParameters<T>, query: DatabaseQuery<TableName>) {
		if (
			ParameterActions.LIMIT in parameters &&
			typeof parameters.limit === 'number' &&
			parameters.limit > 0 &&
			parameters.limit < MAX_DEFAULT_QUERY
		) {
			query.limit(parameters.limit);
		}
	}

	static setWhereIn<T extends object, TableName extends TableNames>(parameters: ContextParameters<T>, query: DatabaseQuery<TableName>) {
		if (!parameters.whereIn) return;
		if (!parameters.whereIn.key || !parameters.whereIn.value) return;

		//@ts-expect-error aaah idk
		query.whereIn(parameters.whereIn.key, parameters.whereIn.value);
	}

	static setFullTextSearch<T extends object, TableName extends TableNames>(parameters: ContextParameters<T>, query: DatabaseQuery<TableName>) {
		if (!parameters.search) {
			return;
		}
		let mode = SEARCH_MODE.NATURAL_LANGUAGE;
		if (ParameterActions.SEARCH_MODE in parameters.search && parameters.search.search_mode) {
			mode = parameters.search.search_mode;
		}
		const message = GetSearchModeMessage(mode);

		const queryString = 'match(' + parameters.search.match.toString() + ') against (? ' + message + ')';

		query.whereRaw(queryString, [parameters.search.term]);
	}

	static setWhere<T extends object, TableName extends TableNames>(
		parameters:
			| {
					[k in keyof T]?: T[k];
			  }
			| undefined,
		query: DatabaseQuery<TableName>
	) {
		if (!parameters) {
			return;
		}
		Object.entries(parameters).forEach(([key, value]) => {
			query.andWhere(key as never, value as never);
		});
	}

	static setOrder<T extends object, TableName extends TableNames>(parameters: ContextParameters<T>, query: DatabaseQuery<TableName>) {
		if (!('orders' in parameters) || !parameters.orders) {
			return;
		}

		//@ts-expect-error ta muito tarde.. desculpa tem que arrumar isso
		query.orderBy(parameters.orders);
	}

	static Build<T extends TableNames>(query: DatabaseQuery<T>, parameters: ContextParameters<object | Record<string, unknown>>): DatabaseQuery<T> {
		ContextMaker.setLimit(parameters, query);
		ContextMaker.setOrder(parameters, query);
		ContextMaker.setFullTextSearch(parameters, query);
		ContextMaker.setWhere(parameters.where, query);
		ContextMaker.setWhereIn(parameters, query);

		if (parameters.offset && parameters.offset > 0) {
			query.offset(parameters.offset);
		}

		if (parameters.select) {
			query.select(parameters.select);
		}

		return query as unknown as DatabaseQuery<T>;
	}
}
