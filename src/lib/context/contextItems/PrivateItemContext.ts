import { ContextInstance, ContextParameters, ContextQuery } from '../../../types/contextTypes';
import { DatabaseQuery, ItemStatus, TableFields, TableNames } from '../../../types/db_types';
import { ContextMaker } from '../ItemContext';

type Parameters<T extends object> = ContextParameters<T>;

export type PrivateItemContextMakerProps<T extends TableNames> = {
	name: T;
	query: ContextQuery<T>;
};

export class PrivateItemContextMaker<T extends TableNames> implements ContextInstance<T> {
	private ignoreWithStatus: ItemStatus[] = [];
	private parameters: Parameters<TableFields[T]>;
	private tableName: T | undefined;
	private sellerId: number | undefined;
	private query?: DatabaseQuery<T>;

	constructor() {
		this.ignoreWithStatus = [];

		this.parameters = {};
	}
	GetQuery(): DatabaseQuery<T> {
		if (!this.query) throw new Error('query not set');
		return this.query;
	}
	init(props: PrivateItemContextMakerProps<T>) {
		this.tableName = props.name;
		this.query = props.query;

		return this;
	}
	SetIgoreStatus(status: ItemStatus[] | ItemStatus | null | undefined): this {
		//para nao acontecer acidentes, pelo menos a pessoa ve a prop hidden Status
		if (!status) {
			return this;
		}
		if (Array.isArray(status)) {
			this.ignoreWithStatus = status;
		} else {
			this.ignoreWithStatus.push(status);
		}
		return this;
	}

	SetParameters<T extends object>(parameters: ContextParameters<T> | undefined): this {
		Object.assign(this.parameters, parameters);
		return this;
	}

	Build(): DatabaseQuery<T> {
		if (!this.tableName) throw new Error('table not set');
		if (!this.query) throw new Error('query not set');

		if (this.sellerId) {
			this.query.andWhere(`${this.tableName}.sellerId`, this.sellerId);
		}

		if (this.ignoreWithStatus) {
			this.query.whereNotIn(`${this.tableName}.status`, this.ignoreWithStatus);
		}

		ContextMaker.setLimit(this.parameters, this.query);
		ContextMaker.setOrder(this.parameters, this.query);
		ContextMaker.setWhere(this.parameters.where, this.query);
		ContextMaker.setFullTextSearch(this.parameters, this.query);
		ContextMaker.setWhereIn(this.parameters, this.query);

		if (this.parameters.offset && this.parameters.offset > 0) {
			this.query.offset(this.parameters.offset);
		}

		if (this.parameters.select) {
			this.query.select(this.parameters.select);
		}

		return this.query as unknown as DatabaseQuery<T>;
	}
}
