export default function ({ client, filterQuery, mustContain, busy }) {
  return {

    // POST /taskflows Create the taskflow
    createTaskflow(taskFlowClass) {
      return busy(client._.post('/taskflows', {
        taskFlowClass,
      }));
    },

    // GET /taskflows/{id} Get a taskflow
    getTaskflow(id, path) {
      if (path) {
        return busy(client._.get(`/taskflows/${id}?path=${path}`));
      }
      return busy(client._.get(`/taskflows/${id}`));
    },

    // PATCH /taskflows/{id} Update the taskflow
    updateTaskflow(id, params) {
      return busy(client._.patch(`/taskflows/${id}`, params));
    },

    // DELETE /taskflows/{id} Delete the taskflow
    deleteTaskflow(id) {
      return busy(client._.delete(`/taskflows/${id}`));
    },

    // GET /taskflows/{id}/log Get log entries for taskflow
    getTaskflowLog(id, offset = 0) {
      if (offset !== 0) {
        return busy(client._.put(`/taskflows/${id}/log?offset=${offset}`));
      }
      return busy(client._.put(`/taskflows/${id}/log`));
    },

    // PUT /taskflows/{id}/start Start the taskflow
    startTaskflow(id, cluster) {
      return busy(client._.put(`/taskflows/${id}/start`, cluster));
    },

    // GET /taskflows/{id}/status Get the taskflow status
    getTaskflowStatus(id) {
      return busy(client._.get(`/taskflows/${id}/status`));
    },

    // GET /taskflows/{id}/tasks Get all the tasks associated with this taskflow
    getTaskflowTasks(id) {
      return busy(client._.get(`/taskflows/${id}/tasks`));
    },

    // POST /taskflows/{id}/tasks Create a new task associated with this flow
    createNewTaskForTaskflow(id, params) {
      return busy(client._.post(`/taskflows/${id}/tasks`, params));
    },

    // PUT /taskflows/{id}/terminate Terminate the taskflow
    endTaskflow(id) {
      return busy(client._.put(`/taskflows/${id}/terminate`));
    },
  };
}
