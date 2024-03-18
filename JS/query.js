window.onload = () =>{
    const queryField    = d3.select('#queryField');
    const querySubmit   = d3.select('#querySubmit');
    const docId         = d3.select('#docId');
    const sender        = d3.select('#sender');
    const content       = d3.select('#content');
    const sentDate      = d3.select('#sentDate');
    const refreshBtn    = d3.select('#refresh');
    const analyseBtn    = d3.select('#analyseBtn');
    const indexList     = d3.select('#indices');
    const selectedIndex = d3.select('#selectedIndex');

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
        // const formattedData = d3.pie().value((d) => d.total)(data);
        // const arcGenerator = d3.arc().innerRadius(0).outerRadius(radius);
        // const color = d3.scaleOrdinal().range(d3.schemeSet2);

        // svg.selectAll()
        //     .data(formattedData)
        //     .join('path')
        //         .attr('d', arcGenerator)
        //         .attr('fill', d => color(d.value))
        //         .style('opacity', 0.7);

        // svg.selectAll()
        //     .data(formattedData)
        //     .join('text')
        //         .text(d => d.data.sender)
        //         .attr('transform', d => `translate(${arcGenerator.centroid(d)})`)
        //         .style('text-anchor', 'middle');
        
        // let path = svg.selectAll('path')
        //     .data(pie(totals))
        //     .enter()
        //     .append('path')
        //     .attr('d', arc)
        //     .attr('fill', function (d, i) {
        //      return color(d.data.sender);
        //     })
        //     .attr('transform', 'translate(0, 0)')
        //     //Our new hover effects
        //     .on('mouseover', function (d, i) {
        //         d3.select(this).transition()
        //             .duration('50')
        //             .attr('opacity', '.85');})
        //     .on('mouseout', function (d, i) {
        //         d3.select(this).transition()
        //             .duration('50')
        //             .attr('opacity', '1');})
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

        await fetch("http://127.0.0.1:5000/search", {
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

    function wordCloud(selector) {

        let fill = d3.scale.category20();
      
        //Construct the word cloud's SVG element
        let svg = d3.select(selector).append("svg")
            .attr("width", 500)
            .attr("height", 500)
            .append("g")
            .attr("transform", "translate(250,250)");
      
      
        //Draw the word cloud
        function draw(words) {
            let cloud = svg.selectAll("g text")
                            .data(words, function(d) { return d.text; })
      
            //Entering words
            cloud.enter()
                .append("text")
                .style("font-family", "Impact")
                .style("fill", function(d, i) { return fill(i); })
                .attr("text-anchor", "middle")
                .attr('font-size', 1)
                .text(function(d) { return d.text; });
      
            //Entering and existing words
            cloud
                .transition()
                    .duration(600)
                    .style("font-size", function(d) { return d.size + "px"; })
                    .attr("transform", function(d) {
                        return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                    })
                    .style("fill-opacity", 1);
      
            //Exiting words
            cloud.exit()
                .transition()
                    .duration(200)
                    .style('fill-opacity', 1e-6)
                    .attr('font-size', 1)
                    .remove();
        }
      
      
        //Use the module pattern to encapsulate the visualisation code. We'll
        // expose only the parts that need to be public.
        return {
      
            //Recompute the word cloud for a new set of words. This method will
            // asycnhronously call draw when the layout has been computed.
            //The outside world will need to call this function, so make it part
            // of the wordCloud return value.
            update: function(words) {
                d3.layout.cloud().size([500, 500])
                    .words(words)
                    .padding(5)
                    .rotate(function() { return ~~(Math.random() * 2) * 90; })
                    .font("Impact")
                    .fontSize(function(d) { return d.size; })
                    .on("end", draw)
                    .start();
            }
        }
      
      }
      
      function getWords(i, client, indexName) {
        const allDocs = getAllDocs(client, indexName);
        words = [];
        
      
        return words[i]
                .replace(/[!\.,:;\?]/g, '')
                .split(' ')
                .map(function(d) {
                    return {text: d, size: 10 + Math.random() * 60};
                })
      }
      
      function showNewWords(vis, i) {
        i = i || 0;
      
        vis.update(getWords(i ++ % words.length))
        setTimeout(function() { showNewWords(vis, i + 1)}, 2000)
      }
      

    refreshBtn.on("click", refreshIndexList);
    analyseBtn.on("click", analyseData);
    querySubmit.on("click", sendQuery);

}