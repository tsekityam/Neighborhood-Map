var map;
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 22.3964, lng: 114.1095},  // Set center to Hong Kong
    zoom: 10  // Set Zoom level to city
  });
}

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
  this.lat = ko.observable(coordinate.lat);
  this.lng = ko.observable(coordinate.lng);
  this.coordinate = ko.computed(function() {
    return  this.lat() +
    (this.lat() < 0 ? "° S, " : "° N, ") +
    this.lng() +
    (this.lng() < 0 ? "° W" : "° E");
  }, this);
};

var ViewModel = function() {
  var self = this;

  this.locations = ko.observableArray([]);
  coordinates.forEach(function(coordinate) {
    self.locations().push(new Location(coordinate));
  });
};

ko.applyBindings(new ViewModel());
