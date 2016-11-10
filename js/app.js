var map;
var viewModel;

var Location = function(location) {
  var self = this;

  this.location = ko.observable({lat: 0, lng: 0});
  this.name = ko.observable(location);
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
      titles: self.name()
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
          return;
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
    var locations = result.locations;

    locations.forEach(function(location) {
      self.locations.push(new Location(location));
    });
  }).fail(function(error) {
    console.log("fail to get locations.");
  });

  this.updateLocationVisibilities = function() {
    var filter = self.filter().toLocaleUpperCase();
    self.locations().forEach(function(location) {
      var name = location.name().toLocaleUpperCase();
      location.visibility(name.includes(filter));

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

  this.updatePlaceInfo = function(location) {
    service.textSearch({query: location.name()}, function(results, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        location.id(results[0].place_id);
        location.location({lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng()});
        location.imageSource(results[0].photos[0].getUrl({maxWidth: 300}));
      } else {
        console.log("failed to get info of " + location.name() + " from Google Maps");
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

  // Although this function is called addMarker, however, we will not add marker to the map
  // until Google Maps returns the position of the location.
  this.addMarker = function(location) {
    self.updatePlaceInfo(location);

    var position = new google.maps.LatLng(location.location().lat, location.location().lng);  // position should be 0, 0 here.
    var title = location.name();
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

    location.id.subscribe(function(newValue) {
      marker.id = newValue;
    });
    location.location.subscribe(function(newValue) {
      marker.setPosition(new google.maps.LatLng(location.location().lat, location.location().lng));
      // Display the new marker
      marker.setMap(map);

      // Extend the boundaries of the map for the new marker
      self.bounds.extend(marker.position);
      map.fitBounds(self.bounds);
    }.bind(location));
    location.description.subscribe(function(newValue) {
      infowindow.setContent(self.getInfoWindowContent(this));
    }.bind(location));
    location.imageSource.subscribe(function(newValue) {
      infowindow.setContent(self.getInfoWindowContent(this));
    }.bind(location));

    self.locationToMarkerMappings.push({location: location, marker: marker});
  };

  this.showInfoWindow = function(location) {
    var marker = self.getMarker(location);
    new google.maps.event.trigger(marker, 'click');
  };

  this.getInfoWindowContent = function(location) {
    var contentString =
    "<div class=\"row\">" +
    "<div class=\"col-sm-3\">" +
    "<img src=\"" + location.imageSource() + "\" alt=\"" + location.name() + "\" style=\"max-width: 100%\">" +
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

  service = new google.maps.places.PlacesService(map);

  // add marker of all exist locations
  viewModel.updateMarkers();

  // update markers if there is anything added or removed from location list
  viewModel.locations.subscribe(function(locations) {
    viewModel.updateMarkers();
  });
}

function showInfoWindow(name) {
  viewModel.locations().forEach(function (location) {
    if (location.name() === name) {
      viewModel.showInfoWindow(location);
    }
  });
}
