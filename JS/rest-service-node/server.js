//Imports

const path          = require("path");
const express       = require("express");
const busboy        = require("busboy");
const cors          = require('cors');
const fs            = require("fs");
const bodyParser    = require("body-parser");
const { Client }    = require('@elastic/elasticsearch')
const sqlite3 = require('sqlite3');

//Clients
let fileText = fs.readFileSync("..\\..\\Elastic\\mappings.json");
let mappingFile = JSON.parse(fileText);

const app = express();
const client = new Client({
  node: "http://127.0.0.1:9200"
})


//settings
app.use(bodyParser.json({ limit: "50mb" }));
app.use(cors({origin: "http://127.0.0.1:5500"}));
const dateDoer  = new Date(); 
const startTime = dateDoer.getSeconds()

//Functions
function existsIndex(ind) {
  return client.indices.exists({index: ind})
}

async function createIndex(client, indexName, mappingFile){
  if(existsIndex(indexName)){
    return;
  }else{
    await client.indices.create({
    index: indexName,
    operations: {
      mappingFile
    }
  }, { ignore: [400] })
}
}

function cleanData(bulkData){
  let newData = []
  for(let i = 0; i< bulkData.length; i++){
      doc = {
        "id"        : bulkData[i]._id,
        "sender"    : bulkData[i].address,
        "content"   : bulkData[i].content,
        "date"      : bulkData[i].date
    };
    newData.push(doc);
  }
  return newData;
}

async function indexDocs(client, indexName, bulkData){
  const operations = bulkData.flatMap(doc => [{ index: { _index: indexName } }, doc])
  const bulkResponse = await client.bulk({ refresh: true, operations })
  if (bulkResponse.errors) {
    const erroredDocuments = []
    // The items array has the same order of the dataset we just indexed.
    // The presence of the `error` key indicates that the operation
    // that we did for the document has failed.
    bulkResponse.items.forEach((action, i) => {
      const operation = Object.keys(action)[0]
      if (action[operation].error) {
        erroredDocuments.push({
          // If the status is 429 it means that you can retry the document,
          // otherwise it's very likely a mapping error, and you should
          // fix the document before to try it again.
          status: action[operation].status,
          error: action[operation].error,
          operation: operations[i * 2],
          document: operations[i * 2 + 1]
        })
      }
    })
    console.log(erroredDocuments)
    return bulkResponse;
  }
}

async function getAllDocs(client, indexName){
    return client.search({
        index: indexName,
        query: {
          match_all: {}
        }
      }).then(resp => {return resp})
}

async function getDocOnSender(client, indexName, sender){
    return client.search({
        index: indexName,
        query: {
          match: {
            "sender": sender
          }
        }
      }).then(resp => {return resp})
}

async function getDocOnContent(client, indexName, content){
  return client.search({
      index: indexName,
      query: {
        match: {
          "content": content
        }
      }
    }).then(resp => {return resp})
}

async function db_all(db, query){
  return new Promise(function(resolve,reject){
      db.all(query, function(err,rows){
         if(err){return reject(err);}
         resolve(rows);
       });
       db.close();
  });
}

async function getDatabase(dbName){
  const db = new sqlite3.Database(".\\uploads\\" + dbName, sqlite3.OPEN_READ);
  const sql = "SELECT * FROM messages;";
  return db_all(db, sql)
    .then(jobResult => { return jobResult });
}

async function getIndexNames(client){
  let indexNames = [];
  const indices = await client.cat.indices({format: 'json'});
  for(let i =0; i<indices.length; i++){
    indexNames.push(indices[i].index);
  }
  return indexNames;
}

//App
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..\\..\\HTML\\index.html"));
});

app.get("/favicon.ico", (req, res) => {
  res.sendFile(path.join(__dirname, "..\\..\\HTML\\favicon.ico"));
});

app.get("/elastic", (req, res) => {
    asyncJob = getAllDocs(client)
    asyncJob.then(function(jobResult) {
        res.send(jobResult)
     })   
});

app.get("/databases", (req, res) => {
  res.send(fs.readdirSync("./uploads"));
});

app.get("/indices", (req, res) => {
  asyncJob = getIndexNames(client)
  asyncJob.then((jobResult) => {
    res.send(jobResult)
  })
});

app.post("/elastic", (req, res) => {
    asyncJob = getAllDocs(client, req.body.indexName)
    asyncJob.then(function(jobResult) {
        res.send(jobResult)
     })   
});

app.post("/search", (req, res) => {
    const indexName = req.body.indexName;
    const content = req.body.content;
    asyncJob = getDocOnSender(client, indexName, content);
    asyncJob.then(function(jobResult) {
        res.send(jobResult)
     });
});

app.post("/upload", async (req, res) => {
  let filename = "";
  const bb = busboy({ headers: req.headers });
  bb.on("file", (name, file, info) => {
    filename = info.filename;
    const saveTo = path.join("./uploads", filename);
    file.pipe(fs.createWriteStream(saveTo));
    });
  bb.on("close", () => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(`upload success: ${filename}`);
  });
  req.pipe(bb);
});

app.post("/extract", (req, res) => {
  const dbName = req.body.dbName;
  asyncJob = getDatabase(dbName);
  asyncJob.then(function(jobResult) {
      createIndex(client, dbName+startTime, mappingFile)
      docs = cleanData(jobResult)
      indexDocs(client, dbName+startTime, docs)
     });
});


app.listen(5000, () => {
  console.log(`Server is running on port 5000.`);
});
