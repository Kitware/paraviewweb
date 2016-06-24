import 'normalize.css';

import HistogramSelector from '../../../Native/HistogramSelector';
import FieldSelector from '../../../Native/FieldSelector';

import CompositeClosureHelper from '../../../../../src/Common/Core/CompositeClosureHelper';
import FieldProvider from '../../../../../src/InfoViz/Core/FieldProvider';
import LegendProvider from '../../../../../src/InfoViz/Core/LegendProvider';
import Histogram1DProvider from '../../../../../src/InfoViz/Core/Histogram1DProvider';

import dataModel from './state.json';

const bodyElt = document.querySelector('body');
const defaultHeight = '500px';

const histogramSelectorContainer = document.createElement('div');
histogramSelectorContainer.style.position = 'relative';
histogramSelectorContainer.style.width = '58%';
histogramSelectorContainer.style.height = defaultHeight;
histogramSelectorContainer.style.float = 'left';
bodyElt.appendChild(histogramSelectorContainer);

const fieldSelectorContainer = document.createElement('div');
fieldSelectorContainer.style.position = 'relative';
fieldSelectorContainer.style.width = '32%';
fieldSelectorContainer.style.height = defaultHeight;
fieldSelectorContainer.style.float = 'left';
fieldSelectorContainer.style.overflow = 'auto';
fieldSelectorContainer.style['font-size'] = '10pt';
bodyElt.appendChild(fieldSelectorContainer);

const provider = CompositeClosureHelper.newInstance((publicAPI, model, initialValues = {}) => {
  Object.assign(model, initialValues);
  FieldProvider.extend(publicAPI, model, initialValues);
  Histogram1DProvider.extend(publicAPI, model, initialValues);
  LegendProvider.extend(publicAPI, model, initialValues);
})(dataModel);

// Create histogram selector
const histogramSelector = HistogramSelector.newInstance({ provider, container: histogramSelectorContainer });
histogramSelector.resize();

// Create field selector
const fieldSelector = FieldSelector.newInstance({ provider, container: fieldSelectorContainer });
fieldSelector.resize();
fieldSelector.render();
