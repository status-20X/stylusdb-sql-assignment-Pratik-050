const parseQuery = require('./queryParser');
const readCSV = require('./csvReader');

async function executeSELECTQuery(query) {
    const { fields, table, whereClause } = parseQuery(query);
    let data = await readCSV(`${table}.csv`);

    if (whereClause) {
        const [field, operator, value] = whereClause.split(' ');

        data = data.filter(row => {
            switch (operator) {
                case '=':
                    return row[field] === value;
                case '<>':
                    return row[field] !== value;
                // Add more cases for other operators as needed
                default:
                    throw new Error(`Invalid operator "${operator}"`);
            }
        });
    }

    // Filter the fields based on the query
    return data.map(row => {
        const filteredRow = {};
        fields.forEach(field => {
            if (!row.hasOwnProperty(field)) {
                throw new Error(`Field "${field}" does not exist in the data`);
            }
            filteredRow[field] = row[field];
        });
        return filteredRow;
    });
}

module.exports = executeSELECTQuery;