import { Connection, Document, FilterQuery, Model, Schema, UpdateQuery } from "mongoose";
import "reflect-metadata";
import { LiteralUnion } from "./types";
/**************** TYPES ****************/
export declare type RespositoryBaseActions = "list" | "find" | "findOne" | "create" | "createMany" | "update" | "updateOne" | "delete" | "softDelete" | "restoreSoftDelete";
export declare type PopulateItem<E = any> = LiteralUnion<keyof E> | {
    path: LiteralUnion<keyof E>;
    select?: string;
    model?: string;
    populate?: PopulateItem<E>;
};
export interface Context<E, M = any> {
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
export interface ContextCreate<E = any, M = any> extends Context<E, M> {
    data?: E;
}
export interface ContextCreateMany<E = any, M = any> extends Context<E, M> {
    data?: E[];
}
export interface ContextUpdate<E = any, M = any> extends Context<E, M> {
    data?: UpdateQuery<E>;
}
/**************** DECORATOR ****************/
export declare function Action(target: any, key: string, descriptor: any): void;
export declare function Hook(trigger: "before" | "after", actions: LiteralUnion<RespositoryBaseActions>[]): (target: any, key: any) => void;
export declare function resgisterRepository(repository: Repository, connection?: Connection): void;
export declare function getRepository(connection: Connection, name: string): Repository<any>;
export declare function getRepositories(connection: Connection): {
    [x: string]: Repository<any>;
};
export declare class Repository<E = any> {
    private static _globalInstance;
    name: string;
    connection: Connection;
    schema: Schema<Document<E>>;
    model: Model<Document<E>>;
    constructor(connection?: any);
    static get globalInstance(): Repository<any>;
    static registerHook(trigger: "before" | "after", actions: string[], handler: (ctx: Context<any, any>) => any): void;
    makeDefaultContext(ctx: Context<E>): void;
    list(ctx: Context<E>): Promise<{
        data: E[];
        page: number;
        totalPages: number;
        pageSize: number;
        total: number;
    }>;
    find(ctx: Context<E>): Promise<E[]>;
    findOne(ctx: Context<E>): Promise<E>;
    create(ctx: ContextCreate<E>): Promise<E>;
    createMany(ctx: ContextCreateMany<E>): Promise<E[]>;
    update(ctx: ContextUpdate<E>): Promise<E[]>;
    updateOne(ctx: ContextUpdate<E>): Promise<E>;
    delete(ctx: Context<E>): Promise<any>;
    softDelete(ctx: Context<E>): Promise<any>;
    restoreSoftDelete(ctx: Context<E>): Promise<any>;
    buildQuery(ctx: Context<E>): void;
    populate(query: any, populates?: PopulateItem[]): any;
    getReferenceModel(options: any, data: any): Promise<string>;
    protected cascadeCreate(ctx: ContextUpdate): Promise<UpdateQuery<any>>;
    protected cascadeUpdate(ctx: ContextUpdate): Promise<UpdateQuery<any>>;
    protected cascadeDelete(entity: any, ctx: ContextCreate): Promise<any>;
    validateEntity(data: Partial<E>, options?: {
        makeAllOptional?: boolean;
    }): Promise<{
        valid: boolean;
        errors?: {
            message: string;
            field: string;
        }[];
        fields?: any;
    }>;
}
