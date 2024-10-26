import { ERROR_CODES, ERROR_CODES_TYPE, INVALID_ERROR_CODE_MESSAGE } from './ItemValidation/itemValidation';

class ValidationMessages {
	static new(message: string, code: ERROR_CODES_TYPE): INVALID_ERROR_CODE_MESSAGE {
		return {
			message: message,
			code: code,
		};
	}
	static typeof(field1: string | number, field2: string | number, statusCode: ERROR_CODES_TYPE = ERROR_CODES.INVALID) {
		return ValidationMessages.new(`${field1} has to be type of ${field2}`, statusCode);
	}
	static greaterThan(
		field1: string | number,
		field2: string | number,
		statusCode: ERROR_CODES_TYPE = ERROR_CODES.INVALID
	): INVALID_ERROR_CODE_MESSAGE {
		return ValidationMessages.new(`${field1} has to be greater than ${field2}`, statusCode);
	}

	static required(key: string, statusCode: ERROR_CODES_TYPE = ERROR_CODES.MISSING_PROPERTY): INVALID_ERROR_CODE_MESSAGE {
		return ValidationMessages.new(`the key ${key} is required`, statusCode);
	}

	static missingKey(key: string, statusCode: ERROR_CODES_TYPE = ERROR_CODES.MISSING_PROPERTY): INVALID_ERROR_CODE_MESSAGE {
		return ValidationMessages.new(`the key ${key} is missing`, statusCode);
	}
	static lessThan(
		field1: string | number,
		field2: string | number,
		statusCode: ERROR_CODES_TYPE = ERROR_CODES.INVALID
	): INVALID_ERROR_CODE_MESSAGE {
		return ValidationMessages.new(`${field1} has to be less than ${field2}`, statusCode);
	}

	static equalTo(field1: string, field2: string | number, statusCode: ERROR_CODES_TYPE = ERROR_CODES.INVALID): INVALID_ERROR_CODE_MESSAGE {
		return ValidationMessages.new(`${field1} must be equal to ${field2}`, statusCode);
	}
	static invalid(field1: string | number, field2: string | number, statusCode: ERROR_CODES_TYPE) {
		return ValidationMessages.new(`${field1} is an invalid ${field2}`, statusCode);
	}

	static missingTypes(base: object, correct: object, errorCode = ERROR_CODES.INVALID): INVALID_ERROR_CODE_MESSAGE {
		return ValidationMessages.new(
			`${JSON.stringify(
				Validation.types.getMissing(base, correct)?.map((item) => {
					if (!item.path) {
						return `${item.key} should be ${item.type} in item`;
					}
					return `${item.key} should be ${item.type} in ${item.path}`;
				})
			)}`,
			errorCode
		);
	}
	static missingKeys(missingKeys: string | string[], errorCode: ERROR_CODES_TYPE = ERROR_CODES.MISSING_KEYS) {
		let keys: string | string[] = missingKeys;
		if (missingKeys instanceof Array) {
			keys = missingKeys.join(',');
		}

		console.error(`${keys} are missing from the item`);

		return ValidationMessages.new(`${keys} are missing from the item`, errorCode);
	}
}

export class Validation {
	static messages = ValidationMessages;
	static keys = {
		getMissing<T extends object>(obj: T, valid: T, missingKeys: string[] = []): string[] {
			for (const key in valid) {
				if (!(key in obj)) {
					missingKeys.push(key);
					continue;
				}

				if (key in obj && obj[key] && typeof valid[key] === 'object' && !Array.isArray(valid[key])) {
					Validation.keys.getMissing(obj[key] as T, valid[key] as T, missingKeys);
				}
			}
			return missingKeys;
		},
		hasMissing<T extends object>(obj: object, valid: T): obj is T {
			for (const key in valid) {
				if (!key) continue;
				if (!(key in obj)) {
					console.error(`${key} is missing from ${JSON.stringify(obj, null, 2)}`);
					return false;
				}
				if (key in obj && obj[key as never] && typeof valid[key] === 'object' && !Array.isArray(valid[key])) {
					//@ts-expect-error aosdfn
					const k = obj[key];
					if (typeof k === 'object') return Validation.keys.hasMissing(k, valid[key] as object);
				}
			}
			return true;
		},
	};
	static types = {
		getMissing<Obj extends object>(
			obj: Obj,
			valid: Obj,
			missingTypes: { key: string; type: string; path: string }[] = [],
			path: string[] = []
		): { key: string; type: string; path: string }[] {
			for (const key in valid) {
				if (!(key in obj)) {
					missingTypes.push({
						key,
						type: typeof valid[key],
						path: path.join('.'),
					});
					continue;
				}
				if (typeof obj[key] !== typeof valid[key]) {
					//TODO: should we prepare for this?
					if (typeof valid[key] === 'boolean' && (obj[key] === 1 || obj[key] === 0)) {
						continue;
					}
					missingTypes.push({
						key,
						type: typeof valid[key],
						path: path.join('.'),
					});
				} else if (typeof obj[key as keyof Obj] === 'object' && !Array.isArray(obj[key]) && !Array.isArray(valid[key])) {
					path.push(key);
					Validation.types.getMissing(
						//typescript is fun
						obj[key as keyof Obj] as object,
						valid[key as keyof Obj] as object,
						missingTypes,
						path
					);
					path.pop();
				}
			}
			return missingTypes;
		},
		hasCorrect<T extends object>(obj: T, valid: T) {
			return Validation.types.getMissing(obj, valid).length === 0;
		},
	};
}
