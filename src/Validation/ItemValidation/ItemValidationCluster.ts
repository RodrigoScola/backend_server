import { INVALID_ERROR_CODE_MESSAGE, Validator } from './itemValidation';

export class ValidationCluster<T extends object> extends Validator<T> {
    private readonly validators: Validator<T>[];
    private errors: INVALID_ERROR_CODE_MESSAGE[];
    constructor(items: Validator<T>[] = []) {
        super();
        this.validators = items;
        this.errors = [];
    }

    add(validator: Validator<T>) {
        this.validators.push(validator);
        return this;
    }
    isValid(item: object): item is T {
        let result = true;
        this.validators.forEach((validator) => {
            if (!validator.isValid(item)) {
                validator.getErrors().forEach((err) => {
                    console.log(err);
                    if (!err) return;
                    result = false;
                    this.errors.push(err);
                });
            }
        });
        return result;
    }
    getErrors(): INVALID_ERROR_CODE_MESSAGE[] {
        const errors = this.errors.map((x) => x).flat();

        this.errors = [];

        return errors;
    }
}
