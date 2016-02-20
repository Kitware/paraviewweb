# CoreEndpoints

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

## assetstore
### listAssetStores(query={})
### createAssetStore(assetstore)
### updateAssetStore(assetstore)
### deleteAssetStore(id)

## collection
### listCollections(query={})
### createCollection(collection)
### deleteCollection(id)
### getCollection(id)
### editCollection(collection={})
### getCollectionAccess(id)
### editCollectionAccess(collection) {

## file
### uploadFileToItem(params, file)
### getUploadOffset(id)
### downloadFile(id)
### updateFileContent(id, size)
### deleteFile(id)
### editFile(file)
### newFile(file)

## folder
### listFolders(query={})
### createFolder(folder)
### editFolderMetaData(id, metadata)
### deleteFolder(id)
### getFolder(id)
### editFolder(folder)
### downloadFolder(id)
### getFolderAccess(id)
### editFolderAccess(folder)

## group
### updateGroupModerator(groupId, userId, onOff)
### updateGroupAdmin(groupdId, userId, onOff)
### createGroup(group)
### deleteGroup(id)
### getGroup(id)
### editGroup(group={})
### listGroupInvitations(id, query={})
### addGroupInvitation(id, options={})
### listGroupMembers(id, query={})
### removeUserFromGroup(id, userId)
### joinGroup(id)
### getGroupAccess(id)

## item
### downloadItem(id)
### updateItemMetadata(id, metadata={})
### listItems(query={})
### createItem(folderId, name, description='')
### listFiles(id, query)
### getItemRootPath(id)
### getItem(id)
### deleteItem(id)
### editItem(item)
### copyItem(id, destinationItem)

## resource
### downloadResources(resourceList, withMetadata=false)
### searchResources(query,types)
### deleteResources(resourceList)

## system
### deleteSetting(key)
### getSettings(settings)
### setSettings(keyValueMap)
### getServerVersion()
### listUnfinishedUpload(query={})
### removeUnfinishedUpload(query={})
### listPlugins()
### setActivePlugins(plugins)

## user
### listUsers(query)
### createUser(user)
### changePassword(old, newPassword)
### resetPassword(email)
### deleteUser(id)
### getUser(id)
### updateUser(user) 
