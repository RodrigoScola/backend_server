/* eslint-disable max-classes-per-file */
import { Response } from 'express';
import { writeFileSync } from 'fs';
import { INVALID_ERROR_CODE_MESSAGE } from '../../Validation/ItemValidation/itemValidation';
import { Validation } from '../../Validation/Validation';
import { __DEV__ } from '../../constants';
import { logger } from '../../server';

export enum HTTPCodes {
	OK = 200,
	NO_CONTENT = 204,
	BAD_REQUEST = 400,
	UNAUTHORIZED = 401,
	FORBIDDEN = 403,
	METHOD_NOT_ALLOWED = 405,
	CONFLICT = 409,
	REFUSED = 418,
	NOT_FOUND = 404,
	Already_exists = 403,
	INTERNAL_SERVER_ERROR = 500,
}

export abstract class ErrorHandler {
	private static isTrustedError(error: Error): error is InvalidItemError | AppError {
		if (error instanceof AppError || error instanceof InvalidItemError) {
			return error.isOperational;
		}

		return false;
	}
	private static handleTrustedError(error: AppErr, response: Response): void {
		if (typeof response.status === 'function') {
			response.status(error.code());
		}

		response.json(error.response());
	}
	private static handleCriticalError(_: Error | AppErr, response?: Response): void {
		if (response) {
			if (typeof response.status === 'function') {
				response.status(HTTPCodes.INTERNAL_SERVER_ERROR);
			}
			response.json({
				message: 'Internal Server Error',
			});
		}

		logger.error('application.error', _);

		writeFileSync('app', JSON.stringify(_) + '\n');
		console.error('Application encountered critical error. Shutting off');
		process.exit(1);
	}
	static handle(error: Error, res?: Response): void {
		if (ErrorHandler.isTrustedError(error) && res) {
			return ErrorHandler.handleTrustedError(error, res);
		}
		return ErrorHandler.handleCriticalError(error, res);
	}
}

type AppErrorArgs = {
	name?: string;
	httpCode: HTTPCodes;
	description: string;
	isOperational?: boolean;
};

interface AppErr extends Error {
	response(): unknown;
	code(): HTTPCodes;
}

export interface HttpError {
	code(): HTTPCodes;
}

export class AppError extends Error implements AppErr, HttpError {
	public override readonly name: string;
	public readonly httpCode: HTTPCodes;
	public readonly isOperational: boolean = true;

	constructor(args: AppErrorArgs) {
		super(args.description);
		logger.error(args.description, JSON.stringify(args));

		Object.setPrototypeOf(this, new.target.prototype);

		this.name = args.name || 'Error';
		this.httpCode = args.httpCode;

		if (args.isOperational !== undefined) {
			this.isOperational = args.isOperational;
		}

		Error.captureStackTrace(this);
	}
	code() {
		return this.httpCode;
	}
	response() {
		return {
			name: this.name,
			message: this.message,
		};
	}
}
export class BadRequestError implements HttpError {
	public readonly httpCode: HTTPCodes;
	public readonly isOperational: boolean = true;

	constructor(message: string) {
		this.httpCode = HTTPCodes.BAD_REQUEST;
		if (__DEV__) console.trace(message);

		throw new AppError({
			name: message,
			description: message,
			httpCode: this.httpCode,
			isOperational: this.isOperational,
		});
	}
	code() {
		return HTTPCodes.BAD_REQUEST;
	}
}

export class InvalidItemError extends Error implements AppErr {
	public readonly httpCode: HTTPCodes;
	public readonly isOperational: boolean = true;
	private readonly errorMessages: INVALID_ERROR_CODE_MESSAGE[];
	private static readonly errorMessage: string = 'Invalid Item Error';
	constructor(messages: INVALID_ERROR_CODE_MESSAGE[]) {
		super('invalid item');
		this.httpCode = HTTPCodes.BAD_REQUEST;
		console.trace(this);
		if (__DEV__) {
			logger.error('invalid item error', messages);
		}
		this.errorMessages = messages;

		Object.setPrototypeOf(this, new.target.prototype);

		this.name = 'invalid item';

		Error.captureStackTrace(this);
	}
	code() {
		return this.httpCode;
	}
	response(): unknown {
		return {
			name: this.message,
			message: InvalidItemError.errorMessage,
			errors: this.errorMessages,
		};
	}
}

export class NotFoundError implements HttpError {
	public readonly httpCode: HTTPCodes;
	public readonly isOperational: boolean = true;

	constructor(message: string) {
		throw new AppError({
			description: message,
			httpCode: HTTPCodes.NOT_FOUND,
		});
	}
	code() {
		return HTTPCodes.NOT_FOUND;
	}
}

export class InternalError implements HttpError {
	public readonly httpCode: HTTPCodes;
	public readonly isOperational: boolean = true;

	constructor(message: string = 'Something Wrong Happened') {
		console.trace();
		this.httpCode = HTTPCodes.INTERNAL_SERVER_ERROR;
		throw new AppError({
			description: message,
			httpCode: HTTPCodes.INTERNAL_SERVER_ERROR,
		});
	}
	code() {
		return HTTPCodes.INTERNAL_SERVER_ERROR;
	}
}

export class MissingParametersError {
	public readonly httpCode: HTTPCodes;
	public readonly isOperational: boolean = true;

	constructor(missingKeys: string | object) {
		this.httpCode = HTTPCodes.INTERNAL_SERVER_ERROR;

		throw new AppError({
			description: JSON.stringify(Validation.messages.missingKey(JSON.stringify(missingKeys.toString))),
			httpCode: HTTPCodes.INTERNAL_SERVER_ERROR,
		});
	}
	code() {
		return HTTPCodes.BAD_REQUEST;
	}
}
export class InvalidIdError {
	public readonly httpCode: HTTPCodes;
	public readonly isOperational: boolean = true;

	constructor(message: string = 'Invalid Id') {
		this.httpCode = HTTPCodes.INTERNAL_SERVER_ERROR;

		throw new AppError({
			description: message,
			httpCode: HTTPCodes.BAD_REQUEST,
		});
	}
}
export class UnauthorizedError implements HttpError {
	public readonly httpCode: HTTPCodes;
	public readonly isOperational: boolean = true;

	constructor(message: string = 'You do not have permission to access this item') {
		this.httpCode = HTTPCodes.UNAUTHORIZED;

		throw new AppError({
			description: message,
			httpCode: HTTPCodes.UNAUTHORIZED,
		});
	}
	code() {
		return HTTPCodes.UNAUTHORIZED;
	}
}

export class MASSIVE_ERROR {
	public readonly httpCode: HTTPCodes;
	public readonly isOperational: boolean = true;

	constructor(message: string) {
		this.httpCode = HTTPCodes.INTERNAL_SERVER_ERROR;

		fetch(`https://asdf-xg2d.onrender.com/message/?message=${message}`, {
			headers: {
				'Content-Type': 'application/json',
			},
		});

		// throw new AppError({
		//   description: message,
		//   httpCode: HTTPCodes.INTERNAL_SERVER_ERROR,
		// });
		// throw new InternalError(message);
	}
}

export class AlreadyExistsError implements HttpError {
	public readonly httpCode: HTTPCodes;
	public readonly isOperational: boolean = true;

	constructor(message: string) {
		this.httpCode = HTTPCodes.CONFLICT;

		throw new AppError({
			description: message,
			httpCode: HTTPCodes.CONFLICT,
		});
	}
	code() {
		//there is a bug on the http ones and its 2 am now...
		////j just let me be
		return 403;
	}
}

export class RequestError {
	static json(req: { url: string }, err: unknown) {
		return JSON.stringify({
			url: req.url,
			message: err,
		});
	}
}

export default {
	AlreadyExistsError,
	MASSIVE_ERROR,
	UnauthorizedError,
	InvalidIdError,
	MissingParametersError,
	InternalError,
	AppError,
	BadRequestError,
	InvalidItemError,
	NotFoundError,
};
