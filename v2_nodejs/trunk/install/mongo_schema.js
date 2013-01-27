
/** nodes1 indexes **/
db.getCollection("nodes1").ensureIndex({
  "_id": 1
},[
  
]);

/** nodes1 records **/
db.getCollection("nodes1").insert({
  "_id": ObjectId("4f8a121b48177e9b13000001"),
  "_meta": {
    "child_count": 3,
    "classnames": [
      
    ],
    "links": [
      {
        "id": "4f8a121b48177e9b13000000",
        "parent_node_id": "0",
        "parent_link_id": "0",
        "depth": 1,
        "position": 1,
        "position_path": [
          1
        ],
        "left": "0000000001.000000000000000000000000000000000000000000000000000000000000",
        "right": "0000000002.000000000000000000000000000000000000000000000000000000000000"
      }
    ],
    "selector_id": "",
    "type": "country"
  },
  "name": "England"
});
db.getCollection("nodes1").insert({
  "_id": ObjectId("4f8a1d9b48177ea713000002"),
  "_meta": {
    "child_count": 2,
    "classnames": [
      
    ],
    "links": [
      {
        "id": "4f8a1d9b48177ea713000001",
        "parent_node_id": "4f8a121b48177e9b13000001",
        "parent_link_id": "4f8a121b48177e9b13000000",
        "depth": 2,
        "position": 1,
        "position_path": [
          1,
          1
        ],
        "left": "0000000001.500000000000000000000000000000000000000000000000000000000000",
        "right": "0000000001.666666666666666666666666666666666666666666666666666666666666"
      }
    ],
    "selector_id": "",
    "type": "city"
  },
  "name": "Bristol"
});
db.getCollection("nodes1").insert({
  "_id": ObjectId("4f8a1dae48177ee612000002"),
  "_meta": {
    "type": "area",
    "selector_id": "",
    "classnames": [
      
    ],
    "links": [
      {
        "id": "4f8a1dae48177ee612000001",
        "parent_node_id": "4f8a1d9b48177ea713000002",
        "parent_link_id": "4f8a1d9b48177ea713000001",
        "depth": 3,
        "position": 1,
        "position_path": [
          1,
          1,
          1
        ],
        "left": "0000000001.600000000000000000000000000000000000000000000000000000000000",
        "right": "0000000001.625000000000000000000000000000000000000000000000000000000000"
      }
    ]
  },
  "name": "Clifton"
});
db.getCollection("nodes1").insert({
  "_id": ObjectId("4f8a1db348177ee612000004"),
  "_meta": {
    "type": "area",
    "selector_id": "",
    "classnames": [
      
    ],
    "links": [
      {
        "id": "4f8a1db348177ee612000003",
        "parent_node_id": "4f8a1d9b48177ea713000002",
        "parent_link_id": "4f8a1d9b48177ea713000001",
        "depth": 3,
        "position": 2,
        "position_path": [
          1,
          1,
          2
        ],
        "left": "0000000001.625000000000000000000000000000000000000000000000000000000000",
        "right": "0000000001.636363636363636363636363636363636363636363636363636363636363"
      }
    ]
  },
  "name": "St Pauls"
});
db.getCollection("nodes1").insert({
  "_id": ObjectId("4f8a1dc648177ee612000006"),
  "_meta": {
    "type": "city",
    "selector_id": "",
    "classnames": [
      
    ],
    "links": [
      {
        "id": "4f8a1dc648177ee612000005",
        "parent_node_id": "4f8a121b48177e9b13000001",
        "parent_link_id": "4f8a121b48177e9b13000000",
        "depth": 2,
        "position": 2,
        "position_path": [
          1,
          2
        ],
        "left": "0000000001.666666666666666666666666666666666666666666666666666666666666",
        "right": "0000000001.750000000000000000000000000000000000000000000000000000000000"
      }
    ]
  },
  "name": "London"
});
db.getCollection("nodes1").insert({
  "_id": ObjectId("4f8a22a948177ef813000002"),
  "_meta": {
    "type": "city",
    "selector_id": "",
    "classnames": [
      
    ],
    "links": [
      {
        "id": "4f8a22a948177ef813000001",
        "parent_node_id": "4f8a121b48177e9b13000001",
        "parent_link_id": "4f8a121b48177e9b13000000",
        "depth": 2,
        "position": 3,
        "position_path": [
          1,
          3
        ],
        "left": "0000000001.750000000000000000000000000000000000000000000000000000000000",
        "right": "0000000001.800000000000000000000000000000000000000000000000000000000000"
      }
    ]
  },
  "name": "Liverpool"
});

/** system.indexes records **/
db.getCollection("system.indexes").insert({
  "v": 1,
  "key": {
    "_id": 1
  },
  "ns": "jquarry.nodes1",
  "name": "_id_"
});
