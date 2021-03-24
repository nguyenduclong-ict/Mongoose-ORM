import { RuleItem, Rules } from "async-validator";
import { Schema, SchemaOptions, SchemaType, SchemaTypeOpts } from "mongoose";
import "reflect-metadata";
/**************** INTERFACE ****************/
interface IndexOptions {
    background?: boolean;
    expireAfterSeconds?: number;
    hidden?: boolean;
    name?: string;
    partialFilterExpression?: any;
    sparse?: boolean;
    storageEngine?: any;
    unique?: boolean;
    weights?: number;
    default_language?: string;
    language_override?: string;
    textIndexVersion?: string;
}
export interface IndexSetting<E> {
    fields: {
        [K in keyof E]?: 1 | -1 | "text";
    };
    options?: IndexOptions;
}
export interface EntityOptions<E = any> extends SchemaOptions {
    virtualId?: boolean;
    indexes?: IndexSetting<E>[];
    owner?: boolean;
    name?: string;
    description?: string;
    [x: string]: any;
}
export declare type FieldType = (SchemaTypeOpts<any> | Schema | SchemaType) & {
    ref?: string;
    slug?: any;
    validator?: RuleItem;
    subType?: String;
    name?: string;
    description?: string;
    cascade?: boolean | {
        create?: boolean;
        update?: boolean;
        delete?: boolean;
    };
    [x: string]: any;
};
/**************** DECORATOR ****************/
export declare function Entity<E>(options?: EntityOptions<E>): (target: any) => void;
export declare function Field(config?: FieldType): (target: any, key: string) => void;
export declare function DeleteDateField(config?: FieldType): (target: any, key: string) => void;
export declare function createSchema(classDefination: any): Schema<any, import("mongoose").Model<any>, undefined>;
export declare function getSchemaValidation(classDefination: any): Rules;
export {};
