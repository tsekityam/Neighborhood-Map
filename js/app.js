var map;
var viewModel;

var Place = function(place) {
  var self = this;

  this.location = ko.observable({lat: 0, lng: 0});
  this.name = ko.observable(place);
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

  this.places = ko.observableArray([]);
  this.filter = ko.observable("");

  this.placeToMarkerMappings = [];  // place to marker mappings
  this.bounds;

  this.filter.subscribe(function(newValue) {
    self.updatePlaceVisibilities()
  });

  $.ajax({
    url: "places.json",
  }).done(function(result) {
    var places = result.places;

    places.forEach(function(place) {
      self.places.push(new Place(place));
    });
  }).fail(function(error) {
    console.log("fail to get places.");
  });

  this.updatePlaceVisibilities = function() {
    var filter = self.filter().toLocaleUpperCase();
    self.places().forEach(function(place) {
      var name = place.name().toLocaleUpperCase();
      place.visibility(name.includes(filter));

      var marker = self.getMarker(place);
      if (marker !== undefined) {
        if (place.visibility() === true) {
          self.showMarker(marker);
        } else {
          self.hideMarker(marker);
        }
      }
    });
  };

  this.updatePlaceInfo = function(place) {
    service.textSearch({query: place.name()}, function(results, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        place.id(results[0].place_id);
        place.location({lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng()});
        place.imageSource(results[0].photos[0].getUrl({maxWidth: 300}));
      } else {
        console.log("failed to get info of " + place.name() + " from Google Maps");
      }
    });
  };

  this.getMarker = function(place) {
    for (var i = 0; i < self.placeToMarkerMappings.length; i++) {
      var mapping = self.placeToMarkerMappings[i];
      if (mapping.place === place) {
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

    self.places().forEach(function(place){
      var marker = self.getMarker(place);
      if (marker === undefined) {
        self.addMarker(place);
      }
    });

    self.placeToMarkerMappings.forEach(function(mapping) {
      var placeExists = false;
      for (var i = 0; i < self.places().length; i++) {
        var place = self.places()[i];
        if (place === mapping.place) {
          placeExists = true;
          break;
        }
      }

      if (!placeExists) {
        self.hideMarker(mapping.marker);
      }
    });
  };

  // Although this function is called addMarker, however, we will not add marker to the map
  // until Google Maps returns the position of the place.
  this.addMarker = function(place) {
    self.updatePlaceInfo(place);

    var position = new google.maps.LatLng(place.location().lat, place.location().lng);  // position should be 0, 0 here.
    var title = place.name();
    var id = place.id();
    var description = place.description();

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

    place.id.subscribe(function(newValue) {
      marker.id = newValue;
    });
    place.location.subscribe(function(newValue) {
      marker.setPosition(new google.maps.LatLng(place.location().lat, place.location().lng));
      // Display the new marker
      marker.setMap(map);

      // Extend the boundaries of the map for the new marker
      self.bounds.extend(marker.position);
      map.fitBounds(self.bounds);
    }.bind(place));
    place.description.subscribe(function(newValue) {
      infowindow.setContent(self.getInfoWindowContent(this));
    }.bind(place));
    place.imageSource.subscribe(function(newValue) {
      infowindow.setContent(self.getInfoWindowContent(this));
    }.bind(place));

    self.placeToMarkerMappings.push({place: place, marker: marker});
  };

  this.showInfoWindow = function(place) {
    var marker = self.getMarker(place);
    new google.maps.event.trigger(marker, 'click');
  };

  this.getInfoWindowContent = function(place) {
    var contentString =
    "<div class=\"row\">" +
    "<div class=\"col-sm-3\">" +
    "<img src=\"" + place.imageSource() + "\" alt=\"" + place.name() + "\" style=\"max-width: 100%\">" +
    "</div>" +
    "<div class=\"col-sm-9\">" +
    place.description() +
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

  // add marker of all exist places
  viewModel.updateMarkers();

  // update markers if there is anything added or removed from place list
  viewModel.places.subscribe(function(places) {
    viewModel.updateMarkers();
  });
}

function showInfoWindow(name) {
  viewModel.places().forEach(function (place) {
    if (place.name() === name) {
      viewModel.showInfoWindow(place);
    }
  });
}
