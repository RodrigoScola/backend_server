import { ParsedQs } from 'qs';
import { logger } from '../server';
import { Orders } from '../types/contextTypes';
import { ItemStatus } from '../types/db_types';
type ReturObj = Record<string | number, unknown>;
export abstract class Formatter {
	static getArrayFromString<T>(str: string): T[] {
		const itemids: number[] = [];
		const splitted = str.split(',');

		for (const item of splitted) {
			if (!item) continue;
			const numberId = Number(item.replace(/[^0-9]/g, ''));
			if (!numberId) continue;
			itemids.push(numberId);
		}
		return itemids as unknown as T[];
	}
	static ChangeType<T extends object>(
		obj: {
			// eslint-disable-next-line no-unused-vars
			[x in keyof object]: unknown;
		},
		valid: T
	): asserts obj is T {
		for (const key in valid) {
			//@ts-expect-error lalala
			const objKey = obj[key as keyof T];
			if (!(key in obj)) {
				continue;
			}

			if (typeof objKey === 'object' && typeof valid[key] === 'object') {
				Formatter.ChangeType(objKey, valid[key as keyof T] as object);
			}
			if (typeof valid[key] === 'number') {
				//@ts-expect-erroroiajsdfoijasdf
				obj[key] = Number(objKey);
			}
			if (typeof valid[key] === 'string') {
				//@ts-expect-error aosidjoaisdjf
				obj[key] = String(obj[key]);
			}
			if (typeof valid[key] === 'boolean') {
				//@ts-expect-error idk typscript
				obj[key as keyof T] = Boolean(obj[key as keyof T]);
			}
		}
	}

	static IsValidOrder(order?: Orders): order is Orders {
		return Boolean(order && (order === 'asc' || order === 'desc'));
	}
	static QueryToObject(parsedQs: ParsedQs): Record<string, string> {
		const obj: Record<string, string> = {};
		if (!parsedQs || typeof parsedQs === 'undefined') return {};
		for (const key in parsedQs) {
			const q = parsedQs[key];
			if (parsedQs && key in parsedQs && q && Array.isArray(q)) {
				obj[key] = q.join(',');
			} else if (typeof parsedQs[key] === 'object' && parsedQs[key] !== null) {
				obj[key] = JSON.stringify(parsedQs[key]);
			} else {
				obj[key] = parsedQs[key] as string;
			}
		}
		return obj;
	}

	static isValidStatus(num: number): num is ItemStatus {
		return Object.values(ItemStatus).includes(num as ItemStatus);
	}
	static isInEnum<T extends string | number>(item: T, enumType: Record<string, T>): item is (typeof enumType)[keyof typeof enumType] {
		return Object.values(enumType).includes(item);
	}

	static AddMissingValues<T extends object>(invalid: Partial<T>, valid: T): T {
		for (const [key, value] of Object.entries(valid)) {
			if (key in invalid) continue;

			invalid[key as keyof typeof invalid] = value;
		}

		return invalid as T;
	}
	static removeIfempty<T extends object>(object: T): T {
		Object.keys(object).forEach((key) => {
			if (Array.isArray(object[key as keyof T])) {
				//@ts-expect-error eu nao sei pq nn ta pegando aqui
				if (object[key].length === 0) {
					delete object[key as keyof T];
					return;
				}
				//@ts-expect-error eu nao sei pq nn ta pegando aqui
				object[key as keyof T] = Formatter.removeIfempty(
					//@ts-expect-error eu nao sei pq nn ta pegando aqui
					object[key as keyof T]
				);
			}
		});
		return object;
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	static isKeyof<T extends object>(key: any, obj: T): key is keyof T {
		return key in obj;
	}
	static includesInArray<T>(array: T[], value: T): value is T {
		return array.includes(value);
	}
	static isValidDate(date: string): boolean {
		return !isNaN(Date.parse(date));
	}
	static ToBrazil(date: number) {
		return new Date(date - 3 * 60 * 60 * 1000);
	}

	static toSqlTimeStamp(date: Date | string) {
		if (date instanceof Date) {
			return date.toISOString().slice(0, 19).replace('T', ' ');
		}
		return new Date(date).toISOString().slice(0, 19).replace('T', ' ');
	}

	static cleanObject<T extends object>(body: object, target: T): T {
		const n: Partial<T> = { ...body };
		Object.keys(n).forEach((key) => {
			if (!!key && target && typeof key === 'string' && !Object.keys(target).includes(key as string)) {
				delete n[key as keyof T];
			}
		});
		return n as unknown as T;
	}

	static isValidUrl(url: string) {
		try {
			const newUrl = new URL(url);
			return newUrl.protocol === 'http:' || newUrl.protocol === 'https:';
		} catch (err) {
			logger.error('invalid url', err);
			return false;
		}
	}
	// im sorry
	private static walk(newObj: ReturObj, old: ReturObj, not?: (keyof typeof old)[]): void {
		for (const [key, value] of Object.entries(old)) {
			const newKey = not?.includes(key) ? key : key.charAt(0).toLowerCase() + key.slice(1);
			if (Array.isArray(value)) {
				newObj[newKey] = [...value];
				Formatter.firstLetterLower(newObj[newKey] as ReturObj, value);
			} else if (value instanceof Object) {
				newObj[newKey] = {};
				Formatter.firstLetterLower(newObj[newKey] as ReturObj, value as (string | number)[]);
			} else {
				newObj[newKey as keyof typeof newObj] = value;
			}
		}
	}
	private static f1(newObj: ReturObj, old: ReturObj, not?: (keyof typeof old)[]): ReturObj {
		Formatter.walk(newObj, old, not);
		return newObj;
	}
	static firstLetterLower<T extends object>(old: T, except?: (keyof T)[]): object {
		const newObj = {};
		Formatter.f1(newObj, old as ReturObj, except as never);

		return newObj;
	}

	static getEnumKeyByValue<T extends object>(enumerator: T, key: unknown) {
		for (const entry of Object.entries(enumerator)) {
			if (entry[1] === key) {
				return entry[0];
			}
		}
	}
	static splitItemsByStatus<T extends object, K extends keyof T, Id extends T[K]>(ids: Id[], items: T[], key: keyof T) {
		const newItems: T[] = [];
		const existingItems: T[] = [];

		while (items.length > 0) {
			const item = items.pop();
			if (!item) continue;
			const inc = ids.includes(item[key] as Id);
			if (inc) {
				existingItems.push(item);
			} else {
				newItems.push(item);
			}
		}

		// items.forEach(( item ) => {
		//      const inc = ids.includes( item[key] as Id )
		//      if ( inc ) {
		//           existingItems.push( item );
		//      } else {
		//           newItems.push( item );
		//      }
		// });

		return {
			newItems,
			existingItems: existingItems,
		};
	}
}
