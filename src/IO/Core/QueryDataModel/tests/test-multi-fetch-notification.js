describe("Query Data Model - Fetch/Notification", function() {
    it('test probe data', function(done) {
        testHelper.start();

        expect(ParaViewWeb.IO.Core.QueryDataModel).toBeDefined();

        var dataDescription = {
          "type" : [ "tonic-query-data-model", "slice-prober" ],
          "arguments": {
              "time": {
                 "ui": "slider",
                 "values": [ "0", "1" ],
                 "label": "Time"
             }
          },
          "arguments_order": [ "time" ],
          "data": [
              {
                  "name": "slice_0",
                  "type": "blob",
                  "mimeType": "image/png",
                  "pattern": "{time}/{field}_0.png"
              },{
                  "name": "slice_1",
                  "type": "blob",
                  "mimeType": "image/png",
                  "pattern": "{time}/{field}_1.png"
              },{
                  "name": "slice_2",
                  "type": "blob",
                  "mimeType": "image/png",
                  "pattern": "{time}/{field}_2.png"
              }
          ],
          "metadata": {
              "title": "Ocean simulation data",
              "type": "probe-slice",
              "id": "mpas-probe-data",
              "description": "Some simulation data from MPAS"
          },
          "InSituDataProber": {
            "slices": [ "slice_0", "slice_1", "slice_2" ],
            "fields": [ "temperature", "salinity" ],
            "origin": [ -180, -84, 0],
            "sprite_size" : 10,
            "dimensions": [ 500, 250, 30 ],
            "spacing": [ 0.72, 0.672, 4.0 ],
            "ranges" : {
              "temperature": [-5, 30],
              "salinity": [0, 38]
            }
          }
        },
        queryDataModel = new ParaViewWeb.IO.Core.QueryDataModel(dataDescription, '/data/probe/'),
        fetchCount = 0,
        notificationCount = 0,
        numberOfRequests = 100;

        queryDataModel.onDataChange(function(data, envelope) {
            testHelper(null, data);
        });

        queryDataModel.setValue('field', 'temperature');

        function checkNotification(d) {
            notificationCount++;

            console.log('callback ' + notificationCount);
            // No error
            expect(d.error).toBeNull();
            expect(d.response).not.toBeNull();

            // Finish test
            if(numberOfRequests === notificationCount) {
                console.log('Fetch/Notification: done with success');
                testHelper.done(done);
            }
        }

        var count = numberOfRequests;
        while(count--) {
            fetchCount++;
            console.log('fetch ' + fetchCount);
            queryDataModel.fetchData();
            testHelper.waitAndRun(checkNotification);
        }
    });
});
