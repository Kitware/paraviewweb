/* global document */
import 'normalize.css';
import 'babel-polyfill';

import sizeHelper   from '../../../../Common/Misc/SizeHelper';

import CompositeClosureHelper from '../../../../../src/Common/Core/CompositeClosureHelper';
import FieldProvider from '../../../../../src/InfoViz/Core/FieldProvider';
import FieldHoverProvider from '../../../../../src/InfoViz/Core/FieldHoverProvider';
import LegendProvider from '../../../../../src/InfoViz/Core/LegendProvider';
import Histogram1DProvider from '../../../../../src/InfoViz/Core/Histogram1DProvider';
import HistogramBinHoverProvider from '../../../../../src/InfoViz/Core/HistogramBinHoverProvider';
import SelectionProvider from '../../../../../src/InfoViz/Core/SelectionProvider';

import FieldSelector from '../../../Native/FieldSelector';

import dataModel from './state.json';

const bodyElt = document.querySelector('body');
// '100vh' is 100% of the current screen height
const defaultHeight = '100vh';

const firstContainer = document.createElement('div');
firstContainer.style.position = 'relative';
firstContainer.style.width = '50%';
firstContainer.style.height = defaultHeight;
firstContainer.style.float = 'left';
bodyElt.appendChild(firstContainer);

const secondContainer = document.createElement('div');
secondContainer.style.position = 'relative';
secondContainer.style.width = '50%';
secondContainer.style.height = defaultHeight;
secondContainer.style.float = 'left';
secondContainer.style['font-size'] = '10pt';
bodyElt.appendChild(secondContainer);

const provider = CompositeClosureHelper.newInstance((publicAPI, model, initialValues = {}) => {
  Object.assign(model, initialValues);
  FieldProvider.extend(publicAPI, model, initialValues);
  FieldHoverProvider.extend(publicAPI, model, initialValues);
  LegendProvider.extend(publicAPI, model, initialValues);
  Histogram1DProvider.extend(publicAPI, model, initialValues);
  HistogramBinHoverProvider.extend(publicAPI, model);
  SelectionProvider.extend(publicAPI, model, initialValues);
})(dataModel);

// set provider behaviors
provider.setFieldsSorted(true);
provider.getFieldNames().forEach((name) => {
  provider.addLegendEntry(name);
});
provider.assignLegend(['colors', 'shapes']);

// Create field selector
const fieldSelector = FieldSelector.newInstance({ provider, container: firstContainer });

// Listen to window resize
sizeHelper.onSizeChange(() => {
  fieldSelector.resize();
});
sizeHelper.startListening();

sizeHelper.triggerChange();
