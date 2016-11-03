var map;
var geocoder;
var viewModel;

var Location = function(coordinate) {
  var self = this;

  this.lat = ko.observable(coordinate.lat);
  this.lng = ko.observable(coordinate.lng);
  this.coordinate = ko.computed(function() {
    return this.lat() +
    (this.lat() < 0 ? "° S, " : "° N, ") +
    this.lng() +
    (this.lng() < 0 ? "° W" : "° E");
  }, this);
  this.displayName = ko.observable(this.coordinate());
};

var ViewModel = function() {
  var self = this;

  this.locations = ko.observableArray([]);

  this.locationToMarkerMappings = [];  // location to marker mappings
  this.bounds;

  $.ajax({
    url: "locations.json",
    method: 'GET',
  }).done(function(result) {
    var coordinates = result.coordinates;

    coordinates.forEach(function(coordinate) {
      self.locations.push(new Location(coordinate));
    });
  }).fail(function(err) {
    console.log("fail to get locations.");
  });

  this.updateDisplayName = function(location) {
    self.locations().forEach(function(location) {
      var latlng = {lat: location.lat(), lng: location.lng()};
      geocoder.geocode({'location': latlng}, function(results, status) {
        if (status === 'OK') {
          if (results[1]) {
            location.displayName(results[1].formatted_address);
          }
        }
      });
    });
  };

  this.updateMarkers = function() {
    // do nothing if Googl Maps API is not ready
    if (map === undefined) {
      return;
    }

    if (self.bounds === undefined) {
      self.bounds = new google.maps.LatLngBounds();
    }

    self.locations().forEach(function(location){
      var mappingExists = false;
      for (var i = 0; i < self.locationToMarkerMappings.length; i++) {
        var mapping = self.locationToMarkerMappings[i];
        if (mapping.location === location) {
          mappingExists = true;
          break;
        }
      }

      if (!mappingExists) {
        self.addMarker(location);
      } else {
        self.showMarker(mapping.marker);
      }
    });

    self.locationToMarkerMappings.forEach(function(mapping) {
      var locationExists = false;
      for (var i = 0; i < self.locations().length; i++) {
        var location = self.locations()[i];
        if (location === mapping.location) {
          locationExists = true;
          break;
        }
      }

      if (!locationExists) {
        self.hideMarker(mapping.marker);
      }
    });
  };

  this.addMarker = function(location) {
    self.updateDisplayName(location);

    var position = {lat: location.lat(), lng: location.lng()};
    var title = location.displayName();
    var id = self.locationToMarkerMappings.length;

    var marker = new google.maps.Marker({
      position: position,
      title: title,
      animation: google.maps.Animation.DROP,
      id: id
    });

    location.displayName.subscribe(function(newValue) {
      marker.title = newValue;
    });

    self.locationToMarkerMappings.push({location: location, marker: marker});

    // Display the new marker
    marker.setMap(map);

    // Extend the boundaries of the map for the new marker
    self.bounds.extend(marker.position);
    map.fitBounds(self.bounds);
  };

  // show specified marker on the map
  this.showMarker = function(marker) {
    marker.setMap(map);
  }

  // Hide specified marker from the map
  this.hideMarker = function(marker) {
    marker.setMap(null);
  }
};

viewModel = new ViewModel();
ko.applyBindings(viewModel);

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 22.3964, lng: 114.1095},  // Set center to Hong Kong
    zoom: 10  // Set Zoom level to city
  });

  geocoder = new google.maps.Geocoder;

  // add marker of all exist locations
  viewModel.updateMarkers();

  // update markers if there is anything added or removed from location list
  viewModel.locations.subscribe(function(locations) {
    viewModel.updateMarkers();
  });
}
