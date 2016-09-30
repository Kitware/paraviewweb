import 'normalize.css';
import 'babel-polyfill';

import sizeHelper   from '../../../../Common/Misc/SizeHelper';

import MutualInformationDiagram from '../../../Native/MutualInformationDiagram';
import FieldSelector from '../../../Native/FieldSelector';

import CompositeClosureHelper from '../../../../../src/Common/Core/CompositeClosureHelper';
import FieldProvider from '../../../../../src/InfoViz/Core/FieldProvider';
import Histogram1DProvider from '../../../../../src/InfoViz/Core/Histogram1DProvider';
import Histogram2DProvider from '../../../../../src/InfoViz/Core/Histogram2DProvider';
import LegendProvider from '../../../../../src/InfoViz/Core/LegendProvider';
import MutualInformationProvider from '../../../../../src/InfoViz/Core/MutualInformationProvider';
import HistogramBinHoverProvider from '../../../../../src/InfoViz/Core/HistogramBinHoverProvider';

import dataModel from './state.json';

const bodyElt = document.querySelector('body');

const container = document.createElement('div');
container.style.position = 'relative';
container.style.width = '500px';
container.style.height = '500px';
container.style.float = 'left';
bodyElt.appendChild(container);

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
  MutualInformationProvider.extend(publicAPI, model, initialValues);
})(dataModel);

// Init Mutual information
// provider.setMutualInformationParameterNames([]);
provider.setHistogram2dProvider(provider);
// provider.setMutualInformationParameterNames(provider.getFieldNames());

// Create parallel coordinates
const diag = MutualInformationDiagram.newInstance({ provider, container });

// Create field selector
const fieldSelector = FieldSelector.newInstance({ provider, container: fieldSelectorContainer });

// Listen to window resize
sizeHelper.onSizeChange(() => {
  diag.resize();
  fieldSelector.resize();
});
sizeHelper.startListening();

sizeHelper.triggerChange();
