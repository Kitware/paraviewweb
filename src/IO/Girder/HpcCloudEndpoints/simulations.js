/*
    get /simulations/{id}
        Get a simulation

    patch /simulations/{id}
        Update a simulation

    delete /simulations/{id}
        Delete a simulation

    post /simulations/{id}/clone
        Clone a simulation

    get /simulations/{id}/download
        Download all the asset associated with a simulation

    get /simulations/{id}/steps/{stepName}
        Get a particular step in a simulation

    patch /simulations/{id}/steps/{stepName}
        Update a particular step in a simulation
*/

function transformRequest(data) {
    return JSON.stringify(data);
}

const headers = {
    'Content-Type': 'application/json',
}

export default function({client, filterQuery, mustContain, busy}) {
    return {
        getSimulation(id) {
            return busy(client._.get(`/simulations/${id}`));
        },

        editSimulation(simulation) {
            const expected = ['name', 'description', 'active', 'disabled', '_id'],
                sfiltered = filterQuery(simulation, ...expected.slice(0,4)); // Remove '_id'

            return busy(client._.patch(`/simulations/${simulation._id}`, sfiltered, { headers, transformRequest }));
        },

        deleteSimulation(id) {
            return busy(client._.delete(`/simulations/${id}`));
        },

        cloneSimulation(id, {name='Cloned simulation'}) {
            return busy(client._.post(`/simulations/${id}/clone`), {name}, { headers, transformRequest });
        },

        downloadSimulation(id) {
            return busy(client._.get(`/simulations/${id}/download`));
        },

        getSimulationStep(id, name) {
            return busy(client._.get(`/simulations/${id}/steps/${name}`));
        },

        updateSimulationStep(id, name, step) {
            return busy(client._.patch(`/simulations/${id}/steps/${name}`, step, { headers, transformRequest }));
        },
    };
}
