window.onload = () =>{
    const queryOption   = document.querySelector('#queryOption');
    const queryField    = d3.select('#queryField');
    const querySubmit   = d3.select('#querySubmit');
    const queryResult   = d3.select('#queryResult');
    const nxtBtn        = d3.select('#nxtBtn');
    const prvBtn        = d3.select('#prvBtn');
    const docId         = d3.select('#docId');
    const sender        = d3.select('#sender');
    const content       = d3.select('#content');
    const sentDate      = d3.select('#sentDate');
    const refreshBtn    = d3.select('#refresh');
    const analyseBtn    = d3.select('#analyseBtn');
    const selectedIndex = d3.select('#selectedIndex');
    const timeBtn       = d3.select('#timeBtn');

    let selectedIndexValue = ""
    // Dimensions
    let dimensions = {
        width: 800,
        height: 800,
        margin: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        }
      }

    dimensions.ctrWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right
    dimensions.ctrHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom
    const radius = dimensions.ctrWidth / 2

    const svg = d3.select('#chart')
        .append("svg")
        .attr("width", dimensions.width)
        .attr("height", dimensions.height)
        .style('overflow', 'visible');

    const ctr = svg.append("g") // <g>
    .attr(
      "transform",
      `translate(${dimensions.margin.left}, ${dimensions.margin.top})`
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
            let i = 0;
            if(data.hits.total.value == 0){docId.text("No results")}
            else{
                nxtBtn.on("click", () =>{
                    console.log(i)
                    i+=1;
                    if(i > data.hits.hits.length - 1){i = 0}
                    setQueryResult(i, data)
                });
                prvBtn.on("click", () =>{
                    console.log(i)
                    i-=1;
                    if(i < 0){i = data.hits.hits.length - 1}
                    setQueryResult(i, data)
                    });
                setQueryResult(i, data)
            }
        })
        .catch(err => console.log(err));
    }

    function setQueryResult(index, data){
        docId   .text(data.hits.hits[index]._source.id);
        sender  .text(data.hits.hits[index]._source.sender);
        content .text(data.hits.hits[index]._source.content);
        sentDate.text(data.hits.hits[index]._source.date);
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
                timestamps.push(new Date(item._source.date))
                    }

        })
        .catch(err => console.log(err));
        
        const svg = d3.select("#chart")
            .append('svg')
            .attr('width', dimensions.width)
            .attr('height', dimensions.height);
        const ctr = svg.append('g')
            .attr(
              'transform',
              `translate(${dimensions.margin.left}, ${dimensions.margin.top})`
            )

        const domain = d3.extent(timestamps);
        const xScale = d3.scaleTime()
            .domain(domain)
            .range([0, 555])
            .nice();

        ctr.selectAll("circle")
            .data(timestamps)
            .join('circle')
            .attr("cx", (d) => xScale(d))
            .attr("cy", 35)
            .attr("r", 5)
            .attr("fill", "black");
        
        const xAxis = d3.axisBottom(xScale)
            .ticks(timestamps.length);

        ctr.append("text")
            .attr("transform", "translate(300,95)")
           .style("text-anchor", "middle")
           .attr("fill", "black")
           .text("Dates");
        
        ctr.append("g")
            .attr("transform", "translate(0,60)")
            .call(xAxis.ticks(d3.timeDay));
    }
 
    refreshBtn.on("click", refreshIndexList);
    analyseBtn.on("click", analyseData);
    querySubmit.on("click", sendQuery);
    timeBtn.on("click", doTimeline);
   
    
}