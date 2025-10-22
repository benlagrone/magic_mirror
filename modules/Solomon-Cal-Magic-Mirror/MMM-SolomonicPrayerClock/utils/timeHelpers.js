function ordinal(number) {
  const suffixes = ["th", "st", "nd", "rd"];
  const value = number % 100;
  return number + (suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0]);
}

function hourLabel(index) {
  return `${ordinal(index)} Hour`;
}

function isWithin(date, start, end) {
  const time = date.getTime();
  return time >= start.getTime() && time < end.getTime();
}

module.exports = {
  ordinal,
  hourLabel,
  isWithin
};
