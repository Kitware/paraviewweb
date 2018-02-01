/* eslint-disable no-underscore-dangle */
export default function({
  client,
  filterQuery,
  mustContain,
  busy,
  encodeQueryAsString,
}) {
  return {
    updateGroupModerator(groupId, userId, onOff) {
      const url = `/group/${groupId}/moderator?userId=${userId}`;
      return onOff ? client._.post(url) : client._.delete(url);
    },

    updateGroupAdmin(groupdId, userId, onOff) {
      const url = `/group/${groupdId}/admin?userId=${userId}`;
      return onOff ? client._.post(url) : client._.delete(url);
    },

    createGroup(group) {
      const expected = ['name', 'description', 'public'];
      const params = filterQuery(group, ...expected);
      const { missingKeys, promise } = mustContain(params, 'name');

      return missingKeys
        ? promise
        : busy(client._.post(`/group${encodeQueryAsString(params)}`));
    },

    deleteGroup(id) {
      return busy(client._.delete(`/group/${id}`));
    },

    getGroup(id) {
      return busy(client._.get(`/group/${id}`));
    },

    editGroup(group = {}) {
      const expected = ['name', 'description', 'public'];
      const params = filterQuery(group, ...expected);
      const { missingKeys, promise } = mustContain(group, '_id');

      return missingKeys
        ? promise
        : busy(
            client._.put(`/group/${group._id}${encodeQueryAsString(params)}`)
          );
    },

    listGroupInvitations(id, query = {}) {
      const allowed = ['limit', 'offset', 'sort', 'sortdir'];
      const params = filterQuery(query, ...allowed);

      return busy(
        client._.get(`/group/${id}/invitation`, {
          params,
        })
      );
    },

    addGroupInvitation(id, options = {}) {
      const allowed = ['userId', 'level', 'quiet'];
      const params = filterQuery(options, ...allowed);
      const { missingKeys, promise } = mustContain(params, 'userId');

      return missingKeys
        ? promise
        : busy(
            client._.post(
              `/group/${id}/invitation${encodeQueryAsString(params)}`
            )
          );
    },

    listGroupMembers(id, query = {}) {
      const allowed = ['limit', 'offset', 'sort', 'sortdir'];
      const params = filterQuery(query, ...allowed);

      return busy(
        client._.get(`/group/${id}/member`, {
          params,
        })
      );
    },

    removeUserFromGroup(id, userId) {
      const params = { userId };
      return busy(
        client._.delete(`/group/${id}/member`, {
          params,
        })
      );
    },

    joinGroup(id) {
      return busy(client._.post(`/group/${id}/member`));
    },

    getGroupAccess(id) {
      return busy(client._.get(`/group/${id}/access`));
    },
  };
}
