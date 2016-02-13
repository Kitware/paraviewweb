export default {
    "type": ["tonic-query-data-model"],
    "arguments_order": ["field", "theta", "phi", "time"],
    "arguments": {
        "field": {
            "values": ["Temperature", "Pressure", "Velocity"],
            "label": "Field type",
        },
        "theta": {
            "default": 5,
            "ui": "slider",
            "values": [ "15", "30", "45", "60", "75", "90", "105", "120", "135", "150", "165" ],
            "bind": {
                "mouse" : {
                    "drag" : { "modifier": 0, "coordinate": 1, "step": 30 , "orientation": -1},
                },
            },
        },
        "phi": {
            "loop": "modulo",
            "ui": "slider",
            "values": [
                "0", "15", "30", "45", "60", "75", "90", "105", "120", "135", "150", "165",
                "180", "195", "210", "225", "240", "255", "270", "285", "300", "315", "330", "345"],
            "bind": {
                "mouse" : {
                    "drag" : { "modifier": 0, "coordinate": 0, "step": 10, "orientation": -1 },
                },
            },
        },
        "time": {
            "loop": "reverse",
            "ui": "slider",
            "values": [ "0", "10", "20", "30", "40", "50", "60", "70", "80", "90", "100" ],
        },
    },
    "data": [{
        "name": "image",
        "type": "text",
        "pattern": "index.html",
    }],
    "metadata": {
    },
}
