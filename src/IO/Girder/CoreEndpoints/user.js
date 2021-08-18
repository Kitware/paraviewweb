/* eslint-disable no-underscore-dangle */
export default function ({
  client,
  filterQuery,
  mustContain,
  busy,
  encodeQueryAsString,
}) {
  return {
    listUsers(query) {
      const params = filterQuery(
        query,
        'text',
        'limit',
        'offset',
        'sort',
        'sortdir'
      );
      return busy(
        client._.get('/user', {
          params,
        })
      );
    },

    createUser(user) {
      const expected = [
        'login',
        'email',
        'firstName',
        'lastName',
        'password',
        'admin',
      ];
      const params = filterQuery(user, ...expected);
      const { missingKeys, promise } = mustContain(user, ...expected);

      return missingKeys
        ? promise
        : busy(client._.post(`/user${encodeQueryAsString(params)}`));
    },

    changePassword(old, newPassword) {
      const params = {
        old,
        new: newPassword,
      };
      return busy(client._.put(`/user/password${encodeQueryAsString(params)}`));
    },

    resetPassword(email) {
      const params = {
        email,
      };
      return busy(
        client._.delete('/user/password', {
          params,
        })
      );
    },

    deleteUser(id) {
      return busy(client._.delete(`/user/${id}`));
    },

    getUser(id) {
      return busy(client._.get(`/user/${id}`));
    },

    updateUser(user) {
      const expected = ['email', 'firstName', 'lastName', '_id'];
      const params = filterQuery(user, ...expected.slice(0, 3)); // Remove '_id'
      const { missingKeys, promise } = mustContain(user, ...expected);

      return missingKeys
        ? promise
        : busy(client._.put(`/user/${user._id}${encodeQueryAsString(params)}`));
    },
  };
}
