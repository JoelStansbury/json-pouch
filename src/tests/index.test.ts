import { JSONSchemaPouch } from '../index';

describe('testing database creation', () => {
  test('should not throw error', () => {
    const db = new JSONSchemaPouch({name:'dbname', tables:{}});
    db.connect().then(
      () => {
        db.close()
      }
    )
  });
});