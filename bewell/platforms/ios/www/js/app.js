var map;
var ref;
var data = [];
var newwindow;
var user;
var deviceId;
var api= 'http://b2bdemo-prod.apigee.net/v1/';
series = Math.floor(Math.random() * 6) + 3;
var oAuthTimer;

var mylocation = {latitude:'37.426327',longitude:'-122.141076'};
var doctorsmap;

var user = '' ;

var hospitalIcon = L.icon({
    iconUrl: 'img/clinic_icon.gif',
    iconSize: [38, 38],
    iconAnchor: [22, 22]
    
});
var client ;
var doctorMarkers = [];

$(document).ready(function(){
	console.log('device ready');
	var options = {
        orgName:'healthcare', // Your Apigee.com username for App Services
        appName:'doctor', // Your Apigee App Services app name
        buildCurl:true,
        logging:true
    }
    client = new Apigee.Client(options);
    console.log('usergrid ready');
    //var max = new Apigee.MobileAnalytics(options);
    console.log('max ready');

	document.addEventListener('deviceready', onDeviceReady,false);
    document.addEventListener('push-notification', function(event) {
    	console.log(event);
       console.log('push-notification!:'+JSON.stringify(event.notification.message));
       //navigator.notification.alert(event.notification.message);
       var ques = event.notification.message;
       var to =ques.split(' ')[0];
       $('#label-question').html(ques);
       $('#btn-answer').on('click',function(){
    	  console.log('answered ' + $('#txt-answer').val()); 
    	  var path = api + "people/" + user + "/people/" + to +"/conversations" ;
    	  makeAjax(path, "POST", function(resp){
    		  console.log("answer sent");
    		  $('#dialog-answer').dialog('close');
    		  $.mobile.changePage('#page-recommended');
    		  
    	  }, JSON.stringify( {question:$('#txt-answer').val()}), false);
       });
       
       $.mobile.changePage('#dialog-answer','pop',true,true);
       
   });
    
   $('#btn-claims-process').on ('click', handleClaimProcess);
   
   $('#btn-submit-claim').on ('click', handleUploadClaim);
   
   $('#btn-events').on('click',handleFecthEvents);

   $('#btn-login').on('click',handleLogin);
   
   $('#btn-find-doctor').on('click',handleFindDoctor);
   
	$('#btn-show-doctor-categories').on('click',handleShowDoctorCategories);
	
	$('#page-home').on('pageinit',function(){
		console.log('pageinit');
		setTimeout(handleMapInit,500);
	});
	
	$('#page-events').on('pageshow',function(){
		try{
			$('div[evententry] ul').each(function(){
				console.log('refresh list views');
				$('div[data-role=collapsible]').collapsible();
				$(this).listview();
				$(this).listview('refresh');
			});
		}catch(err){}
	});
	
	$('#page-event-details').on('pageshow',function(){
		try{
			$('#list-event-feed').listview('refresh');
		}catch(err){}
	});
	$('#btn-event-register').on('click',handleEventRegistration);
	
	$('#page-find-doctor').on('pageinit',function(){
		console.log('pageinit');
		setTimeout(handleDoctorsMapInit,500);
	});
	
	$('a[data-specialty]').on('click',handleDoctorSpeciality);
	
	$('#content-doctors').on('swipeleft',function(){
		
	});
	
	$('#content-doctors').on('swiperight',function(){
		$( "#panel-doctor-categories" ).panel( "open");
	});
	
	$('#content-event-details').on('swiperight',function(){
		$('#panel-event-details').panel("open");	
	});
	
	$('#btn-friends').on('click',hanldeFriendsClick);
	
	$('#page-users').on('pageshow',function(){
		try{
			$('#list-friends-feed').listview('refresh');
		}catch(err){}
	});
	var demo;
	demo = {};
	demo.resizeContentArea = function() {
		console.log('resizing');
		var content, contentHeight, footer, header, viewportHeight;
		window.scroll(0, 0);
		header = $(":jqmData(role='header'):visible");
		footer = $(":jqmData(role='footer'):visible");
		content = $(":jqmData(role='content'):visible");
		viewportHeight = $(window).height();
		contentHeight = viewportHeight - header.outerHeight() - footer.outerHeight() -110;
		$("article:jqmData(role='content')").first().height(contentHeight);
		$('#doctors_map').height(contentHeight+110);
		return $("#map").height(contentHeight);

	};
	window.demo = demo;
	$(window).bind('orientationchange pageshow resize', window.demo.resizeContentArea);
	
});		

function handleUploadClaim () {
	$.mobile.loading( 'show', {
		text: 'Registering Claim',textVisible: true,
		theme: 'a',		
	});
	var imagedata = $('#img-claim').attr('src');
	var path = api  + 'users/' + user + '/claims';
	var txt = $('#txt-claims').val();
	var body = {comments:txt,image:imagedata};
	console.log(body);
	makeAjax(path, 'POST', function(res){
		$.mobile.loading('hide');
		$.mobile.changePage('#page-first');
	}, JSON.stringify(body),false);
	
}

function handleClaimProcess () {
	var popover = new CameraPopoverOptions(300, 300, 100, 100, Camera.PopoverArrowDirection.ARROW_ANY);
	 var options = {
	     quality         : 50,
	     destinationType : Camera.DestinationType.DATA_URL,
	     sourceType      : Camera.PictureSourceType.CAMERA,
	     targetWidth: 300,
	     targetHeight: 300,
	     popoverOptions  : popover
	 };
	navigator.camera.getPicture( cameraSuccess, cameraError, options);
	
	function cameraSuccess (imageData){
		$('#img-claim').attr("src","data:image/jpeg;base64," + imageData);
		$.mobile.changePage('#page-claims');
	}
	function cameraError () {
		console.log('capture failed');
	}
}

function handleEventRegistration () {
	var eventid = $(this).attr('eventid');
	var link = api + 'events/'+eventid + '/users/' + user;
	$.mobile.loading( 'show', {
		text: 'Registering',textVisible: true,
		theme: 'a',		
	});
	makeAjax(link, 'POST', function(resp){
		console.log(resp);
		console.log('registration done');
		$.mobile.loading('hide');
	}, null, false);
}

function handleFecthEvents () {
	var link = api + 'events' ;
	

	makeAjax(link, 'GET', function(resp){
		var html='';
		var j;
		console.log(resp);
		for(j=0;j<resp.entities.length;j++){
			var ev = resp.entities[j];

			html+='<div evententry evententryid="'+ ev.uuid + '" data-role="collapsible" data-theme="b" data-content-theme="d"  data-collapsed="false" data-collapsed-icon="arrow-d" data-expanded-icon="arrow-u">' + 
				  '<h1 align="center">' + ev.title + '</h1>' + 
				   "<ul data-role='listview'>"  +
					"<li>" +
						'<img src="' + ev.image +'" style="width:100%;height:150px"/>' + 
						"<a href='#'></a>" +
						
						'<div class="ui-grid-a">' + 
							'<div class="ui-block-a" align="center">Members</div>' + 
							'<div class="ui-block-b" align="center">Registration</div>' + 
							//'<div class="ui-block-c" align="center">Cycling</div>' + 
							'<div class="ui-block-a">' + 
									'<div class="ui-bar ui-bar-e event_block" align="center">' + 
						    		'<h1>' + ev.members + '</h1>' +
									'</div>' + 
							'</div>' +
						    '<div class="ui-block-b">' + 
						    	'<div class="ui-bar ui-bar-e event_block" align="center">' + 
						    		'<h1>' + ev.start_date + '</h1>' + 
						    	'</div>' + 
						    '</div>' + 
//						    '<div class="ui-block-c">' + 
//						    	'<div class="ui-bar ui-bar-e event_block" align="center">' + 
//						    		'<h1>' + ev.city+ '</h1>' + 
//						    	'</div>' + 
//						    '</div>' + 
						'</div>' + 
					'</li>'+
					'</ul>' + 
			'</div>' ;

		}
		$('#content-events').html(html);
		try{
			$('div[evententry] ul').each(function(){
				console.log('refresh list views');
				$('div[data-role=collapsible]').collapsible();
				$(this).listview();
				$(this).listview('refresh');
			});
		}catch(err){}
		$('div[evententry]').on('click',function(){
			var eventid = $(this).attr('evententryid');
			handleEventClicked(eventid);
		});
		$.mobile.loading( 'hide' ) ;
		$.mobile.changePage('#page-events');
	},null,false);
	
}

function handleEventClicked(eventid){
	var link = api + 'events/' + eventid;
	$.mobile.loading( 'show', {
		text: 'Loading Events Details',textVisible: true,
		theme: 'a',		
	});
	makeAjax(link, 'GET', function(eventresp){
		var event = eventresp.entities[0];
		
		var feedlink = api + "events/" + eventid + "/messages";
		makeAjax(feedlink,'GET', function(eventfeed){
			console.log(JSON.stringify(eventfeed));
			var k;
			var feedhtml = '' ;
			for(k=0;k<eventfeed.entities.length;k++){
				var feed = eventfeed.entities[k];
				
				feedhtml+= '<li>' + 
		        			'<img src="'+ feed.actor.image.url+ '">' + 
		        			'<h2>'+ feed.actor.displayName+ '</h2>' + 
		        			'<p>' + feed.content+ '</p>' +
							'</li>' ;
				
			}
			$('#list-event-feed').html(feedhtml);
			try{
				
				$('#list-event-feed').listview('refresh');
			}catch(err){}
			$('#btn-event-register').attr('eventid',event.uuid);
			$('#img-event-details').attr('src',event.image);
			$('#label-event-members').html(event.members);
			$('#label-event-date').html(event.start_date);
			$('#label-event-title').html(event.title);
			$('#label-event-city').html(event.city);
			$('#label-title-content').html(event.title);
			$.mobile.changePage('#page-event-details');
			$.mobile.loading('hide');
			
		}, null,false);
	}, null, false);
}

function hanldeFriendsClick(){
	var link = api + 'users/' + user + "/feed?ql=select%20*%20where%20filter='user'";
	$.mobile.loading( 'show', {
		text: 'Loading feed',textVisible: true,
		theme: 'a',		
	});
	makeAjax(link, 'GET', function(resp){
		var html='';
		var k;
		for(k=0;k<resp.entities.length;k++){
			var feed = resp.entities[k];
			html+= '<li>' + 
					'<img src="'+ feed.actor.image.url+ '">' + 
					'<h2>'+ feed.actor.displayName+ '</h2>' + 
					'<p>' + feed.content+ '</p>' +
					'</li>' ;
		}
		
		$('#list-friends-feed').html(html);
		try{
			$('#list-friends-feed').listview('refresh');
		}catch(err){}
		$.mobile.changePage('#page-users');
		$.mobile.loading('hide');
	}, null, false);
}

function handleShowDoctorCategories(){
	$( "#panel-doctor-categories" ).panel( "open");
}

function handleLogin(){
	user = $('#input-username').val();
	var options = {method:'POST',endpoint:'users/'+user+'/devices/'+client.getDeviceUUID()};
	client.request(options,function(err,res){
		console.log(err);
		console.log(res);
		console.log('device registration done');
	});
	$.mobile.changePage('#page-first');
}

function handleFindDoctor(){
	$.mobile.changePage('#page-find-doctor');
}

function handleDoctorSpeciality(){
	
	var spec = $(this).attr('data-specialty');
	console.log(spec);
	var link =  api +'doctors' + 
						'/medical_providers.json?search_model=physicians&page=1&per_page=25&sort_by=featured&' + 
						'distance=25&specialties='+ spec + '&lat=' + mylocation.latitude+'&lng=' + mylocation.longitude;
	$.mobile.loading( 'show', {
		text: 'Loading doctors',
		theme: 'a',		
	});
	$( "#panel-doctor-categories" ).panel( "close");
	makeAjax(link,"GET", function(resp){
		var j;
		
		for(j=0;j<doctorMarkers.length;j++){
			doctorsmap.removeLayer(doctorMarkers[j]);
		}
		if(resp&&resp.results)
		{
			var bounds=[];
			var pop = L.popup();
			for(j=0;j<resp.results.length;j++){
				var doc = resp.results[j];
				var marker = L.marker([doc.lat, doc.lng],{icon:hospitalIcon});
				bounds.push([doc.lat, doc.lng]);
				marker.addTo(doctorsmap);
				//L.marker([doc.lat, doc.lng]).addTo(doctorsmap);
				console.log('adding markers');
				doctorMarkers.push (marker);
				
				handleDoctorDetail(doc,marker);
				
			}
			doctorsmap.fitBounds(bounds);
		}
		$.mobile.loading( 'hide');
		console.log(resp);
	}, null, false);
}

function handleDoctorDetail (doc,marker){
	marker.on('click',function(e){
		console.log(e);
		$('#label-doctor-name').html(doc.prefix + doc.name);
		$('#img-doctor').attr('src',doc.logo_url);
		$('#label-speciality').html(doc.specialties);
		var k;
		var html='';
		for(k=0;k<doc.specialties.length;k++){
			html=html+doc.specialties[k] + '<br>'
		}
		if( doc.tagline)
			$('#label-tagline').html(doc.tagline);
		else
			$('#label-tagline').html("Network not specified");
		$('#label-distance').html(doc.distance + " miles");
		$('#label-phone').html(doc.phone);
		$('#label-phone').attr('href','tel:'+doc.phone);
		$('#panel-doctor-details').panel('open');		
	});
	
	
}
function handleDoctorsMapInit(){
	console.log('map init');
	var cities = new L.LayerGroup();
    var cmAttr = '',
		cmUrl = 'http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/{styleId}/256/{z}/{x}/{y}.png';

    var minimal   = L.tileLayer(cmUrl, {styleId: 22677});

    doctorsmap = L.map('doctors_map').setView([mylocation.latitude,mylocation.longitude],13);
    L.tileLayer('http://{s}.tile.cloudmade.com/cfe2b575507149a48d406779355be373/997/256/{z}/{x}/{y}.png', {
	    attribution: '',
	    maxZoom: 18
	}).addTo(doctorsmap);

    
    L.marker([mylocation.latitude,mylocation.longitude]).addTo(doctorsmap);
	doctorsmap.fitBounds([
	               [mylocation.latitude,mylocation.longitude],[mylocation.latitude,mylocation.longitude]
	               ]);
	
    
	var popup = L.popup();
	function onMapClick(e) {
		console.log(e);
	    
	}
	doctorsmap.on('click', onMapClick);
	function locationFound(loc){
		console.log(loc.latlng);
		
		
	}
	doctorsmap.on('locationfound',locationFound); 
	doctorsmap.on('locationerror', function(error){
		
		console.log('location error ' + error.message);
	});		
}
function handleMapInit(){
		console.log('map init');
		var cities = new L.LayerGroup();
	   
		map = L.map('map').setView([mylocation.latitude,mylocation.longitude],13);
		
		L.tileLayer('http://{s}.tile.cloudmade.com/cfe2b575507149a48d406779355be373/997/256/{z}/{x}/{y}.png', {
		    attribution: '',
		    maxZoom: 18
		}).addTo(map);

		
		L.marker([mylocation.latitude,mylocation.longitude]).addTo(map);
		map.fitBounds([
		               [mylocation.latitude,mylocation.longitude],[mylocation.latitude,mylocation.longitude]
		               ]);
		
		map.locate({setView:true,watch:true});
		
		function onMapClick(e) {
			console.log(e);
		}
		map.on('click', onMapClick);
		function locationFound(loc){
			console.log(loc.latlng);
		}
		map.on('locationfound',locationFound); 
		map.on('locationerror', function(error){
			console.log('location error ' + error.message);
		});		
}

function onNotificationAPN(event){
		console.log('Event received');
		console.log(event);
		if (event.alert) {
			navigator.notification.alert(event.alert);
		}
		if (event.badge) {
			pushNotification.setApplicationIconBadgeNumber(successHandler, errorHandler, event.badge);
		}
}

function onDeviceReady(){
	
	console.log('device ready');
	console.log('check if camera present');
	console.log(navigator.camera);
	console.log(PushNotification);
	var pushNotification = window.plugins.pushNotification;
	pushNotification.register(tokenHandler, errorHandler ,{"badge":"true","sound":"true","alert":"true","ecb":"onNotificationAPN"});

	function tokenHandler(result) {
		console.log("Device Registration Result =" +  result);

		var options = {notifier:'apple',deviceToken:result};
		client.registerDevice(options,function(res){
			console.log('device registration done');
			console.log(res);
		});
	}
	function errorHandler (err){
		console.log(err);
	}
	
//    var pushNotification = window.pushNotification;
//    var gcmOptions = {
//        gcmSenderId:"332156248130"
//    };
//    pushNotification.registerDevice(gcmOptions, function(device){
//    	console.log("Registered with Google");
//        var options = {
//        		provider:"apigee",
//                orgName:"x-vitae",
//                appName:"vitae",
//                notifier:"google",
//            deviceId:device.deviceId
//        };
//
//        console.log("Device ID is " + device.deviceId);
//        deviceId = device.deviceId;
//        console.log(JSON.stringify(options));
//        
//        
//        pushNotification.registerWithPushProvider(options, function(result){
//        	console.log('device registered');
//        });
//    });
}

function makeAjax (path, method, callback,postdata,needjson){
	var request = new XMLHttpRequest();
	console.log(path);
	request.onreadystatechange=state_change;
	request.open(method, path, true);
	
	if ( ( method=="POST" || method=="PUT" ) && postdata){
		request.setRequestHeader('Content-Type',"application/json");
		console.log("POST Data =" + postdata);
		
		request.send(postdata);
	}else{
		request.send(null);
	}
	    function state_change()
		{
		if (request.readyState==4)
		  {// 4 = "loaded"
			  if (request.status==200)
			    {
			    	try{

			    		var resp = eval("(" + request.responseText + ")")
			    	}catch(err){
			    		console.log(request.responseText);
			    		//console.log(err);
			    		callback({error:true});
			    	}	
			    	callback(resp);
			    }
			    else{
			    	console.log(request.status);
			    	console.log('error '  + request.statusText);
			    	callback({error:true});
			    }

			}
		}
}