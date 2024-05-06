const parseQuery = require('./queryParser');
const readCSV = require('./csvReader');

function performInnerJoin(mainData, joinData, joinCondition, fields, mainTable) {
    return mainData.flatMap(mainRow => {
        return joinData
            .filter(joinRow => {
                const mainValue = mainRow[joinCondition.left.split('.')[1]];
                const joinValue = joinRow[joinCondition.right.split('.')[1]];
                return mainValue === joinValue;
            })
            .map(joinRow => {
                return fields.reduce((acc, field) => {
                    const [tableName, fieldName] = field.split('.');
                    acc[field] = tableName === mainTable ? mainRow[fieldName] : joinRow[fieldName];
                    return acc;
                }, {});
            });
    });
}

function performLeftJoin(mainData, joinData, joinCondition, fields, mainTable) {
    return mainData.flatMap(mainRow => {
        const joinRows = joinData.filter(joinRow => {
            const mainValue = mainRow[joinCondition.left.split('.')[1]];
            const joinValue = joinRow[joinCondition.right.split('.')[1]];
            return mainValue === joinValue;
        });
        if (joinRows.length === 0) {
            joinRows.push(null);  // Add a null row if no match is found
        }
        return joinRows.map(joinRow => {
            return fields.reduce((acc, field) => {
                const [tableName, fieldName] = field.split('.');
                acc[field] = tableName === mainTable ? mainRow[fieldName] : joinRow ? joinRow[fieldName] : null;
                return acc;
            }, {});
        });
    });
}

function performRightJoin(mainData, joinData, joinCondition, fields, mainTable) {
    return joinData.flatMap(joinRow => {
        const mainRows = mainData.filter(mainRow => {
            const mainValue = mainRow[joinCondition.left.split('.')[1]];
            const joinValue = joinRow[joinCondition.right.split('.')[1]];
            return mainValue === joinValue;
        });
        if (mainRows.length === 0) {
            mainRows.push(null);  // Add a null row if no match is found
        }
        return mainRows.map(mainRow => {
            return fields.reduce((acc, field) => {
                const [tableName, fieldName] = field.split('.');
                acc[field] = tableName === mainTable ? mainRow ? mainRow[fieldName] : null : joinRow[fieldName];
                return acc;
            }, {});
        });
    });
}

async function executeSELECTQuery(query) {
    const { fields, table, whereClauses, joinTable, joinCondition, joinType } = parseQuery(query);
    let data = await readCSV(`${table}.csv`);

    if (joinTable && joinCondition) {
        const joinData = await readCSV(`${joinTable}.csv`);
        switch (joinType.toUpperCase()) {
            case 'INNER':
                data = performInnerJoin(data, joinData, joinCondition, fields, table);
                break;
            case 'LEFT':
                data = performLeftJoin(data, joinData, joinCondition, fields, table);
                break;
            case 'RIGHT':
                data = performRightJoin(data, joinData, joinCondition, fields, table);
                break;
            default:
                throw new Error(`Unsupported JOIN type: ${joinType}`);
        }
    }

    const filteredData = whereClauses.length > 0
        ? data.filter(row => whereClauses.every(clause => evaluateCondition(row, clause)))
        : data;

    return filteredData.map(row => {
        const selectedRow = {};
        fields.forEach(field => {
            selectedRow[field] = row[field];
        });
        return selectedRow;
    });
}

function evaluateCondition(row, clause) {
    const { field, operator, value } = clause;
    switch (operator) {
        case '=': return row[field] === value;
        case '!=': return row[field] !== value;
        case '>': return row[field] > value;
        case '<': return row[field] < value;
        case '>=': return row[field] >= value;
        case '<=': return row[field] <= value;
        default: return false;
    }
}

module.exports = executeSELECTQuery;