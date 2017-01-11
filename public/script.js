//Set up a drawing environment
var m = {t:100,r:100,b:100,l:100},
	w = document.getElementById('plot1').clientWidth - m.l - m.r,
	h = document.getElementById('plot1').clientHeight - m.t - m.b;
var plots = d3.selectAll('.plot')
	.append('svg')
	.attr('width', w + m.l + m.r)
	.attr('height', h + m.t + m.b)
	.append('g')
	.attr('class','canvas')
	.attr('transform','translate('+m.l+','+m.t+')');
var plot1 = plots.filter(function(d,i){ return i===0;});

d3.queue()
	.defer(d3.csv,'./data/hubway_trips_reduced.csv',parseTrips)
	.defer(d3.csv,'./data/hubway_stations.csv',parseStations)
	.await(dataLoaded);

function dataLoaded(err,trips,stations){

	//Exercise 1: Draw a histogram to study trip durations
	//Create a histogram function to transform the trips array
	//Check out the API for:
	//d3.histogram()
	//d3.range()
	var MIN_DURATION = 0, MAX_DURATION = 3600;
	var histogramDuration = d3.histogram()
		.value(function(d,i){return d.duration})
		.domain([MIN_DURATION,MAX_DURATION])
		.thresholds(d3.range(MIN_DURATION,MAX_DURATION,60));

	console.log(histogramDuration(trips));

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
	plot1.append('g').attr('class','axis axis-x').attr('transform','translate(0,'+h+')')
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

	//Exercise 2: Draw a time series to study the overall number of trips over time


	//Exercise 3: Average number of trips by time of the day?
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