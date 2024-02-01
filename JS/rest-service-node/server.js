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
const app = express();
const client = new Client({
  node: "http://127.0.0.1:9200"
})

//settings
app.use(bodyParser.json({ limit: "50mb" }));
app.use(cors({origin: "http://127.0.0.1:5500"}));

//Functions
async function getAllDocs(client){
    return client.search({
        index: 'ikfram-1',
        query: {
          match_all: {}
        }
      }).then(resp => {return resp})
}

async function getDocOnSender(client, sender){
    return client.search({
        index: 'ikfram-1',
        query: {
          match: {
            "sender": sender
          }
        }
      }).then(resp => {return resp})
}

async function getDocOnContent(client, content){
  return client.search({
      index: 'ikfram-1',
      query: {
        match: {
          "content": content
        }
      }
    }).then(resp => {return resp})
}

async function getDatabase(dbName){
  const db = new sqlite3.Database(".\\uploads\\" + dbName);
  let sql = "SELECT * FROM messages"
  let data = []
  
  // db.all(sql, [], (err, rows) => {
  //   if (err) {
  //     throw err;
  //   }
  //   rows.forEach((row) => {
  //     data.append(row)
  //   });
  // });

  return db
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

app.get("/elastic", (req, res) => {
    asyncJob = getAllDocs(client)
    asyncJob.then(function(jobResult) {
        res.send(jobResult)
     })   
});

app.post("/search", (req, res) => {
    const content = req.body.content
    asyncJob = getDocOnContent(client, content)
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
  const dbName = req.body.dbName
  asyncJob = getDatabase(dbName)
  asyncJob.then(function(jobResult){
    res.send(jobResult)
  });
});


app.listen(5000, () => {
  console.log(`Server is running on port 5000.`);
});
