import { ConnectionOptions } from "mongoose";
export declare const KEYS: {
    SCHEMA_PATHS: string;
    SCHEMA_OPTIONS: string;
    SCHEMA_VALIDATOR: string;
    REPOSITORY_HOOKS: string;
};
export declare function waterFallPromises(promises: any[]): any;
interface UriOption {
    host?: string;
    port?: string | number;
    dbName?: string;
    user?: string;
    pass?: string;
    authSource?: string;
}
export declare function createMongoUri(options: UriOption | string): string;
export declare function createConnection(uri: string | UriOption, options?: ConnectionOptions): import("mongoose").Connection & Promise<import("mongoose").Connection>;
export declare function getObjectId(value: any): any;
export declare function Inject<T = any>(options?: Partial<T>): (target: any) => void;
export declare function getParentClasses(targetClass: any): string[];
export {};
