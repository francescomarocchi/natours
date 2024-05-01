const apiKey = '603f6271f6654f0690cee22508e8d093';
const transportUrl = `https://tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=${apiKey}`;
const defaultUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

const locations = JSON.parse(document.querySelector('#map').dataset.locations);

var map = L.map('map', {
  zoomControl: false,
  scrollWheelZoom: false,
}).setView([34.111745, -118.113491], 8);
L.tileLayer(transportUrl, {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

const markerIcon = L.icon({
  iconUrl: '/img/pin.png',

  iconSize: [16, 24], // size of the icon
  iconAnchor: [8, 12], // point of the icon which will correspond to marker's location
});

var bounds = new L.LatLngBounds(locations.map((l) => l.coordinates.reverse()));

locations.forEach((element) => {
  console.log(element);
  L.marker(element.coordinates, { icon: markerIcon })
    .addTo(map)
    .bindPopup(`Day ${element.day}: ${element.description}`, {
      autoClose: false,
    })
    .openPopup();
});

map.fitBounds(bounds.pad(0.2));
