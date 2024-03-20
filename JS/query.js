window.onload = () =>{
    const queryOption   = document.querySelector('#queryOption');
    const queryField    = d3.select('#queryField');
    const querySubmit   = d3.select('#querySubmit');
    const docId         = d3.select('#docId');
    const sender        = d3.select('#sender');
    const content       = d3.select('#content');
    const sentDate      = d3.select('#sentDate');
    const refreshBtn    = d3.select('#refresh');
    const analyseBtn    = d3.select('#analyseBtn');
    const selectedIndex = d3.select('#selectedIndex');
    const timeBtn = d3.select('#timeBtn');

    let selectedIndexValue = ""
    let indexData = []
    // Dimensions
    let dimensions = {
        width: 600,
        height: 600,
        margins: 10,
    };

    dimensions.ctrWidth = dimensions.width - dimensions.margins * 2
    dimensions.ctrHeight = dimensions.height - dimensions.margins * 2
    const radius = dimensions.ctrWidth / 2

    const svg = d3.select('#chart')
        .append("svg")
        .attr("width", dimensions.width)
        .attr("height", dimensions.height)
        .style('overflow', 'visible');
        //.style('margin-top', '400px');
    const ctr = svg.append("g") // <g>
    .attr(
      "transform",
      `translate(${dimensions.margins}, ${dimensions.margins})`
    )

    async function refreshIndexList(e){
        e.preventDefault();

        selectedIndex.text("")
        await fetch("http://127.0.0.1:5000/indices",  {
        method: 'GET',
        })
        .then(res => res.json())
        .then(data => {
            for(let i = 0; i < data.length; i++){
                d3.select("#selectedIndex")
                .append("button")
                .attr("type","button")
                .attr("id", data[i])
                .text(data[i])
                .on("click", () => {
                    selectedIndexValue = data[i];
                    selectedIndex.text(selectedIndexValue);
                });
            }
        })
        .catch(err => console.error(err));
    }

    function createCircleDiagram(dataset){     
        const populationPie = d3.pie()
            .value((d) => d.total)
            .sort(null)
        const slices = populationPie(dataset)

        const arc = d3.arc()
            .outerRadius(radius)
            .innerRadius(0)
        const arcLabels = d3.arc()
            .outerRadius(radius)
            .innerRadius(200)

        const colors = d3.quantize(d3.interpolateSpectral, dataset.length)
        const colorScale = d3.scaleOrdinal()
            .domain(dataset.map(element => element.name))
            .range(colors)

        // Draw Shape
        const arcGroup = ctr.append('g')
            .attr(
            'transform',
            `translate(${dimensions.ctrHeight / 2}, ${dimensions.ctrWidth / 2})`
            )

        const div = d3.select('#chart').append('div')
            .attr("class", "tooltip-donut")
            .style("opacity", 0);
    
        arcGroup.selectAll('path')
            .data(slices)
            .join('path')
            .attr('d', arc)
            .attr('fill', d => colorScale(d.data.sender))
            .on('mouseover', function (d, i) {
                console.log(d.target.__data__.data.total)
                d3.select(this).transition()
                    .duration('50')
                    .attr('opacity', '.85');
                div.transition()
                    .duration(50)
                    .style("opacity", 1);
                div.html(d.target.__data__.data.total)
        })
        .on('mouseout', function (d, i) {
                d3.select(this).transition()
                    .duration('50')
                    .attr('opacity', '1');
                div.transition()
                    .duration('50')
                    .style("opacity", 0);
        });

        const labelsGroup = ctr.append('g')
            .attr(
            'transform',
            `translate(${dimensions.ctrHeight / 2}, ${dimensions.ctrWidth / 2})`
            )
            .classed('labels', true)

        labelsGroup.selectAll('text')
            .data(slices)
            .join('text')
            .attr('transform', d => `translate(${arcLabels.centroid(d)})`)
            .call(
            text => text.append('tspan')
                .style('font-weight', 'bold')
                .attr('y', -4)
                .text(d => d.data.sender)
            )
    }

    async function analyseData(e){
        e.preventDefault();

        if(!selectedIndexValue){
            console.log("no index selected")
        }

        await fetch("http://127.0.0.1:5000/elastic", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                indexName: selectedIndexValue
            })
            })
        .then(res => res.json())
        .then(data => {
            let senders = [];
            secondairyList = [];
            for(item of data.hits.hits){
                if(senders.length == 0){
                    senders.push({
                        "sender": item._source.sender,
                        "total": 1
                    })
                secondairyList.push(item._source.sender)
                }
                else{
                    for(senderItem of senders){
                    if(item._source.sender == senderItem.sender){
                        senderItem.total += 1
                    }
                    else{
                        if(!secondairyList.includes(item._source.sender)){
                            senders.push({
                                "sender": item._source.sender,
                                "total": 1
                            })}
                        secondairyList.push(item._source.sender)
                    }
                }}
            }
            console.log(senders)
            createCircleDiagram(senders)
        })
        .catch(err => console.log(err));
    }

    async function sendQuery(e){
        e.preventDefault();

        if(!selectedIndexValue){
            console.log("no index selected")
        }
        const selectedOption = queryOption.value;

        await fetch(`http://127.0.0.1:5000/${selectedOption}`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                indexName: selectedIndexValue,   
                content: queryField.property('value')
            })
        })
        .then(res => res.json())
        .then(data => {
            docId   .text(data.hits.hits[0]._source.id);
            sender  .text(data.hits.hits[0]._source.sender);
            content .text(data.hits.hits[0]._source.content);
            sentDate.text(data.hits.hits[0]._source.date);
        })
        .catch(err => console.log(err));
    }

    async function doTimeline(){
        const timestamps = [];
        await fetch("http://127.0.0.1:5000/elastic", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                indexName: selectedIndexValue
            })
            })
        .then(res => res.json())
        .then(data => {
            for(item of data.hits.hits){
                timestamps.push(item._source.date)
            }
        })
        .catch(err => console.log(err));
        
        
        
    }

      

      
    
    refreshBtn.on("click", refreshIndexList);
    analyseBtn.on("click", analyseData);
    querySubmit.on("click", sendQuery);
    timeBtn.on("click", doTimeline);
    
}