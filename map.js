function init(){
    //처음 지도 그리기
    var syear = 2012
    var smonth = 1
    var date_range = []
    for(var i=0;i<106;i++){
        var year = (parseInt(i / 12) + syear);
        var month = (parseInt(i % 12) + smonth);
        if ( month < 10){
            month = '0'+month;
        }
        var date = year + '년 ' +  month + '월'
        date_range.push(date)
    }

    // 황토색
    var minColor = '#FBEEE8',
        maxColor = '#B76200' ;   

    //color 생성
    var color = d3.scale.linear()   
    .domain([0,20])
    .range([minColor, maxColor])
    // svg 생성
    var svg = d3.select("svg"),
    width = +svg.attr('width')
    height = +svg.attr('height')
    // 투영법
    var projection = d3.geo.mercator()
    .center([126.9895, 37.5651])
    .scale(77000)
    .translate([width/2 + 10, height/2]);

    var path = d3.geo.path().projection(projection);
    var maptitle = document.getElementById("maptitle")
    // var v = document.getElementById("combo").value;
    // maptitle.innerText = "서울 아파트 매매가 평균";
    maptitle.innerText = "서울 아파트 매매가 지도";
    
    var seoul = d3.map()
    var div = d3.select ( "body"). append ( "div") 
            .attr ( "class", "rate-label") 
            .style ( "opacity", 0);
    var avg_arr = []
    // 파일 불러오기
    d3.queue()
    .defer(d3.json, "./seoulbound_gu.json")
    .defer(d3.csv, "./homeprice_SGG.csv", function(d){
        var tmp = 0;
        date_range.forEach(function(f){
            tmp += +d[f];
        })
        var avg = parseInt(tmp / 107);
        avg_arr.push(avg)
        seoul.set(d.SGG_NAME, avg);
    })
    .await(ready);

    function ready(error, data){

        var max_num = 0;
        var min_num = 10000000;
        avg_arr.forEach(function(d){
            if (+d > max_num){
                max_num = +d
            }
            if (+d < min_num){
                min_num = +d
            }
        })
        var sep = parseInt((max_num - min_num) / 20);
        var features = topojson.feature(data, data.objects.seoulbound_gu).features;
        features.forEach(function(d) {
            d.properties.rate = seoul.get(d.properties.SIG_KOR_NM);
        });

        svg.selectAll("path")
            .data(features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("fill", function(d, i){
                // r = parseInt((features[i].properties.rate-min_num) / sep);
                r = parseInt((features[i].properties.rate) / 100000);
                return color(r);
            })
            .on("mouseover", function(d, i){
                div.transition()
                    .duration('50')
                    .style("opacity", 1)
                var s = d.properties.SIG_KOR_NM + ": " + d.properties.rate.toString().slice(0,-3) + "(백만원)";
                div.html(s)
                    .style("left", (d3.event.pageX + 10) + "px")
                    .style("top", (d3.event.pageY - 15) + "px");
            })
            .on("mouseout", function(d, i){
                div.transition()
                    .duration('50')
                    .style("opacity", 0)
            })
            .on("click", function(d){
                var gu_name = d.properties.SIG_KOR_NM;
                draw_graph(gu_name)
            })

        svg.selectAll(".place-label")
            .data(features)
            .enter().append("text")
            .attr("class", function(d){
                return "place-label"; 
            })
            .attr("transform", function(d){
                return "translate(" + path.centroid(d) + ")";
            })
            .attr("dy", ".35em")
            .attr("dx", "-2em")
            .text(function(d){
                var s = d.properties.SIG_KOR_NM;
                if (!s) return; 
                return s;
            })
            .style("color", "white")
    }
}

function draw_graph(gu_name){
    d3.selectAll('#gu-chart').remove();
    var margin = {top: 150, right: 30, bottom: 70, left: 100},
    width = 1000 - margin.left - margin.right,
    height = 550 - margin.top - margin.bottom;

    // set the ranges
    var x = d3.scale.ordinal().rangeRoundBands([0, width], .2);
    var y1 = d3.scale.linear().domain([0,1800000]).range([height, 0]);
    var y2 = d3.scale.linear().domain([0,100]).range([height, 0]);
    var div = d3.select ( "body"). append ( "div") 
            .attr ( "class", "rate-label")
            .attr ( "id", "chart-rate") 
            .style ( "opacity", 0);
    // define the axis
    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")

    var y1Axis = d3.svg.axis()
        .scale(y1)
        .orient("left")
        .ticks(10);
    
    var y2Axis = d3.svg.axis()
        .scale(y2)
        .orient("right")
        .ticks(10);

    // add the SVG element
    var svg = d3.select("#myChart").append("svg")
        .attr("id", "gu-chart")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", 
            "translate(" + margin.left + "," + margin.top + ")");


    // load the election data
    // var fname = './json/' + gu_name + '.json';
    d3.json('./json/total.json', function(error, data) {
        var data2 = '' 
        data.forEach(function(d) {
            if(d[gu_name]){
                data2 = d[gu_name]
            }
        });
        var v = 0 
        var v2 = 0
        data2.forEach(function(d) {
            d.date = d.date;
            d.value = +d.value;
            // 선거가 없는 월에는 임의로 null값 삽입
            if (d.jinbo){
                d.jinbo = +d.jinbo 
                v = +d.jinbo
            }
            else{
                d.jinbo = null
            }
            if (d.bosu){
                d.bosu = +d.bosu
                v2 = +d.bosu
            }
            else{
                d.bosu = null
            }
        });

        
    // scale the range of the data
    x.domain(data2.map(function(d) { return d.date; }));
    //y.domain([d3.min(data, function(d) { return d.value; }) - 50000, d3.max(data, function(d) { return d.value; })]);
    // y.domain([200000, d3.max(data, function(d) { return d.value; })]);
    var month_count = 0;
    // add axis
    // x축 6개월마다
    // svg.append("g")
    //     .attr("class", "x axis")
    //     .attr("transform", "translate(0," + height + ")")
    //     .call(xAxis)
    //     .selectAll("text") 
    //     .style("opacity", function(d){
    //         if (month_count % 6 == 0){
    //             month_count += 1;
    //             return 1
    //         }
    //         else{
    //             month_count += 1;
    //             return 0
    //         }
    //     })
    //     .style("text-anchor", "end")
    //     .attr("dx", "-.8em")
    //     .attr("dy", "-.55em")
    //     .attr("transform", "rotate(-90)" );

    //x축 1년마다
    var last = ''
    var year_flag = false

    // add axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (height+1) + ")")
        .call(xAxis)
        .selectAll("text")
        // .style("display", "none")
        .style("opacity", function(d){
            year = d.split(' ')[0]
            if (last != year){
                last = year
                if (year_flag == false){
                    year_flag = true
                    return 1
                }
            }
            else{
                year_flag == false
                return 0
            }
        })
        .text(function(d){
            year = d.split(' ')[0]
            return year
        })
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", "-.50em")
        .attr("transform", "rotate(-45)" );

    svg.append("g")
        .attr("class", "y axis")
        .call(y1Axis)
        .append("text")
        .attr("transform", "rotate(0)")
        .attr("x", 200)
        .attr("y", 0)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .style("font-size", "13px")
        //.style("font-weight", "bold")
        .text(gu_name + " 아파트 실거래가 평균");
    
    svg.append("g")
        .attr("class", "y axis")
        .call(y2Axis)
        .attr("transform", 'translate(870,0)')
        .append("text")
        .attr("transform", "rotate(0)")
        .attr("x", -20)
        .attr("y", 0)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .style("font-size", "13px")
        .text(gu_name + " 정당 지지율");


  // Add bar chart
    svg.selectAll("bar")
        .data(data2)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.date); })
        .attr("width", x.rangeBand())
        .attr("y", function(d) { return y1(d.value); })
        .attr("height", function(d) { return height - y1(d.value); })
        .on("mouseover", function(d, i){
            div.transition()
                .duration('50')
                .style("opacity", 1)
            var s = d.date + " 실거래가: " + d.value + "(천원)";
            div.html(s)
                .style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY - 15) + "px");
        })
        .on("mouseout", function(d, i){
            div.transition()
                .duration('50')
                .style("opacity", 0)
        })

    // Add line chart
    var counter = 3;

    // 진보 라인차트 
    jline = d3.svg.line()
    .x(function(d, i){
        if(data2[i].jinbo){
            return x(d.date)
        }
        else{
            return x(data2[counter].date)
        }
        // return x(d.date)
    })
    .y(function(d, i){
        if(d.jinbo){
            counter = i;
            return y2(d.jinbo)
        }
        else{
            return y2(data2[counter].jinbo)
        }
    })
    
    svg.append("path")
    .attr("class", "jinboline")
    .attr("fill", "none")
    .attr("stroke", "#5B8AFD")
    .attr("stroke-miterlimit", 1)
    .attr("stroke-width", 3)
    .attr("d", jline(data2));

    svg.selectAll("circle")
    .data(data2)
    .enter()
    .append("circle")
    .attr("r", 10)
    .attr("cx", function(d) {
    return x(d.date)
    })
    .attr("cy", function(d) {
        if (d.jinbo != null){
            return y2(d.jinbo)
        }
        else{
            return null
        }
    })
    .style("opacity", function(d){
        if (d.jinbo != null){
            return 1
        }
        else{
            return 0
        }
    })
    .style("fill", "#5B8AFD")
    .on("mouseover", function(d, i){
        div.transition()
            .duration('50')
            .style("opacity", 1)
        var s = d.date + d.election + " 진보 지지율 : " + d.jinbo + "%";
        div.html(s)
            .style("left", (d3.event.pageX + 10) + "px")
            .style("top", (d3.event.pageY - 15) + "px");
    })
    .on("mouseout", function(d, i){
        div.transition()
            .duration('50')
            .style("opacity", 0)
    });



    // 보수 라인차트 
    var counter2=3;

    bline = d3.svg.line()
    .x(function(d, i){
        if(data2[i].bosu){
            return x(d.date)
        }
        else{
            return x(data2[counter2].date)
        }
    })
    .y(function(d, i){
        if(d.bosu){
            counter2 = i;
            return y2(d.bosu)
        }
        else{
            return y2(data2[counter2].bosu)
        }
    })
    svg.append("path")
    .attr("class", "bosuline")
    .attr("fill", "none")
    .attr("stroke", "#FF635C")
    .attr("stroke-miterlimit", 1)
    .attr("stroke-width", 3)
    .attr("d", bline(data2));

    svg.selectAll("circle2")
    .data(data2)
    .enter()
    .append("circle")
    .attr("r", 10)
    .attr("cx", function(d) {
    return x(d.date)
    })
    .attr("cy", function(d) {
        if (d.bosu != null){
            return y2(d.bosu)
        }
        else{
            return null
        }
    })
    .style("opacity", function(d){
        if (d.bosu != null){
            return 1
        }
        else{
            return 0
        }
    })
    .style("fill", "#FF635C")
    .on("mouseover", function(d, i){
        div.transition()
            .duration('50')
            .style("opacity", 1)
        var s = d.date + " 보수 지지율 : " + d.bosu + "%";
        div.html(s)
            .style("left", (d3.event.pageX + 10) + "px")
            .style("top", (d3.event.pageY - 15) + "px");
    })
    .on("mouseout", function(d, i){
        div.transition()
            .duration('50')
            .style("opacity", 0)
    });

});
}



