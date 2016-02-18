describe("Query Data Model - API/Query/Validation", function() {
    it('test query generation via the API', function(done) {
        testHelper.start();

        expect(ParaViewWeb.IO.Core.QueryDataModel).toBeDefined();

        var dataDescription = {
            "type": ["tonic-query-data-model"],
            "arguments": {
                "x": {
                    "values": ["0", "1", "2"],
                },
                "y": {
                    "values": ["0", "1", "2"],
                },
            },
            "arguments_order": [ "x", "y" ],
            "data": [
                {
                    "name": "text",
                    "type": "text",
                    "pattern": "{x}_{y}.txt",
                },{
                    "name": "json",
                    "type": "json",
                    "pattern": "{x}_{y}.json",
                },
            ],
        },
        queryDataModel = new ParaViewWeb.IO.Core.QueryDataModel(dataDescription, '/base/data/dummy/'),
        expectedValues = ['X', 'O', 'X', 'O', 'O', 'X', 'X', 'X', 'O'];


        queryDataModel.onDataChange(function(data, envelope) {
            testHelper(data.error, data);
        });

        queryDataModel.fetchData();

        // Data validation
        function validate(callback) {
            expect(callback.error).toBeUndefined();
            expect(callback.response).not.toBeNull();

            var data = callback.response,
                expected = expectedValues.shift();

            expect(data.json.data.value).toEqual(expected);
            expect(data.text.data[0]).toEqual(expected);

            if(queryDataModel.next('x')) {
                queryDataModel.fetchData();
            } else if(queryDataModel.next('y')) {
                queryDataModel.first('x')
                queryDataModel.fetchData();
            } else {
                testHelper.done(done);
            }

            if(expectedValues.length > 0) {
                testHelper.waitAndRun(validate);
            }
        }

        testHelper.waitAndRun(validate);
    });
});
