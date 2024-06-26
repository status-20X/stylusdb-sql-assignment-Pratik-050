const fs = require('fs');
const csv = require('csv-parser');

function readCSV(filePath) {
    const results = [];

    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                resolve(results);
            })
            .on('error', (error) => {
                if (error.code === 'ENOENT') {
                    reject(new Error(`Table does not exist: ${filePath}`));
                } else {
                    reject(error);
                }
            });
    });
}

module.exports = readCSV;