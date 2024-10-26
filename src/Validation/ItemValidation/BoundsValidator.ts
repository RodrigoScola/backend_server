import { Validation } from '../Validation';
import {
    ItemValidator,
    ItemPropertyValidator,
    ERROR_CODES,
    OnErrorType,
} from './itemValidation';

export class BoundsValidator<T extends object> extends ItemValidator<T> {
    validator: ItemPropertyValidator<T>;
    min: number;
    max: number;

    constructor(
        validObject: T,
        props: {
            min: number;
            max: number;
        },
    ) {
        super();
        this.min = props.min;
        this.max = props.max;
        this.validator = new ItemPropertyValidator<T>();

        Object.entries(validObject).forEach(([key, value]) => {
            if (typeof value === 'number') {
                this.validator
                    .add(
                        (item) => this.max > item[key as never],
                        Validation.messages.new(
                            `${key} is over our max`,
                            ERROR_CODES.MAX_LENGTH,
                        ),
                    )
                    .add(
                        (item) => {
                            return this.min <= item[key as never];
                        },
                        Validation.messages.new(
                            `${key} is under our min`,
                            ERROR_CODES.MIN_LENGTH,
                        ),
                    );
            } else if (typeof value === 'string') {
                this.validator
                    .add(
                        () => value.length >= this.min,
                        Validation.messages.new(
                            `${key} is under our min`,
                            ERROR_CODES.MIN_LENGTH,
                        ),
                    )
                    .add(
                        () => value.length <= this.max,
                        Validation.messages.new(
                            `${key} is over our max`,
                            ERROR_CODES.MIN_LENGTH,
                        ),
                    );
            }
        });
    }

    add(func: (item: T) => unknown, onError: OnErrorType<T>) {
        this.validator.add(func, onError);
        return this;
    }

    getItems() {
        return this.validator.getItems();
    }

    isValid(testingItem: object): testingItem is T {
        return this.validator.isValid(testingItem);
    }
    getErrors() {
        return this.validator.getErrors();
    }
}
