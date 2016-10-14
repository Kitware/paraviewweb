import 'normalize.css';
import 'babel-polyfill';

import sizeHelper   from '../../../../Common/Misc/SizeHelper';

import ParallelCoordinates from '../../../Native/ParallelCoordinates';
import FieldSelector from '../../../Native/FieldSelector';

import CompositeClosureHelper from '../../../../../src/Common/Core/CompositeClosureHelper';
import FieldProvider from '../../../../../src/InfoViz/Core/FieldProvider';
import Histogram1DProvider from '../../../../../src/InfoViz/Core/Histogram1DProvider';
import Histogram2DProvider from '../../../../../src/InfoViz/Core/Histogram2DProvider';
import LegendProvider from '../../../../../src/InfoViz/Core/LegendProvider';
// import MutualInformationProvider from '../../../../../src/InfoViz/Core/MutualInformationProvider';
import HistogramBinHoverProvider from '../../../../../src/InfoViz/Core/HistogramBinHoverProvider';

import dataModel from './state.json';

const bodyElt = document.querySelector('body');

const parallelCoordinatesContainer = document.createElement('div');
parallelCoordinatesContainer.style.position = 'relative';
parallelCoordinatesContainer.style.width = '60%';
parallelCoordinatesContainer.style.height = '250px';
parallelCoordinatesContainer.style.float = 'left';
bodyElt.appendChild(parallelCoordinatesContainer);

const fieldSelectorContainer = document.createElement('div');
fieldSelectorContainer.style.position = 'relative';
fieldSelectorContainer.style.width = '40%';
fieldSelectorContainer.style.height = '250px';
fieldSelectorContainer.style.float = 'left';
bodyElt.appendChild(fieldSelectorContainer);

const provider = CompositeClosureHelper.newInstance((publicAPI, model, initialValues = {}) => {
  Object.assign(model, initialValues);
  FieldProvider.extend(publicAPI, model, initialValues);
  Histogram1DProvider.extend(publicAPI, model, initialValues);
  Histogram2DProvider.extend(publicAPI, model, initialValues);
  HistogramBinHoverProvider.extend(publicAPI, model);
  LegendProvider.extend(publicAPI, model, initialValues);
  // MutualInformationProvider.extend(publicAPI, model, initialValues);
})(dataModel);

// set provider behaviors
provider.setFieldsSorted(true);
provider.getFieldNames().forEach(name => {
  provider.addLegendEntry(name);
});
provider.assignLegend(['colors', 'shapes']);

// Create parallel coordinates
const parallelCoordinates = ParallelCoordinates.newInstance({ provider, container: parallelCoordinatesContainer });

// Create field selector
const fieldSelector = FieldSelector.newInstance({ provider, container: fieldSelectorContainer });

// Listen to window resize
sizeHelper.onSizeChange(() => {
  parallelCoordinates.resize();
  fieldSelector.resize();
});
sizeHelper.startListening();

sizeHelper.triggerChange();
