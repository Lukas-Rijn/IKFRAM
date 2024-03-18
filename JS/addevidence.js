window.onload = () =>{
    const fileInput  = document.getElementById('fileInput');;
    const uploadBtn  = d3.select('#uploadBtn');
    const dbList     = d3.select('#databases');
    const refreshBtn = d3.select('#refresh');
    const selectedDB = d3.select('#selectedDB');
    const extractBtn = d3.select('#extractBtn');

    let selectedDBValue = ""

    async function uploadFile(e){
        e.preventDefault();

        console.log(fileInput.files[0])

        const fd = new FormData();
        fd.append('db', fileInput.files[0]);
        
        await fetch("http://127.0.0.1:5000/upload",  {
            method: 'POST',
            processData: false,
            body: fd
          })
            .then(res => res.json())
            .then(json => console.log(json))
            .catch(err => console.error(err));
        }

    async function refreshDBList(e){
        e.preventDefault();
        dbList.html("");
        await fetch("http://127.0.0.1:5000/databases",  {
        method: 'GET',
        })
        .then(res => res.json())
        .then(data => {
            for(let i = 0; i < data.length; i++){
                let newNumberList = d3.select("#databases");
                newNumberList.insert("button")
                    .attr("type","button")
                    .attr("id", data[i])
                    .text(data[i])
                    .on("click", () => {
                        const buttonText = data[i];
                        selectedDB.text(buttonText);
                        selectedDBValue = buttonText;
                     });
                    }
        })
        .catch(err => console.error(err));
    }

    async function extractDB(e){
        e.preventDefault();

        if(!selectedDBValue){
            console.log("No file selected")
        }else{
            await fetch("http://127.0.0.1:5000/extract",  {
                method: 'POST',
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({   
                    dbName: selectedDBValue
                })
            })
                .then(res => res.json())
                .then(json => console.log(json))
                .catch(err => console.error(err));
        }
    }

    uploadBtn.on("click", uploadFile);
    refreshBtn.on("click", refreshDBList);
    extractBtn.on("click", extractDB);
}