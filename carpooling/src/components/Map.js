import React, { useState, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

// Thay thế 'your-access-token' bằng access token của bạn
mapboxgl.accessToken = 'pk.eyJ1IjoieW91c2VmcmFkd2FuMSIsImEiOiJjbHdldWpsN3YwdG00Mm1vOXNuN3Q4aHM3In0.hILsoKM03GQPbI7G4pltHA';

function MapComponent() {
  const [map, setMap] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestedLocations, setSuggestedLocations] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    if (!map) {
        const newMap = new mapboxgl.Map({
          container: 'map',
          style: 'mapbox://styles/mapbox/streets-v11',
          center: [0, 0],
          zoom: 1 
        });
        setMap(newMap);
      }
    }, [map]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude } = position.coords;
      setCurrentLocation([longitude, latitude]);
    });
  }, []);

  useEffect(() => {
    if (currentLocation && map) {
      const marker = new mapboxgl.Marker()
        .setLngLat(currentLocation)
        .addTo(map);
      map.flyTo({ center: currentLocation, zoom: 12 });
      return () => marker.remove();
    }
  }, [currentLocation, map]);

  useEffect(() => {
    handleSearch();
  }, [searchQuery]);

  function handleInputChange(event) {
    setSearchQuery(event.target.value);
  }

  function handleSearch() {
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${searchQuery}.json?access_token=${mapboxgl.accessToken}`)
      .then(response => response.json())
      .then(data => {
        // Lấy ra các địa điểm từ kết quả trả về
        const locations = data.features.map(feature => ({
          name: feature.place_name,
          coordinates: feature.center
        }));
        // Cập nhật suggestedLocations với danh sách các địa điểm
        setSuggestedLocations(locations);
      })
      .catch(error => {
        console.error('Error fetching Mapbox API:', error);

      });
  }

  return (
    <div>
      <input type="text" value={searchQuery} onChange={handleInputChange} />
      <button onClick={handleSearch}>Search</button>
      
      <ul>
        {suggestedLocations.map(location => (
          <li key={location.name}>{location.name}</li>
        ))}
      </ul>
      <div id="map" style={{ width: '100%', height: '400px' }}></div>
    </div>
  );
}

export default MapComponent;