
import { averageValues, uniqueValues } from '../../../IO/Core/CSVReader/Processing';

const operations = {
  Count: uniqueValues,
  Average: averageValues,
};

export default function PieChart(chartState, csvReader, arraysInfo) {
  const arrayNames = Object.keys(arraysInfo);
  if (!chartState.labels) {
    chartState.labels = arrayNames[0];
  }

  if (!chartState.values) {
    chartState.values = arrayNames[(arrayNames.length >= 2 ? 1 : 0)];
  }

  if (!chartState.operation) {
    chartState.operation = 'Average';
  }

  const opMethod = operations[chartState.operation];

  const [labels, values] = opMethod(csvReader.getColumn(chartState.labels), csvReader.getColumn(chartState.values));
  return [
    {
      labels,
      values,
      type: 'pie',
    },
  ];
}
