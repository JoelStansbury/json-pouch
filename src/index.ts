import PouchDB from "pouchdb";
import { Callback, Signal } from "./util/signal";


export interface JSPOptions {
    name?: string
    pouchOptions?: PouchDB.Configuration.DatabaseConfiguration
    tables: Record<string, TableDef>;
}

export interface TableDef {
    properties: Record<string, any>;
    required?: Record<string, any>;
    type: "object";
}



export class JSONSchemaPouch {
    private db: PouchDB.Database;
    private ready = new Signal<void>();
    private tables: Record<string, TableDef>;

    onReady(callback:Callback<void>) {
        this.ready.addListener(callback)
    }

    constructor({name, pouchOptions, tables}: JSPOptions) {
        // console.error("hello")
        this.db = new PouchDB(name, pouchOptions);
        this.tables = tables;
    }

    connect() {
        return this.db.get("meta").then(
            (value) => {
                console.error(value)
            }
        ).catch(
            (reason) => {
                if (reason.reason === "missing") {
                    this.db.put({
                        _id:"meta",
                        tables:structuredClone(this.tables),
                    })
                }
            }
        ).finally(
            () => {
                this.ready.emit()
            }
        )
    }

    async close() {
        await this.db.close();
    }

    async put() {

    }
}