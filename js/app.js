var map;
var service;

var viewModel;

var Place = function(place) {
  var self = this;

  this.id = ko.observable("");
  this.name = ko.observable(place);
  this.location = ko.observable({lat: 0, lng: 0});
  this.wikiExtracts = ko.observable("");
  this.photo = ko.observable("");

  this.visibility = ko.observable(true);

  this.infoWindowContent = ko.computed(function() {
    var content =
    "<div class=\"row\">" +
    "<div class=\"col-sm-3\">" +
    "<img src=\"" + this.photo() + "\" alt=\"" + this.name() + "\" style=\"max-width: 100%\">" +
    "</div>" +
    "<div class=\"col-sm-9\">" +
    this.wikiExtracts() +
    "</div>"
    "</div>";
    return content;
  }, this);

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
      console.log("fail to get extracts from wikipedia.");
      return;
    }

    var pages = result.query.pages;
    for (var pageid in pages) {
      if (pages.hasOwnProperty(pageid)) {
        var extract = pages[pageid].extract;
        if (extract !== undefined) {
          self.wikiExtracts(extract);
          return;
        }
      }
    }
  }).fail(function(error) {
    console.log("fail to get extracts from wikipedia.");
  });
};

var ViewModel = function() {
  var self = this;

  this.places = ko.observableArray([]);
  this.filter = ko.observable("");

  this.placeToMarkerMappings = [];  // place to marker mappings

  this.filter.subscribe(function(newValue) {
    self.updatePlaceVisibilities()
  });

  $.ajax({
    url: "places.json"
  }).done(function(result) {
    var places = result.places;

    places.forEach(function(place) {
      var place = new Place(place);
      self.places.push(place);
      place.id.subscribe(function() {
        self.addMarker(place);
      }.bind(place));
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

  this.updateSinglePlaceInfo = function(place) {
    if (place.id() !== "") {
      // the place info are ready, no need to get it again
      return;
    }

    service.textSearch({query: place.name()}, function(results, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        place.location({lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng()});
        place.photo(results[0].photos[0].getUrl({maxWidth: 300}));

        // the id is a flag to indicate that the data are all fetched, so it has to be set at the end of callback.
        place.id(results[0].place_id);
      } else if (google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
        setTimeout(function() {
          self.updateSinglePlaceInfo(place);
        }, 2000);
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

  this.updateAllPlaceInfo = function() {
    // do nothing if Googl Maps API is not ready
    if (map === undefined) {
      return;
    }

    self.places().forEach(function(place){
      var marker = self.getMarker(place);
      if (marker === undefined) {
        self.updateSinglePlaceInfo(place);
      }
    });
  };

  this.setMarkerHighlighted = function(marker, value) {
    if (marker === undefined) {
      // do nothing on an undefined marker
      return;
    }

    if (value === true) {
      marker.setIcon("http://maps.google.com/mapfiles/ms/icons/yellow-dot.png");
    } else {
      marker.setIcon("http://maps.google.com/mapfiles/ms/icons/red-dot.png");
    }
  };

  this.addMarker = function(place) {
    var id = place.id();
    var title = place.name();
    var position = new google.maps.LatLng(place.location().lat, place.location().lng);  // position should be 0, 0 here.
    var infoWindowContent = place.infoWindowContent();

    var infowindow = new google.maps.InfoWindow({
      content: infoWindowContent
    });
    place.infoWindowContent.subscribe(function(newValue) {
      infowindow.setContent(newValue);
    });

    var marker = new google.maps.Marker({
      id: id,
      title: title,
      position: position,
      animation: google.maps.Animation.DROP,
      icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
    });
    
    marker.addListener('click', function() {
      infowindow.open(map, marker);
      marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(function() {
        marker.setAnimation(null);
      }, 700);
    });

    marker.addListener('mouseover', function() {
      self.setMarkerHighlighted(marker, true);
    });

    marker.addListener('mouseout', function() {
      self.setMarkerHighlighted(marker, false);
    });

    // Display the new marker
    marker.setMap(map);

    self.placeToMarkerMappings.push({place: place, marker: marker});
  };

  this.showInfoWindow = function(place) {
    var marker = self.getMarker(place);
    new google.maps.event.trigger(marker, 'click');
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

  viewModel.updateAllPlaceInfo();
}

function showInfoWindow(place) {
  viewModel.showInfoWindow(place);
}

function highlightMarker(place) {
  var marker = viewModel.getMarker(place);
  viewModel.setMarkerHighlighted(marker, true);
};

function undoHighlightMarker(place) {
  var marker = viewModel.getMarker(place);
  viewModel.setMarkerHighlighted(marker, false);
}
