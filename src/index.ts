import PouchDB from "pouchdb";
import { isEqual } from "lodash";
import Ajv, { ErrorObject, ValidateFunction } from "ajv"

const SCHEMA = "schema"
const VALIDATE = "validate"
const DATA = "data"
const SEP = "/"

function path(...parts:string[]) {
    return parts.join(SEP)
}

export interface JSPOptions {
    name?: string
    pouchOptions?: PouchDB.Configuration.DatabaseConfiguration
}

export interface JSPConfiguration {
    tables: Record<string, any>
}
export interface ValidationContext {
    valid:boolean, 
    errors:ErrorObject<
        string, 
        Record<string, any>, unknown
    >[]
}


type _Validation = ValidationContext & PouchDB.Core.IdMeta & PouchDB.Core.GetMeta
type _Schema = {content: ValidationContext} & PouchDB.Core.IdMeta & PouchDB.Core.GetMeta
type _Record = {content: Record<string, any>} & PouchDB.Core.IdMeta & PouchDB.Core.GetMeta

function deconstructKey(key: string): {tableName:string, recordKey:string} {
    const [_, tableName, recordKey] = key.split(SEP);
    return {tableName, recordKey}
}

export class JSONSchemaPouch {
    private db: PouchDB.Database;
    private ajv: Ajv;
    private _schemaCache: Map<string, any>;
    private _validatorCache: Map<string, ValidateFunction>;

    constructor({name, pouchOptions}: JSPOptions) {
        this.db = new PouchDB(name, pouchOptions);
        this.ajv = new Ajv()
        this._schemaCache = new Map<string, any>
        this._validatorCache = new Map<string, ValidateFunction>
    }

    async get(...parts:string[]) {
        return this.db.get(path(...parts))
    }

    async getValidator(tableName: string) {
        if (this._validatorCache.get(tableName) === undefined) {
            const schema = await this.getSchema(tableName);
            this._validatorCache.set(tableName, this.ajv.compile(schema))
        }
        return this._validatorCache.get(tableName)!
    }

    async getSchema(tableName: string) {
        return this._schemaCache.get(tableName) ?? (await this.get(SCHEMA, tableName) as _Schema).content
    }

    async setSchema(tableName:string, schema: Record<string, any>) {
        const key = path(SCHEMA, tableName);
        return (this.get(key) as Promise<_Schema>)
            .then(
                async ({_id, _rev, content}: _Schema) => {
                    if (!isEqual(schema, content)) {
                        await this.db.put(
                            {
                                _id,
                                _rev,
                                content:schema
                            }
                        );
                        this._schemaCache.set(tableName, schema);
                        await this.validateAll(tableName);
                    }
                }
            )
            .catch(
                async (reason) => {
                    if (reason.message === "missing") {
                        await this.db.put(
                            {
                                _id:key,
                                content:schema
                            }
                        );
                        this._schemaCache.set(tableName, schema);
                        await this.validateAll(tableName);
                    } else {
                        console.error(tableName, reason)
                    }
                })
        
    }


    async close() {
        await this.db.close();
    }
    async destroy() {
        await this.db.destroy();
    }

    _validate(
        {_id, content}:_Record,
        validate: ValidateFunction
    ) {
        const vkey = path(VALIDATE, _id)
        if (validate(content)) {
            return {
                _id: vkey,
                valid: true,
                errors: [],
            }
        } else {
            return {
                _id: vkey,
                valid: false,
                errors: validate.errors ?? [],
            }
        }
    }

    async validateAll(tableName: string) {
        const validate = await this.getValidator(tableName)
        const docs = await this.db.allDocs(
            {
                include_docs: true,
                attachments: true,
                startkey: path(DATA, tableName),
            }
        )
        const validationResults: PouchDB.Core.PutDocument<ValidationContext>[] = []
        for (const row of docs.rows) {
            
            validationResults.push(
                this._validate(
                    row.doc! as _Record, 
                    validate
                )
            )
        }
        await this.db.bulkDocs(validationResults)
    }

    
    async validate(recordKey:string) {
        const {tableName} = deconstructKey(recordKey)
        const doc = await this.getRecord(recordKey)
        const validate = await this.getValidator(tableName)
        const ret = this._validate(doc, validate)
        await this.db.put(ret)
        return ret.errors
    }

    async addRecord(doc: Record<string, any>, tableName: string) {
        const id = path(DATA, tableName, crypto.randomUUID());
        const response = await this.db.put({content:doc, _id:id});
        const errors = await this.validate(id);
        return {response, errors}
    }

    async checkRecord(recordKey: string) {
        return await this.get(path(VALIDATE, recordKey)) as _Validation;

    }

    async getRecord(recordKey: string) {
        return await this.get(recordKey) as _Record;
    }
}