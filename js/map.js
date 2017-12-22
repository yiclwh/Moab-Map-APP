// TODO: ADD API to auto generate attractions location
var locations = [{
	title: 'Arches National Park',
	location: {
		lat: 38.7331,
		lng: -109.5925
	}
}, {
	title: 'Dead Horse Point State Park',
	location: {
		lat: 38.4748,
		lng: -109.7406
	}
}, {
	title: 'Canyonlands National Park',
	location: {
		lat: 38.3269,
		lng: -109.8783
	}
}, {
	title: 'Island in the Sky Visitor Center',
	location: {
		lat: 38.4598,
		lng: -109.8210
	}
}, {
	title: 'Needles District Visitor Center',
	location: {
		lat: 38.1681,
		lng: -109.7594
	}
}, {
	title: 'Delicate Arch',
	location: {
		lat: 38.7436,
		lng: -109.4993
	}
}];

var ViewModel = function() {
	var self = this;
	self.currentFilter = ko.observable();
	self.filterInput = ko.observable();
	self.markerList = markers;
	self.filterMarkers = ko.computed(function() {
		if (!self.currentFilter()) {
			return self.markerList;
		} else {
			return ko.utils.arrayFilter(self.markerList, function(marker) {
				return marker.title.toLowerCase().
				indexOf(self.currentFilter().toLowerCase()) != -1;
			});
		}
	});

	self.filterMarkers.subscribe(function(newValue) {
		updateMarkers(newValue);
	});

	self.updateFilter = function() {
		self.currentFilter(self.filterInput());
	};

	self.showInfoWindow = function(marker) {
		google.maps.event.trigger(markers[marker.id], 'click');
	};
};

var map;
var markers;

function initMap() {
	// Constructor creates a new map - only center and zoom are required.
	map = new google.maps.Map(document.getElementById('map'), {
		center: {
			lat: 38.5733,
			lng: -109.5498
		},
		zoom: 13
	});
	markers = [];
	var largeInfowindow = new google.maps.InfoWindow();
	for (var i = 0; i < locations.length; i++) {
		// Get the position from the location array.
		var position = locations[i].location;
		var title = locations[i].title;
		// Create a marker per location, and put into markers array.
		var marker = new google.maps.Marker({
			position: position,
			title: title,
			animation: google.maps.Animation.Drop,
			id: i
		});
		// Push the marker to our array of markers.
		markers.push(marker);
		// Create an onclick event to open an infowindow at each marker.
		marker.addListener('click', function() {
			toggleBounce(this);
			populateInfoWindow(this, largeInfowindow);
        });
	}

	var bounds = new google.maps.LatLngBounds();
	// Extend the boundaries of the map for each marker and display the marker
	for (var i = 0; i < markers.length; i++) {
		markers[i].setMap(map);
		bounds.extend(markers[i].position);
	}
	map.fitBounds(bounds);
    ko.applyBindings(new ViewModel());
    
    google.maps.event.addDomListener(window, 'resize', function() {
        var bounds = new google.maps.LatLngBounds();
        for (var i = 0; i < markers.length; i++) {
            bounds.extend(markers[i].position);
        }
        map.fitBounds(bounds);
    });
}

function toggleBounce(marker) {
	for (var i = 0; i < markers.length; i++) {
		if (markers[i].getAnimation() !== null) {
			markers[i].setAnimation(null);
		}
	}
	marker.setAnimation(google.maps.Animation.BOUNCE);
}

function googleMapError() {
	document.body.innerHTML = '';
	alert("Failed loading Google Map, please check your internet connection and try again.");
}

function updateMarkers(filterMarkers) {
	// HIDE existing markers on map before draw filtered markers
	if (markers) hideMarkers();
	var bounds = new google.maps.LatLngBounds();
	// Extend the boundaries of the map for each marker and display the marker
	if (filterMarkers && filterMarkers.length > 0) {
		for (var i = 0; i < filterMarkers.length; i++) {
			markers[filterMarkers[i].id].setVisible(true);
			bounds.extend(filterMarkers[i].position);
		}
		map.fitBounds(bounds);
	} else {
		alert("No result found. Please use another keyword and try.");
		resetCenter();
	}
}

function resetCenter() {
	map.setCenter({
		lat: 38.5733,
		lng: -109.5498
	}, 13);
}

function hideMarkers() {
	for (var i = 0; i < markers.length; i++) {
		markers[i].setVisible(false);
	}
}

function populateInfoWindow(marker, infowindow) {
	// Check to make sure the infowindow is not already opened on this marker.
	if (infowindow.marker != marker) {
		infowindow.marker = null;
		infowindow.marker = marker;
		var apiurl_search = 'https://api.flickr.com/services/rest/?' +
			'method=flickr.photos.search&' +
			'api_key=02efcdbfc1a815447135b15895377114' +
			'&sort=interestingness-desc&lat=' +
			marker.position.lat() + '&lon=' + marker.position.lng();
		var idiv = $('<div class="row-fluid">');
		// TODO: Add img link to be clickable
		$.getJSON(apiurl_search + "&format=json&jsoncallback=?", function(data) {
				$.each(data.photos.photo, function(i, myresult) {
					src = "http://farm" + myresult.farm + ".static.flickr.com/" +
						myresult.server + "/" + myresult.id + "_" +
						myresult.secret + "_m.jpg";
					$("<img class='m-1'/>").attr("src", src).
					appendTo($('<div>', {
						'class': 'thumbnail'
					})).
					appendTo($('<div>', {
						'class': 'col-5'
					})).
					appendTo(idiv);
					if (i == 3) return false;
				});
				infowindow.setContent(idiv[0]);
			})
			.fail(function(jqXHR, error, errorThrown) {
				var messsage = "";
				if (jqXHR.status && jqXHR.status == 400) {
					messsage = jqXHR.responseText;
				} else {
					messsage = "Something went wrong";
				}
				infowindow.setContent('<div class="alert alert-danger"><strong>' +
					messsage + '</strong></div>');
			});

		map.setCenter(marker.location, 13);
		infowindow.open(map, marker);
		// Make sure the marker property is cleared if the infowindow is closed.
		infowindow.addListener('closeclick', function() {
			infowindow.marker = null;
		});
	}
}
