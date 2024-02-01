window.onload = () =>{
    const fileInput  = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const dbList     = document.getElementById('databases');
    const refreshBtn = document.getElementById('refresh');
    const selectedDB = document.getElementById('selectedDB');
    const extractBtn = document.getElementById('extractBtn');

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
        dbList.replaceChildren()
        await fetch("http://127.0.0.1:5000/databases",  {
        method: 'GET',
        })
        .then(res => res.json())
        .then(data => {
            for(let i = 0; i < data.length; i++){
                let newNumberListItem = document.createElement("button");
                let numberListValue = document.createTextNode(data[i]);
                newNumberListItem.setAttribute("id", data[i]);
                newNumberListItem.appendChild(numberListValue);
                newNumberListItem.addEventListener("click", () => {
                    selectedDBValue = newNumberListItem.id
                    selectedDB.innerHTML = selectedDBValue})
                dbList.appendChild(newNumberListItem)
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

    uploadBtn.addEventListener("click", uploadFile);
    refreshBtn.addEventListener("click", refreshDBList);
    extractBtn.addEventListener("click", extractDB);
}