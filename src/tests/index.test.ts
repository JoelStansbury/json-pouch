import { JSONSchemaPouch } from '../index';

describe('testing database creation', () => {
  test('should not throw error', async () => {
    const db = new JSONSchemaPouch({name:'dbname'});
    await db.close();
  });
});