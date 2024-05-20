import React, { useState , useEffect} from 'react';
import Select from 'react-select';
import mapboxgl from 'mapbox-gl';

// Thay thế 'your-access-token' bằng access token của bạn
mapboxgl.accessToken = 'pk.eyJ1IjoiZGF0dG0wMyIsImEiOiJjbHZ3aWs2dmIwZG1pMnFvZ2JzczBxYTZwIn0.f8D93mAehFFbbIhmaH83pA';

function SearchLocation({ setStartPoint, setEndPoint }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestedLocations, setSuggestedLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    if (selectedLocation) {
      setSearchQuery(selectedLocation.label);
    } else {
      setSearchQuery('');
    }
  }, [selectedLocation]);

  const handleInputChange = (newValue) => {
    const value = newValue ? newValue.value : ''; // Lấy giá trị mới từ newValue
    setSearchQuery(newValue);
    fetchLocations(newValue); // Gửi yêu cầu mới khi giá trị input thay đổi
    //setSuggestedLocations([]); // Xóa danh sách địa điểm đề xuất khi bắt đầu nhập vào ô input
    //console.log(newValue);
  };

  //Khi chọn một điểm 
  const handleSearch = (selectedOption) => {
    //setSearchQuery(selectedOption.value);
    if (selectedOption) {
      setSelectedLocation(selectedOption);
      if (setStartPoint) {
        setStartPoint(selectedOption.value);
      }
      if (setEndPoint) {
        setEndPoint(selectedOption.value);
      }
    } else {
      setSelectedLocation(null);
      if (setStartPoint) {
        setStartPoint('');
      }
      if (setEndPoint) {
        setEndPoint('');
      }
    }
    //setSuggestedLocations([]); // Xóa danh sách địa điểm đề xuất khi một địa điểm được chọn
  };

  const fetchLocations = async (inputValue) => {
    if (!inputValue) {
      return;
    }
    
    try {
      const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${inputValue}.json?access_token=${mapboxgl.accessToken}`);
      const data = await response.json();
      
      const locations = data.features.map(feature => ({
        value: feature.place_name,
        label: feature.place_name,
        name: feature.place_name,
        coordinates: feature.center
      }));
      //console.log(locations);
      setSuggestedLocations(locations);
    } catch (error) {
      console.error('Error fetching Mapbox API:', error);
    }
  };
  
  return (
    <Select
      value={selectedLocation}
      onChange={handleSearch}
      options={suggestedLocations}
      onInputChange={handleInputChange}
      placeholder="Search location..."
      isClearable
      isSearchable
      onMenuOpen={() => fetchLocations(searchQuery)}
    />
   
  );
}

export default SearchLocation;