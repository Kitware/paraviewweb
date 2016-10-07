import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';

// ----------------------------------------------------------------------------
// Partition Provider
// ----------------------------------------------------------------------------

function partitionProvider(publicAPI, model, fetchHelper) {
  // Private members
  const ready = publicAPI.firePartitionReady;
  delete publicAPI.firePartitionReady;

  // Protected members
  if (!model.partitionData) {
    model.partitionData = {};
  }

  // Return true if data is available
  publicAPI.loadPartition = (field) => {
    if (!model.partitionData[field]) {
      model.partitionData[field] = { pending: true };
      fetchHelper.addRequest(field);
      return false;
    }

    if (model.partitionData[field].pending) {
      return false;
    }

    if (model.partitionData[field].stale) {
      // stale means the client sent some data to the server,
      // and we need the server to return 'ground truth', even
      // though we have our version of the data right now.
      delete model.partitionData[field].stale;
      fetchHelper.addRequest(field);
      return true;
    }

    return true;
  };

  publicAPI.getPartition = field => model.partitionData[field];
  // server sent us some data
  publicAPI.setPartition = (field, data) => {
    model.partitionData[field] = data;
    ready(field, data);
  };
  // client generated new data
  publicAPI.changePartition = (field, data) => {
    model.partitionData[field] = data;
    model.partitionData[field].stale = true;
    publicAPI.firePartitionChange(field, data);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // partitionData: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.isA(publicAPI, model, 'PartitionProvider');
  // Change asynchronous default - immediate event tiggers data send to server, and server reply is async.
  CompositeClosureHelper.event(publicAPI, model, 'partitionChange', false);
  CompositeClosureHelper.event(publicAPI, model, 'partitionReady');
  const fetchHelper = CompositeClosureHelper.fetch(publicAPI, model, 'Partition');

  partitionProvider(publicAPI, model, fetchHelper);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
