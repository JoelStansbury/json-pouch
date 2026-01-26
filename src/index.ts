import PouchDB from "pouchdb";


export interface JSPOptions {
    name?: string
    pouchOptions?: PouchDB.Configuration.DatabaseConfiguration
}
export class JSONSchemaPouch {
    private db: PouchDB.Database;
    constructor({name, pouchOptions}: JSPOptions) {
        this.db = new PouchDB(name, pouchOptions)
    }

    async close() {
        await this.db.close();
    }
}