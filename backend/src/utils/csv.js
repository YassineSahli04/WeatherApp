function escapeCsvValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);
  const needsQuotes = /[",\n]/.test(stringValue);
  const escaped = stringValue.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

function buildCsv(rows, columns) {
  const header = columns.map((column) => escapeCsvValue(column.header)).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((column) => {
          const value = typeof column.value === "function" ? column.value(row) : row[column.value];
          return escapeCsvValue(value);
        })
        .join(","),
    )
    .join("\n");

  return body ? `${header}\n${body}` : header;
}

module.exports = {
  buildCsv,
};
