window.onload = () =>{
    const queryField = document.getElementById('queryField');
    const querySubmit = document.getElementById('querySubmit');
    const docId = document.getElementById('docId');
    const sender = document.getElementById('sender');
    const content = document.getElementById('content');
    const sentDate = document.getElementById('sentDate');
    const refreshBtn = document.getElementById('refresh');
    const indexList     = document.getElementById('indices');
    const selectedIndex = document.getElementById('selectedIndex');

    let selectedIndexValue = ""

    async function refreshIndexList(e){
        e.preventDefault();
        indexList.replaceChildren()
        await fetch("http://127.0.0.1:5000/indices",  {
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
                    selectedIndexValue = newNumberListItem.id
                    selectedIndex.innerHTML = selectedIndexValue})
                indexList.appendChild(newNumberListItem)
            }
        })
        .catch(err => console.error(err));
    }

    async function sendQuery(e){
        e.preventDefault();

        if(!selectedIndexValue){
            console.log("no index selected")
        }

        await fetch("http://127.0.0.1:5000/search", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                indexName: selectedIndexValue,   
                content: queryField.value
            })
        })
        .then(res => res.json())
        .then(data => {
            docId.innerHTML = data.hits.hits[0]._source.id
            sender.innerHTML = data.hits.hits[0]._source.sender
            content.innerHTML = data.hits.hits[0]._source.content
            sentDate.innerHTML = data.hits.hits[0]._source.date
        })
        .catch(err => console.log(err));
    }

    refreshBtn.addEventListener("click", refreshIndexList);
    querySubmit.addEventListener("click", sendQuery)


}