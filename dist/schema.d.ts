import { Rules } from "async-validator";
import { EntityOptions, FieldType } from "./declaration";
import { Schema } from "mongoose";
import "reflect-metadata";
export declare function Entity<E>(options?: EntityOptions<E>): (target: any) => void;
export declare function Field(config?: FieldType): (target: any, key: string) => void;
export declare function DeleteDateField(config?: FieldType): (target: any, key: string) => void;
export declare function createSchema(classDefination: any): Schema<any, import("mongoose").Model<any>, undefined>;
export declare function getSchemaValidation(classDefination: any): Rules;
