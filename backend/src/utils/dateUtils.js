function parseIsoDate(dateText) {
  return new Date(`${dateText}T00:00:00Z`);
}

function startOfTodayUtc() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function formatIsoDate(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysBetweenInclusive(startDateText, endDateText) {
  const start = parseIsoDate(startDateText);
  const end = parseIsoDate(endDateText);
  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / 86400000) + 1;
}

function minusDaysUtc(date, days) {
  return new Date(date.getTime() - days * 86400000);
}

function addDaysUtc(date, days) {
  return new Date(date.getTime() + days * 86400000);
}

module.exports = {
  parseIsoDate,
  startOfTodayUtc,
  formatIsoDate,
  daysBetweenInclusive,
  minusDaysUtc,
  addDaysUtc,
};
