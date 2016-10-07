

/*
 * Given a categorical array, return two new arrays, the first containing the
 * unique values, the second containing the counts.
 */
function uniqueValues(categorical) {
  const countMap = {};
  categorical.forEach((val) => {
    if (!(val in countMap)) {
      countMap[val] = 0;
    }
    countMap[val] += 1;
  });
  const uniques = [];
  const counts = [];
  Object.keys(countMap).forEach((uniqueVal) => {
    uniques.push(uniqueVal);
    counts.push(countMap[uniqueVal]);
  });
  return [uniques, counts];
}

/*
 * Given two parallel arrays, one categorical, one numeric, return two new arrays.
 * The first returned array contains the unique values from the categorical input,
 * while the second returned array contains averages from the numeric input
 * over each category.
 */
function averageValues(categorical, numeric) {
  const sumMap = {};
  const [uniques, counts] = uniqueValues(categorical);
  for (let i = 0; i < uniques.length; ++i) {
    sumMap[uniques[i]] = {
      sum: 0,
      count: counts[i],
    };
  }
  for (let j = 0; j < numeric.length; ++j) {
    sumMap[categorical[j]].sum += parseFloat(numeric[j]);
  }
  const u = [];
  const a = [];
  Object.keys(sumMap).forEach((uniqueKey) => {
    u.push(uniqueKey);
    a.push(sumMap[uniqueKey].sum / sumMap[uniqueKey].count);
  });
  return [u, a];
}

export {
  uniqueValues,
  averageValues,
};
