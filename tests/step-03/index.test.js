const parseQuery = require('../../src/queryParser');

test('Parse SQL Query - Error', () => {
    const query = 'SELECT * FROM';
    expect(() => {
        parseQuery(query);
    }).toThrow();
});