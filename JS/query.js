window.onload = () =>{
    const phonenumber = document.getElementById('phonenumber');
    const phonenumberSubmit = document.getElementById('phonenumberSubmit');
    const docId = document.getElementById('docId');
    const sender = document.getElementById('sender');
    const content = document.getElementById('content');
    const sentDate = document.getElementById('sentDate');

    async function sendQuery(e){
        e.preventDefault();

        await fetch("http://127.0.0.1:5000/search", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({   
                content: phonenumber.value
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

    phonenumberSubmit.addEventListener("click", sendQuery)


}