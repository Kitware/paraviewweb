export default function({client, filterQuery, mustContain, busy}) {
    return {
        getTask(id){
            return busy(client._.get(`/tasks/${id}`));
        },
        updateTask(id, updates){
            return busy(client._.patch(`/tasks/${id}`, updates));
        },
        getTaskLog(id){
            return busy(client._.get(`/tasks/${id}/log`));
        },
        getTaskStatus(id){
            return busy(client._.get(`/tasks/${id}/status`));
        },
    };
}
