/* eslint-disable max-classes-per-file */

import { Validation } from '../Validation';

export const ERROR_CODES = {
    MISSING_KEYS: 1,
    NULL: 2,
    EMPTY: 3,
    INVALID: 4,
    INVALID_VALUE: 5,
    MIN_LENGTH: 6,
    MAX_LENGTH: 7,
    MISSING_PROPERTY: 8,
    MINIMUM: 9,
} as const;

// error code values
export type ERROR_CODES_TYPE = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export type INVALID_ERROR_CODE_MESSAGE = {
    message: string;
    code: ERROR_CODES_TYPE;
};

export type OnErrorType<T = unknown> =
    | ((item: T) => INVALID_ERROR_CODE_MESSAGE)
    | INVALID_ERROR_CODE_MESSAGE;

export class ValidatorTesting<T> {
    items: ((item: T) => unknown)[] = [];
    errors: OnErrorType<T>[] = [];

    add(item: (item: T) => unknown, onError: OnErrorType<T>): this;
    add(item: unknown, onError: OnErrorType<T>) {
        if (Array.isArray(item)) {
            item.forEach((ai) => {
                this.items.push(ai[0]);
                this.errors.push(ai[1]);
            });
            return this;
        } else if (typeof item === 'function') {
            //@ts-expect-error idk how to fix that
            this.items.push(item);
        }
        if (onError) {
            this.errors.push(onError);
        }

        return this;
    }
}

export abstract class Validator<T> {
    abstract isValid(testingItem: unknown): testingItem is T;
    abstract getErrors(): INVALID_ERROR_CODE_MESSAGE[];
}
export abstract class ItemValidator<T> extends Validator<T> {
    abstract add(func: (item: T) => unknown, onError: OnErrorType<T>): this;
}

export class ItemPropertyValidator<T> implements ItemValidator<T> {
    private readonly items: {
        func: (item: unknown) => unknown;
        onError: OnErrorType;
    }[];

    private errors: INVALID_ERROR_CODE_MESSAGE[];
    constructor() {
        this.items = [];
        this.errors = [];
    }

    getItems() {
        return this.items;
    }

    add(func: (item: T) => unknown, onError: OnErrorType<T>) {
        //isso so pra ter type completions, nao eh pra ser assim. eh pra ser o de baixo
        const obj = {
            func: func as (item: unknown) => unknown,
            onError: onError as OnErrorType,
        };
        this.items.push(obj);

        return this;
    }
    static isValid<T>(itemValidator: ItemValidator<T>, item: T) {
        return itemValidator.isValid(item);
    }
    isValid(validationItem: unknown): validationItem is T {
        let returnType = true;
        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            if (!item || !item.func) continue;
            if (typeof item.func !== 'function') {
                console.trace();
            }

            const result = item.func(validationItem);

            // eslint-disable-next-line eqeqeq
            if (result == false) {
                if (typeof item.onError === 'function') {
                    this.errors.push(item.onError(validationItem));
                } else if (item.onError) {
                    this.errors.push(item.onError);
                }

                returnType = false;
            }
        }
        return returnType;
    }
    getErrors() {
        const errs = this.errors.map((x) => x);
        this.errors = [];
        return errs;
    }
}
export class KeyValueValidator<T extends object> implements ItemValidator<T> {
    private validator: ItemPropertyValidator<T>;

    constructor(object: T) {
        this.validator = new ItemPropertyValidator();

        this.validator
            .add(
                (item) => {
                    return (
                        Validation.keys.getMissing(item, object).length === 0
                    );
                },
                (item) =>
                    Validation.messages.missingKeys(
                        Validation.keys.getMissing(item, object),
                    ),
            )
            .add(
                (item) => {
                    const correctTypes = Validation.types.hasCorrect(
                        item,
                        object,
                    );
                    return correctTypes;
                },
                (item) => Validation.messages.missingTypes(item, object),
            );
    }
    getItems() {
        return this.validator.getItems();
    }

    add(func: (item: T) => unknown, onError: OnErrorType<T>) {
        this.validator.add(func, onError);
        return this;
    }
    isValid(validationItem: object): validationItem is T {
        return this.validator.isValid(validationItem);
    }
    getErrors() {
        return this.validator.getErrors();
    }
}
