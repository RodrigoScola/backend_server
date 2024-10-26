import { HttpError } from '../ErrorHandling/ErrorHandler';

type expected = 'bigint' | 'boolean' | 'function' | 'number' | 'object' | 'string' | 'symbol' | 'undefined';

type ErrorConstructor = new (message: string) => Error | HttpError;

export class CuboAssert {
	private static defaultMessage: string = 'expected true, received false';

	private getType(value: unknown): string {
		const typeString = Object.prototype.toString.call(value);
		const match = typeString.match(/\[object (\w+)\]/);
		this.ok(match && match[1]);
		return match ? match[1].toLowerCase() : 'unknown';
	}
	throw(message: string, ErrorConstructor?: ErrorConstructor) {
		if (ErrorConstructor) {
			throw new ErrorConstructor(message);
		}
		throw new Error(message);
	}

	typeof(t: unknown, expected: expected, message?: string, ErrorConstructor?: new (message: string) => Error | HttpError) {
		const actualType = this.getType(t);
		if (actualType !== expected) {
			const errorMessage = message || `Expected type '${expected}', but received type '${actualType}'`;
			this.throw(errorMessage, ErrorConstructor);
		}
		return this;
	}
	eq(num: number, target: number, message?: string, ErrorConstructor?: new (message: string) => Error | HttpError) {
		this.ok(num === target, message, ErrorConstructor);
	}
	ok(t: unknown, message?: string, ErrorConstructor?: new (message: string) => Error | HttpError): asserts t {
		if (!t) {
			this.throw(message ?? CuboAssert.defaultMessage, ErrorConstructor);
		}
	}
}

export const asserts = new CuboAssert();
