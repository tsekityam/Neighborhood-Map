var map;
var geocoder;
var viewModel;

// Neighbourhood are saved as coordinates
var coordinates = [
  {
    // Hong Kong Disneyland
    lat: 22.3130,
    lng: 114.0413
  },
  {
    // Ocean Park Hong Kong
    lat: 22.2467,
    lng: 114.1757
  },
  {
    // Victoria Peak
    lat: 22.2759,
    lng: 114.1455
  },
  {
    // The Big Buddha
    lat: 22.2540,
    lng: 113.9050
  },
  {
    // Lion Rock
    lat: 22.3523,
    lng: 114.1870
  }
];

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
  this.markers = [];
  coordinates.forEach(function(coordinate) {
    self.locations().push(new Location(coordinate));
  });

  this.updateDisplayName = function() {
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

  this.showMarker = function() {
    // The following group uses the location array to create an array of markers on initialize.
    self.locations().forEach(function(location) {
      var position = {lat: location.lat(), lng: location.lng()};
      var title = location.displayName();
      var id = self.locations().indexOf(location);

      var marker = new google.maps.Marker({
        position: position,
        title: title,
        animation: google.maps.Animation.DROP,
        id: id
      });

      location.displayName.subscribe(function(newValue) {
        marker.title = newValue;
      });

      self.markers.push(marker);
    });

    var bounds = new google.maps.LatLngBounds();
    // Extend the boundaries of the map for each marker and display the marker
    for (var i = 0; i < self.markers.length; i++) {
      self.markers[i].setMap(map);
      bounds.extend(self.markers[i].position);
    }
    map.fitBounds(bounds);
  };
};

viewModel = new ViewModel();
ko.applyBindings(viewModel);

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 22.3964, lng: 114.1095},  // Set center to Hong Kong
    zoom: 10  // Set Zoom level to city
  });

  geocoder = new google.maps.Geocoder;
  viewModel.updateDisplayName();
  viewModel.showMarker();
}
