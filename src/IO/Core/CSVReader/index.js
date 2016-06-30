
function parseCsv(csvText) {
  const lines = csvText.split('\n');
  const columnNames = lines[0].split(',');
  const columns = [];

  for (let colIdx = 0; colIdx < columnNames.length; ++colIdx) {
    columnNames[colIdx] = columnNames[colIdx].replace(/[\s"]/g, ' ').trim();
    columns.push([]);
  }

  for (let rowIdx = 1; rowIdx < lines.length; ++rowIdx) {
    const cells = lines[rowIdx].split(',');
    for (let colIdx = 0; colIdx < cells.length; ++colIdx) {
      columns[colIdx].push(cells[colIdx].replace(/[\s"]/g, ' ').trim());
    }
  }

  return {
    numRows: lines.length - 1,
    numCols: columnNames.length,
    colNames: columnNames,
    columns,
  };
}

export default class CSVReader {
  constructor(csvContent) {
    this.setData(csvContent);
  }

  setData(csvContent) {
    this.data = parseCsv(csvContent);
  }

  getNumberOfColumns() {
    return this.data.numCols;
  }

  getNumberOfRows() {
    return this.data.numRows;
  }

  getColumnNames() {
    return this.data.colNames;
  }

  getColumnByIndex(colIdx) {
    if (colIdx >= 0 && colIdx < this.getNumberOfColumns()) {
      return this.data.columns[colIdx];
    }
    throw new Error(`${colIdx} is outside the column range for this dataset.`);
  }

  getColumn(colName) {
    const colIdx = this.data.colNames.indexOf(colName);
    if (colIdx < 0) {
      throw new Error(`${colName}: No such column found.`);
    }
    return this.getColumnByIndex(colIdx);
  }

  getRow(rowIdx) {
    const row = [];

    for (let i = 0; i < this.getNumberOfColumns(); ++i) {
      row.push(this.getColumnByIndex(i)[rowIdx]);
    }

    return row;
  }
}
