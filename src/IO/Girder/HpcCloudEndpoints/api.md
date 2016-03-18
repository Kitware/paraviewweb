# HpcCloudEndpoints

A standard Girder instance provide the following set of endpoints.
By adding the one listed here as extension inside a GirderClientBuilder,
you will get the following set of methods:

```js
// Usage example
import CoreEndpoints from 'paraviewweb/src/IO/Girder/CoreEndpoints';
import HpcCloudEndpoints from 'paraviewweb/src/IO/Girder/HpcCloudEndpoints';
import { build } from 'paraviewweb/src/IO/Girder/GirderClientBuilder';

const client = build(location, ...CoreEndpoints, ...HpcCloudEndpoints);
```

## aws

## clusters
### listClusters(params)
### createCluster(cluster)
### getCluster(id)
### updateCluster(cluster)
### deleteCluster(id)
### submitJob(clusterId, jobId)
### getClusterLogs(taskId, offset=0)
### startCluster(id)
### provisionCluster(id, params)
### getClusterStatus(id)
### terminateCluster(id)

## jobs
### getJobs(offset, limit)
### createJob(params)
### getJob(id)
### updateJob(id, params)
### deleteJob(id)
### getJobLog(id, offset)
### getJobOutput(id, path, offset)
### getJobStatus(id)
### terminateJob(id)

## projects
### listProjects()
### createProject(project)
### getProject(id)
### updateProject(project)
### deleteProject(id)
### shareProject(id)
### listSimulations(projectId)
### createSimulation(projectId, simualtion)

## simulations
### getSimulation(id)
### editSimulation(simulation)
### deleteSimulation(id)
### cloneSimulation(id, {name='Cloned simulation'})
### downloadSimulation(id)
### getSimulationStep(id, name)
### updateSimulationStep(id, name, step)

## taskflows
### createTaskflow(taskFlowClass)
### getTaskflow(id, path)
### updateTaskflow(id, params)
### deleteTaskflow(id)
### getTaskflowLog(id, offset=0)
### startTaskflow(id, cluster)
### getTaskflowStatus(id)
### getTaskflowTasks(id)
### createNewTaskForTaskflow(id, params)
### endTaskflow(id)

## tasks
### getTask(id)
### updateTask(id, updates)
### getTaskLog(id)
### getTaskStatus(id)
