var map;
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 22.3964, lng: 114.1095},  // Set center to Hong Kong
    zoom: 10  // Set Zoom level to city
  });
}
