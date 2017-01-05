import vtk, sys, os, json
from vtk import vtkDoubleArray, vtkIntArray, vtkVariantArray, vtkTable, vtkIdList
import argparse
from vtk.util.numpy_support import vtk_to_numpy

import numpy as np

parser = argparse.ArgumentParser(description="Sample data generator")
parser.add_argument("--input", default=None, help="input csv")
parser.add_argument("--output", default=None, help="output json")
parser.add_argument("--base", default=None, help="base json")
args = parser.parse_args()
print(args.input, args.output)

csvReader = vtk.vtkDelimitedTextReader()
csvReader.SetFileName(args.input or 'nba.csv')
csvReader.SetHaveHeaders(True)
csvReader.SetDetectNumericColumns(True)
csvReader.SetForceDouble(True)

csvReader.Update()
inputTable = csvReader.GetOutput()
print ("Num cols", inputTable.GetNumberOfColumns())
nameList = []
for i in range(inputTable.GetNumberOfColumns()):
	arr = inputTable.GetColumn(i)
	if (arr.IsNumeric()):
	    nameList.append(inputTable.GetColumnName(i))
	else:
		print("rejected", inputTable.GetColumnName(i))

print ("Numeric", nameList)

filepath = './state.json'
with open(args.base or filepath, 'r') as fd:
	data = json.load(fd)

for key in data['fields']:
	arr = inputTable.GetColumnByName(key)
	narr = vtk_to_numpy(arr)
	# narr.sort()
	data['fields'][key]['mean'] = np.mean(narr)
	quantiles = np.percentile(narr, [2, 25, 50, 75, 98]).tolist()
	# print(key, quantiles)
	# we also might want to search for IQR whisker values
	# last data inside 1.5 * IQR
	iqr = quantiles[3] - quantiles[1]
	multIqr = 1.5 * iqr
	quantiles[0] = quantiles[1]
	quantiles[4] = quantiles[3]
	for a in narr.tolist():
		if (a < quantiles[0] and a >= (quantiles[1] - multIqr)):
			quantiles[0] = a
		elif (a > quantiles[4] and a <= (quantiles[3] + multIqr)):
			quantiles[4] = a
	data['fields'][key]['quantiles'] = quantiles
	print(key, quantiles)

with open(args.output or './state2.json', 'w') as fd:
	json.dump(data, fd, indent=2)