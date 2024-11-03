import { HTTPCodes } from '../lib/ErrorHandling/ErrorHandler';
import { ParameterActions } from './contextTypes';

export type ApiGetStatus<T extends Partial<Record<HTTPCodes, unknown>> & { 200: unknown }> = {
	[HTTPCodes.INTERNAL_SERVER_ERROR]: string;
	[HTTPCodes.UNAUTHORIZED]: string;
	[HTTPCodes.BAD_REQUEST]: string;
	[HTTPCodes.NOT_FOUND]: string;
} & {
	[K in keyof T]: T[K];
};
export type ApiPostStatus<T extends Partial<Record<HTTPCodes, unknown>>> = {
	[HTTPCodes.INTERNAL_SERVER_ERROR]: string;
	[HTTPCodes.UNAUTHORIZED]: string;
	[HTTPCodes.BAD_REQUEST]: string;
} & {
	[K in keyof T]: T[K];
};

export type ApiUpdateStatus<T extends Partial<Record<HTTPCodes, unknown>> & { 200: unknown }> = {
	[HTTPCodes.INTERNAL_SERVER_ERROR]: string;
	[HTTPCodes.UNAUTHORIZED]: string;

	[HTTPCodes.BAD_REQUEST]: string;
} & {
	[K in keyof T]: T[K];
};

export type ApiDeleteStatus<T extends Partial<Record<HTTPCodes, unknown>> & { 200: unknown }> = {
	[HTTPCodes.INTERNAL_SERVER_ERROR]: string;
	[HTTPCodes.UNAUTHORIZED]: string;
} & {
	[K in keyof T]: T[K];
};

export type QueryFilter<T extends object = object> = Partial<{
	[ParameterActions.ORDER]: 'asc' | 'desc';
	[ParameterActions.ORDER_BY]: T extends object ? keyof T : string;
	[ParameterActions.LIMIT]: number;
	[ParameterActions.OFFSET]: number;
	[ParameterActions.SELECT]: keyof T | (keyof T)[];
}> & {
	[K in keyof T]?: T[K];
};

export type ToQuery<T extends object> = {
	[x in keyof T]: T[x];
};
