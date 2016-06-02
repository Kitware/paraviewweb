import 'normalize.css';

import ParallelCoordinates from '../../../Native/ParallelCoordinates';
import FieldSelector from '../../../Native/FieldSelector';

import CompositeClosureHelper from '../../../../../src/Common/Core/CompositeClosureHelper';
import FieldProvider from '../../../../../src/InfoViz/Core/FieldProvider';
import Histogram1DProvider from '../../../../../src/InfoViz/Core/Histogram1DProvider';
import Histogram2DProvider from '../../../../../src/InfoViz/Core/Histogram2DProvider';
import LegendProvider from '../../../../../src/InfoViz/Core/LegendProvider';
import MutualInformationProvider from '../../../../../src/InfoViz/Core/MutualInformationProvider';

import dataModel from './state.json';

const bodyElt = document.querySelector('body');

const parallelCoordinatesContainer = document.createElement('div');
parallelCoordinatesContainer.style.position = 'relative';
parallelCoordinatesContainer.style.width = '45%';
parallelCoordinatesContainer.style.height = '250px';
parallelCoordinatesContainer.style.float = 'left';
bodyElt.appendChild(parallelCoordinatesContainer);

const fieldSelectorContainer = document.createElement('div');
fieldSelectorContainer.style.position = 'relative';
fieldSelectorContainer.style.width = '45%';
fieldSelectorContainer.style.height = '250px';
fieldSelectorContainer.style.float = 'left';
bodyElt.appendChild(fieldSelectorContainer);

const provider = CompositeClosureHelper.newInstance((publicAPI, model, initialValues = {}) => {
  Object.assign(model, initialValues);
  FieldProvider.extend(publicAPI, model, initialValues);
  Histogram1DProvider.extend(publicAPI, model, initialValues);
  Histogram2DProvider.extend(publicAPI, model, initialValues);
  LegendProvider.extend(publicAPI, model, initialValues);
  MutualInformationProvider.extend(publicAPI, model, initialValues);
})(dataModel);

// Create parallel coordinates
const parallelCoordinates = ParallelCoordinates.newInstance({ provider, container: parallelCoordinatesContainer });
parallelCoordinates.resize();
parallelCoordinates.render();

// Create field selector
const fieldSelector = FieldSelector.newInstance({ provider, container: fieldSelectorContainer });
fieldSelector.resize();
fieldSelector.render();
