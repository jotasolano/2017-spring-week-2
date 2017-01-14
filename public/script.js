/*Example 2

Three complete examples showing progressively more advanced use cases for d3.histogram layout
*/

//Set up a drawing environment
var m = {t:85,r:100,b:50,l:100},
	w = document.getElementById('plot1').clientWidth - m.l - m.r,
	h = document.getElementById('plot1').clientHeight - m.t - m.b;
var plots = d3.selectAll('.plot')
	.append('svg')
	.attr('width', w + m.l + m.r)
	.attr('height', h + m.t + m.b)
	.append('g')
	.attr('class','canvas')
	.attr('transform','translate('+m.l+','+m.t+')');
var plot1 = plots.filter(function(d,i){ return i===0;}),
	plot2 = plots.filter(function(d,i){return i===1}).classed('time-series',true);
	plot3 = plots.filter(function(d,i){return i===2}).classed('time-series-radial',true);

d3.queue()
	.defer(d3.csv,'./data/hubway_trips_reduced.csv',parseTrips)
	.defer(d3.csv,'./data/hubway_stations.csv',parseStations)
	.await(dataLoaded);

function dataLoaded(err,trips,stations){

	//Example 1: Histogram of trip durations, a relatively simple application of the histogram layout
	//d3 methods to review

	// d3.histogram
		// histogram.value
		// histogram.domain
		// histogram.thresholds
	// d3.axisBottom, d3.axisLeft
		// axis.tickValues
		// axis.tickFormat
	// d3.range
	// The enter-exit-update pattern

	var MIN_DURATION = 0, MAX_DURATION = 3600; //Note the naming convention: all caps indicate constants
	// Create a histogram function
	// This function will accept an array argument
	// and return a transformed array of "bins"
	var histogramDuration = d3.histogram()
		.value(function(d,i){return d.duration})
		.domain([MIN_DURATION,MAX_DURATION])
		.thresholds(d3.range(MIN_DURATION,MAX_DURATION,60));

	//Represent
	var scaleX = d3.scaleLinear().domain([MIN_DURATION,MAX_DURATION]).range([0,w]),
		scaleY = d3.scaleLinear().domain([0,d3.max(histogramDuration(trips),function(d){return d.length})]).range([h,0]);

	var bins = plot1.classed('histogram',true).selectAll('.bin')
		.data(histogramDuration(trips))
		.enter()
		.append('rect').attr('class','bin')
		.attr('x',function(d){return scaleX(d.x0)})
		.attr('width',function(d){return scaleX(d.x1) - scaleX(d.x0)})
		.attr('y', function(d){return scaleY(d.length)})
		.attr('height',function(d){return h - scaleY(d.length)});
	//x and y axis
	var xAxis = d3.axisBottom()
		.scale(scaleX)
		.tickValues(d3.range(MIN_DURATION,MAX_DURATION+1,60*5))
		.tickFormat(function(tick){return tick/60 + " min"});
	var yAxis = d3.axisLeft();

	plot1.append('g').attr('class','axis axis-x')
		.attr('transform','translate(0,'+h+')')
		.call(xAxis);

	//Draw median and mean durations
	var medianDuration = d3.median(trips,function(d){return d.duration}),
		meanDuration = d3.mean(trips,function(d){return d.duration});
	plot1.append('line').datum(medianDuration)
		.attr('transform',function(d){return 'translate('+scaleX(d)+')'})
		.attr('y0',h-200)
		.attr('y1',h)
		.attr('class','median');
	plot1.append('line').datum(meanDuration)
		.attr('transform',function(d){return 'translate('+scaleX(d)+')'})
		.attr('y0',h-200)
		.attr('y1',h)
		.attr('class','mean');


	//Exercise 2: Trips over time
	//Even though this is not explicitly a histogram, 
	//the histogram layout is handy for "binning" trips at regular time intervals
	//d3 methods to review

	// d3.timeInterval
	// 	interval.range
	// 	interval.every
	// d3.line
	// d3.area
	// selection.datum
	// selection.append
	// selection.insert
	// selection.classed

	var t0 = new Date(2011,0,1), t1 = new Date(2013,11,31),
		tThresholds = d3.timeDay.range(t0,t1,1); //interval.range(start, stop[, step]

	var histogramTime = d3.histogram()
		.domain([t0,t1])
		.value(function(d){return d.startTime})
		.thresholds(tThresholds);

	//Represent
	//Line and area
	scaleX = d3.scaleTime()
		.domain([t0,t1])
		.range([0,w]);
	scaleY.domain([0,d3.max(histogramTime(trips),function(d){return d.length})]);

	var line = d3.line()
		.x(function(d){return scaleX(new Date((d.x1.valueOf()+d.x0.valueOf())/2))})
		.y(function(d){return scaleY(d.length)});

	var area = d3.area()
		.x(function(d){return scaleX(new Date((d.x1.valueOf()+d.x0.valueOf())/2))})
		.y1(function(d){return scaleY(d.length)})
		.y0(h);

	//Note the use of datum
	plot2.append('path').attr('class','area')
		.datum(histogramTime(trips))
		.attr('d',area);
	plot2.append('path').attr('class','line')
		.datum(histogramTime(trips))
		.attr('d',line)

	//Axis
	xAxis.scale(scaleX)
		.tickValues(null)
		.tickFormat(null)
		.ticks(d3.timeMonth.every(3));
	yAxis
		.tickSize(-w)
		.tickValues(d3.range(0,600,100))
		.scale(scaleY);

	plot2.append('g').attr('transform','translate(0,'+h+')')
		.call(xAxis);
	plot2.insert('g','.line').attr('class','axis axis-y') //line is "inserted" before area
		.call(yAxis);

	//Exercise 3: Average number of trips by time of the day?

/*	This more advanced example demonstrates a few interesting points:
	1. by creatively "binning" values using histogram.value, we can produce
	a layout of the trips data binned by time of the day, but not by month or year
	2. Data layout does not dictate visual expression. 
	3. By "folding" a linear chart with cartesian x-y coordinates, we produce a radial chart
*/	

	//d3.radialArea
		// radialArea.angle
		// radialArea.innerRadius
		// radialArea.outerRadius
		// radialArea.lineOuterRadius
	//The "rotate" property of svg-transform

	//Note here how we are binning the values
	var histogramHour = d3.histogram()
		.domain([0,24])
		.value(function(d){return d.startTime.getHours() + d.startTime.getMinutes()/60})
		.thresholds(d3.range(0,25,1/12));

	//Represent
	//Need to adjust width and height of the plot area so we have more height to work with
	h = document.getElementById('plot3').clientHeight - m.t - m.b;
	d3.select('#plot3').select('svg')
		.attr('height',h+m.t+m.b);

	var R_MAX = h/2;
	scaleY.domain([0,d3.max(histogramHour(trips), function(d){return d.length})]).range([60,R_MAX]);
	scaleX.domain([0,12]).range([0,Math.PI*2]);

	var radialArea = d3.radialArea()
		.angle(function(d){return scaleX(d.x0)})
		.innerRadius(60)
		.outerRadius(function(d){return scaleY(d.length)})
		.curve(d3.curveBasis);

	var radialPlot = plot3.append('g').attr('class','plot-radial')
		.attr('transform','translate('+w/2+','+h/2+')');
	//AM trips
	radialPlot
		.append('path').attr('class','area am')
		.datum(histogramHour(trips).filter(function(bin){return bin.x0<=12}))
		.attr('d',radialArea);
	radialPlot
		.append('path').attr('class','line am-line')
		.datum(histogramHour(trips).filter(function(bin){return bin.x0<=12}))
		.attr('d',radialArea.lineOuterRadius())
	//PM trips
	radialPlot
		.append('path').attr('class','area pm')
		.datum(histogramHour(trips).filter(function(bin){return bin.x0>=12}))
		.attr('d',radialArea);
	radialPlot
		.append('path').attr('class','line pm-line')
		.datum(histogramHour(trips).filter(function(bin){return bin.x0>=12}))
		.attr('d',radialArea.lineOuterRadius());

	//Radial axis
	//"y-axis" corresponds to the radius
	var radialPlotAxes = plot3.insert('g','.plot-radial').attr('class','axis-radial')
		.attr('transform','translate('+w/2+','+h/2+')');
	radialPlotAxes
		.selectAll('.tick-y')
		.data(d3.range(0,2500,500))
		.enter()
		.append('circle').attr('class','tick-y')
		.classed('major', function(d){
			if(d%1000===0) return true;
		})
		.attr('r',function(d){return scaleY(d)});
	//"x-axis" corresponds to the angle
	radialPlotAxes
		.selectAll('.tick-x')
		.data(d3.range(0,24,1))
		.enter()
		.append('g')
		.attr('class',function(d){
			return 'tick-x ' + (d>=12?'pm':'am');
		})
		.attr('transform',function(d){
			var angle = scaleX(d)*180/Math.PI-90;
			return 'rotate('+angle+')'
		})
		.append('line')
		.attr('x1',h/2)
		.attr('x2',function(d){
			return d>=12?(h/2+10):(h/2-10);
		})
		.select(function(){
			return this.parentNode;
		})
		.append('text')
		.attr('text-anchor',function(d){
			return d>=12?'start':'end'
		})
		.attr('x',h/2)
		.attr('dx',function(d){return d>=12?20:-20})
		.attr('dy',4)
		.text(function(d){
			return d+':00'
		})


}

function parseTrips(d){
	return {
		bike_nr:d.bike_nr,
		duration:+d.duration,
		startStn:d.strt_statn,
		startTime:parseTime(d.start_date),
		endStn:d.end_statn,
		endTime:parseTime(d.end_date),
		userType:d.subsc_type,
		userGender:d.gender?d.gender:undefined,
		userBirthdate:d.birth_date?+d.birth_date:undefined
	}
}

function parseStations(d){
	return {
		id:d.id,
		lngLat:[+d.lng,+d.lat],
		city:d.municipal,
		name:d.station,
		status:d.status,
		terminal:d.terminal
	}
}

function parseTime(timeStr){
	var time = timeStr.split(' ')[1].split(':'),
		hour = +time[0],
		min = +time[1],
		sec = +time[2];

	var	date = timeStr.split(' ')[0].split('/'),
		year = date[2],
		month = date[0],
		day = date[1];

	return new Date(year,month-1,day,hour,min,sec);
}