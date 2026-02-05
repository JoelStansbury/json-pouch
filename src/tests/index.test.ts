import { JSONSchemaPouch } from '../index';
import MemoryAdapter from 'pouchdb-adapter-memory';
import PouchDB from "pouchdb";

// Activate the memory adapter
PouchDB.plugin(MemoryAdapter);

describe('testing database creation', () => {
  let db: JSONSchemaPouch;

  beforeEach(() => {
    db = new JSONSchemaPouch({
      name:'dbname', 
      pouchOptions:{adapter:"memory"},
    });
  })

  afterEach(async () => {
    await db.destroy()
  })

  test('Setup and teardown should not throw an error', () => {});

  test('Valid data should not raise an error', async () => {
    const schema = {
      type: "object",
      properties: {
        name: {type: "string"}
      }
    }
    await db.setSchema("newTable", schema)
    const response = await db.addRecord({name: "bob"}, "newTable")
    expect(response.errors?.length).toBe(0)
  })

  test('Invalid data should raise an error', async () => {
    const schema = {
      type: "object",
      properties: {
        name: {type: "string"}
      }
    }
    await db.setSchema("newTable", schema)
    const response = await db.addRecord({name: 1}, "newTable")
    expect(response.errors?.length).toBe(1)
  })

  test('Revalidate on configuration', async () => {
    const schema = {
      type: "object",
      properties: {
        name: {type: "string"}
      }
    }
    await db.setSchema("newTable", schema)
    const {response} = await db.addRecord({name: 1}, "newTable")
    const v1 = await db.checkRecord(response.id)
    expect(v1.errors.length).toBe(1)

    schema.properties.name.type = "number"
    await db.setSchema("newTable", schema)
    const v2 = await db.checkRecord(response.id)
    expect(v2.errors.length).toBe(1)

  })

});