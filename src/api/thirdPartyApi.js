import api from './axiosConfig';

// Get all third parties
export const getAllThirdParties = async () => {
  try {
    const response = await api.get('/thirdparty/list');
    return response.data;
  } catch (error) {
    console.error('Error fetching third parties:', error);
    throw error.response?.data || error.message;
  }
};

// Get third party by ID
export const getThirdPartyById = async (id) => {
  try {
    const response = await api.get(`/thirdparty/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching third party with ID ${id}:`, error);
    throw error.response?.data || error.message;
  }
};

// Create a new third party
export const createThirdParty = async (thirdPartyData, profileImage = null) => {
  try {
    let response;
    
    // If profile image is provided, use FormData
    if (profileImage) {
      const formData = new FormData();
      
      // Add all fields to FormData
      for (const key in thirdPartyData) {
        if (key === 'product_list') {
          // For product_list, send as JSON string when using FormData
          // The backend now has logic to parse JSON strings
          if (Array.isArray(thirdPartyData[key])) {
            formData.append(key, JSON.stringify(thirdPartyData[key]));
          }
        } else {
          formData.append(key, thirdPartyData[key]);
        }
      }
      
      // Add profile image
      formData.append('profile_image', profileImage);
      
      // Send FormData with POST request
      // Set Content-Type to undefined so browser can set it with boundary
      response = await api.post('/thirdparty/create', formData, {
        headers: {
          'Content-Type': undefined
        }
      });
    } else {
      // Send as JSON (no profile image)
      // Create a copy of the data to avoid modifying the original
      const jsonData = { ...thirdPartyData };
      
      // Ensure product_list is sent as a JSON array
      // The backend expects product_list to be an array of product IDs
      if (jsonData.product_list && Array.isArray(jsonData.product_list)) {
        // Make sure all IDs are numbers
        jsonData.product_list = jsonData.product_list.map(id => 
          typeof id === 'string' ? parseInt(id, 10) : id
        );
      }
      
      response = await api.post('/thirdparty/create', jsonData);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error creating third party:', error);
    // Log more details about the error for debugging
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
    }
    throw error.response?.data || error.message;
  }
};

// Update third party
export const updateThirdParty = async (id, thirdPartyData, profileImage = null) => {
  try {
    let response;
    
    // If profile image is provided, use FormData
    if (profileImage) {
      const formData = new FormData();
      
      // Add all fields to FormData
      for (const key in thirdPartyData) {
        if (key === 'product_list') {
          // For product_list, send as JSON string when using FormData
          // The backend now has logic to parse JSON strings
          if (Array.isArray(thirdPartyData[key])) {
            formData.append(key, JSON.stringify(thirdPartyData[key]));
          }
        } else {
          formData.append(key, thirdPartyData[key]);
        }
      }
      
      // Add profile image
      formData.append('profile_image', profileImage);
      
      // Send FormData with PUT request
      // Set Content-Type to undefined so browser can set it with boundary
      response = await api.put(`/thirdparty/${id}`, formData, {
        headers: {
          'Content-Type': undefined
        }
      });
    } else {
      // Send as JSON (no profile image)
      // Create a copy of the data to avoid modifying the original
      const jsonData = { ...thirdPartyData };
      
      // Ensure product_list is sent as a JSON array
      // The backend expects product_list to be an array of product IDs
      if (jsonData.product_list && Array.isArray(jsonData.product_list)) {
        // Make sure all IDs are numbers
        jsonData.product_list = jsonData.product_list.map(id => 
          typeof id === 'string' ? parseInt(id, 10) : id
        );
      }
      
      response = await api.put(`/thirdparty/${id}`, jsonData);
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error updating third party with ID ${id}:`, error);
    // Log more details about the error for debugging
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
    }
    throw error.response?.data || error.message;
  }
};

// Delete third party
export const deleteThirdParty = async (id) => {
  try {
    const response = await api.delete(`/thirdparty/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting third party with ID ${id}:`, error);
    throw error.response?.data || error.message;
  }
};