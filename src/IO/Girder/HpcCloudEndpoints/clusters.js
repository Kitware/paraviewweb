/* eslint-disable no-underscore-dangle */
import deepClone from 'mout/src/lang/deepClone';

function transformRequest(data) {
  return JSON.stringify(data);
}

const headers = {
  'Content-Type': 'application/json',
};

export default function ({ client, filterQuery, mustContain, busy }) {
  return {

    // get /clusters
    //     Search for clusters with certain properties
    listClusters(params) {
      if (Object.keys(params).length) {
        return busy(client._.get('/clusters', { params }));
      }
      return busy(client._.get('/clusters'));
    },

    // post /clusters
    //     Create a cluster
    createCluster(cluster) {
      return busy(client._.post('/clusters', cluster, {
        transformRequest, headers,
      }));
    },

    // get /clusters/{id}
    //     Get a cluster
    getCluster(id) {
      return busy(client._.get(`/clusters/${id}`));
    },

    // patch /clusters/{id}
    //     Update the cluster
    updateCluster(cluster) {
      const editableCluster = deepClone(cluster),
        expected = ['name', 'type', 'config', '_id'],
        cfiltered = filterQuery(editableCluster, ...expected.slice(0, 3)),
        {
          missingKeys, promise,
        } = mustContain(cluster, ...expected);

      // Remove read only fields if any
      if (editableCluster.config.ssh && editableCluster.config.ssh.user) {
        delete editableCluster.config.ssh.user;
      }
      if (editableCluster.config.host) {
        delete editableCluster.config.host;
      }

      return missingKeys ? promise :
        busy(client._.patch(`/clusters/${cluster._id}`, cfiltered, {
          transformRequest, headers,
        }));
    },

    // delete /clusters/{id}
    //     Delete a cluster and its configuration
    deleteCluster(id) {
      return busy(client._.delete(`/clusters/${id}`));
    },

    // put /clusters/{id}/job/{jobId}/submit
    //     Submit a job to the cluster
    submitJob(clusterId, jobId) {
      return busy(client._.put(`/clusters/${clusterId}/job/${jobId}/submit`));
    },

    // get /clusters/{id}/log
    //     Get log entries for cluster
    getClusterLogs(taskId, offset = 0) {
      if (offset) {
        return busy(client._.get(`/clusters/${taskId}/log?offset=${offset}`));
      }
      return busy(client._.get(`/clusters/${taskId}/log`));
    },

    // PUT /clusters/{id}/provision Provision a cluster with ansible
    provisionCluster(id, params) {
      return busy(client._.put(`/clusters/${id}/provision`, params));
    },

    // put /clusters/{id}/start
    //     Start a cluster (ec2 only)
    startCluster(id) {
      return busy(client._.put(`/clusters/${id}/start`));
    },

    // get /clusters/{id}/status
    //     Get the clusters current state
    getClusterStatus(id) {
      return busy(client._.get(`/clusters/${id}/status`));
    },

    // put /clusters/{id}/terminate
    //     Terminate a cluster
    terminateCluster(id) {
      return busy(client._.put(`/clusters/${id}/terminate`));
    },
  };
}
