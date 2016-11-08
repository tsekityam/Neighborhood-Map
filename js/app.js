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
  this.id = ko.observable("");
  this.description = ko.observable("");
  this.imageSource = ko.observable("");
  this.visibility = ko.observable(true);

  $.ajax({
    url: "https://en.wikipedia.org/w/api.php",
    dataType: "jsonp",
    data: {
      action: "query",
      format: "json",
      prop: "extracts",
      exsentences: "3",
      generator: "geosearch",
      ggscoord: self.lat() + "|" + self.lng()
    }
  }).done(function(result) {
    if (result.query === undefined) {
      console.log("fail to get description.");
      return;
    }

    var pages = result.query.pages;
    for (var pageid in pages) {
      if (pages.hasOwnProperty(pageid)) {
        var extract = pages[pageid].extract;
        if (extract !== undefined) {
          self.description(extract);
        }
      }
    }
  }).fail(function(error) {
    console.log("fail to get description.");
  });
};

var ViewModel = function() {
  var self = this;

  this.locations = ko.observableArray([]);
  this.filter = ko.observable("");

  this.locationToMarkerMappings = [];  // location to marker mappings
  this.bounds;

  this.filter.subscribe(function(newValue) {
    self.updateLocationVisibilities()
  });

  $.ajax({
    url: "locations.json",
  }).done(function(result) {
    var coordinates = result.coordinates;

    coordinates.forEach(function(coordinate) {
      self.locations.push(new Location(coordinate));
    });
  }).fail(function(error) {
    console.log("fail to get locations.");
  });

  this.updateLocationVisibilities = function() {
    var filter = self.filter().toLocaleUpperCase();
    self.locations().forEach(function(location) {
      var displayName = location.displayName().toLocaleUpperCase();
      location.visibility(displayName.includes(filter));

      var marker = self.getMarker(location);
      if (marker !== undefined) {
        if (location.visibility() === true) {
          self.showMarker(marker);
        } else {
          self.hideMarker(marker);
        }
      }
    });
  };

  this.locations().forEach(function(location) {
    location.displayName.subscribe(function(newValue) {
      self.updateLocationVisibilities();
    });
  });

  this.updatePlaceInfo = function(location) {
    var latlng = {lat: location.lat(), lng: location.lng()};
    geocoder.geocode({'location': latlng}, function(results, status) {
      if (status === 'OK') {
        if (results[1]) {
          location.displayName(results[1].address_components[0].short_name);
          location.id(results[1].place_id);
          service.getDetails({placeId: location.id()}, function(place, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
              location.imageSource(place.photos[0].getUrl({maxWidth: 300}));
            }
          });
        }
      }
    });
  };

  this.getMarker = function(location) {
    for (var i = 0; i < self.locationToMarkerMappings.length; i++) {
      var mapping = self.locationToMarkerMappings[i];
      if (mapping.location === location) {
        return mapping.marker;
      }
    }

    return undefined;
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
      var marker = self.getMarker(location);
      if (marker === undefined) {
        self.addMarker(location);
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
    self.updatePlaceInfo(location);

    var position = {lat: location.lat(), lng: location.lng()};
    var title = location.displayName();
    var id = location.id();
    var description = location.description();

    var infowindow = new google.maps.InfoWindow({
      content: description
    });

    var marker = new google.maps.Marker({
      position: position,
      title: title,
      animation: google.maps.Animation.DROP,
      id: id
    });
    marker.addListener('click', function() {
      infowindow.open(map, marker);
    });

    location.displayName.subscribe(function(newValue) {
      marker.title = newValue;
    });
    location.id.subscribe(function(newValue) {
      marker.id = newValue;
    });
    location.description.subscribe(function(newValue) {
      infowindow.setContent(self.getInfoWindowContent(this));
    }.bind(location));
    location.imageSource.subscribe(function(newValue) {
      infowindow.setContent(self.getInfoWindowContent(this));
    }.bind(location));

    self.locationToMarkerMappings.push({location: location, marker: marker});

    // Display the new marker
    marker.setMap(map);

    // Extend the boundaries of the map for the new marker
    self.bounds.extend(marker.position);
    map.fitBounds(self.bounds);
  };

  this.showInfoWindow = function(location) {
    var marker = self.getMarker(location);
    new google.maps.event.trigger( marker, 'click' );
  };

  this.getInfoWindowContent = function(location) {
    var contentString =
    "<div class=\"row\">" +
    "<div class=\"col-sm-3\">" +
    "<img src=\"" + location.imageSource() + "\" alt=\"" + location.displayName() + "\" style=\"max-width: 100%\">" +
    "</div>" +
    "<div class=\"col-sm-9\">" +
    location.description() +
    "</div>"
    "</div>";
    return contentString;
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
  service = new google.maps.places.PlacesService(map);

  // add marker of all exist locations
  viewModel.updateMarkers();

  // update markers if there is anything added or removed from location list
  viewModel.locations.subscribe(function(locations) {
    viewModel.updateMarkers();
  });
}

function showInfoWindow(displayName) {
  viewModel.locations().forEach(function (location) {
    if (location.displayName() === displayName) {
      viewModel.showInfoWindow(location);
    }
  });
}
