import { RuleItem } from "async-validator";
import { FilterQuery, Schema, SchemaOptions, SchemaType, SchemaTypeOpts, UpdateQuery } from "mongoose";
declare global {
    namespace MongooseOrm {
        type LiteralUnion<T extends U, U = string | symbol | number> = T | (U & {});
        type RespositoryBaseActions = "list" | "find" | "findOne" | "create" | "createMany" | "update" | "updateOne" | "delete" | "softDelete" | "restoreSoftDelete";
        type PopulateItem<E = any> = LiteralUnion<keyof E> | {
            path: LiteralUnion<keyof E>;
            select?: string;
            model?: string;
            populate?: PopulateItem<E>;
        };
        interface Context<E, M = any> {
            query?: FilterQuery<E & {
                id: any;
                _id: any;
            }>;
            populates?: PopulateItem<E>[];
            skip?: number;
            limit?: number;
            page?: number;
            pageSize?: number;
            sort?: string | {
                [x in keyof E]: 1 | -1;
            };
            new?: boolean;
            projection?: any;
            session?: any;
            select?: any;
            meta?: M;
            softDelete?: boolean;
        }
        interface ContextCreate<E = any, M = any> extends Context<E, M> {
            data?: E;
        }
        interface ContextCreateMany<E = any, M = any> extends Context<E, M> {
            data?: E[];
        }
        interface ContextUpdate<E = any, M = any> extends Context<E, M> {
            data?: UpdateQuery<E>;
        }
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
        interface IndexSetting<E> {
            fields: {
                [K in keyof E]?: 1 | -1 | "text";
            };
            options?: IndexOptions;
        }
        interface EntityOptions<E = any> extends SchemaOptions {
            indexes?: IndexSetting<E>[];
            owner?: boolean;
            name?: string;
            description?: string;
            [x: string]: any;
        }
        type FieldType = (SchemaTypeOpts<any> | Schema | SchemaType) & {
            ref?: string;
            slug?: any;
            validator?: RuleItem;
            name?: string;
            description?: string;
            cascade?: boolean | {
                create?: boolean;
                update?: boolean;
                delete?: boolean;
            };
            [x: string]: any;
        } & CustomFieldType;
        type CustomFieldType = {};
    }
}
export = MongooseOrm;
