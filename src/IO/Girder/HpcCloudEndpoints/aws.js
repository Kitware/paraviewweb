/* eslint-disable no-underscore-dangle */
function transformRequest(data) {
  return JSON.stringify(data);
}

const headers = {
  'Content-Type': 'application/json',
};

function getUnauthenticatedPromise(client) {
  if (client.user) {
    return null;
  }

  return new Promise((ok, ko) => ko({
    data: {
      message: 'Must be logged in.',
    },
  }));
}

export default function ({ client, filterQuery, mustContain, busy }) {
  return {
    listAWSProfiles() {
      return getUnauthenticatedPromise(client) || busy(client._.get(`/user/${client.user._id}/aws/profiles`));
    },

    createAWSProfile(awsProfile) {
      return getUnauthenticatedPromise(client) || busy(client._.post(
        `/user/${client.user._id}/aws/profiles`,
        awsProfile, {
          headers, transformRequest,
        }));
    },

    updateAWSProfile(awsProfile) {
      return getUnauthenticatedPromise(client) || busy(client._.patch(
        `/user/${client.user._id}/aws/profiles/${awsProfile._id}`,
        awsProfile, {
          headers, transformRequest,
        }));
    },

    listAWSRunningInstances(id) {
      return getUnauthenticatedPromise(client) || busy(client._.get(`/user/${client.user._id}/aws/profiles/${id}/runninginstances`));
    },

    getAWSMaxInstances(id) {
      return getUnauthenticatedPromise(client) || busy(client._.get(`/user/${client.user._id}/aws/profiles/${id}/maxinstances`));
    },


    deleteAWSProfile(id) {
      return getUnauthenticatedPromise(client) || busy(client._.delete(`/user/${client.user._id}/aws/profiles/${id}`));
    },
  };
}
