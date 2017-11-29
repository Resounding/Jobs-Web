export interface IValidatable {
    validate():ValidationResult;
}

export interface ValidationResult {
    ok:boolean;
    errors:string[];
}

export interface PayloadValidationResult extends ValidationResult {
    payload:{id:string, rev:string}
}
