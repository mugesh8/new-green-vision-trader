import api from './axiosConfig';

// Create a new vendor
export const createVendor = async (vendorData, profileImage = null) => {
  try {
    let response;
    
    // Map frontend field names to backend field names
    const mappedVendorData = {
      vendor_name: vendorData.vendor_name,
      vendor_type: vendorData.vendor_type,
      registration_number: vendorData.registration_number,
      address: vendorData.address,
      city: vendorData.city,
      state: vendorData.state,
      pin_code: vendorData.pin_code,
      contact_person: vendorData.contact_person,
      tape_color: vendorData.tape_color,
      dealing_person: vendorData.dealing_person,
      phone: vendorData.phone,
      secondary_phone: vendorData.secondary_phone,
      email: vendorData.email,
      account_holder_name: vendorData.account_holder_name,
      bank_name: vendorData.bank_name,
      account_number: vendorData.account_number,
      IFSC_code: vendorData.IFSC_code,
      product_list: vendorData.product_list
    };
    
    // If profile image is provided, use FormData
    if (profileImage) {
      const formData = new FormData();
      
      // Add all fields to FormData
      for (const key in mappedVendorData) {
        if (key === 'product_list') {
          // For product_list, send as JSON string when using FormData
          if (Array.isArray(mappedVendorData[key])) {
            formData.append(key, JSON.stringify(mappedVendorData[key]));
          }
        } else {
          formData.append(key, mappedVendorData[key]);
        }
      }
      
      // Add profile image
      formData.append('profile_image', profileImage);
      
      // Send FormData with proper Content-Type header
      response = await api.post('/vendor/create', formData, {
        headers: {
          'Content-Type': undefined
        }
      });
    } else {
      // Send as JSON (no profile image)
      response = await api.post('/vendor/create', mappedVendorData);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error creating vendor:', error);
    // Log more details about the error for debugging
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
    }
    throw error.response?.data || error.message;
  }
};

// Get all farmers
export const getAllFarmers = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`/farmer/list?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching farmers:', error);
    throw error.response?.data || error.message;
  }
};

// Get all suppliers
export const getAllSuppliers = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`/supplier/list?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    throw error.response?.data || error.message;
  }
};

// Get all third parties
export const getAllThirdParties = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`/thirdparty/list?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching third parties:', error);
    throw error.response?.data || error.message;
  }
};

// Get all vendors (farmers + suppliers + third parties)
export const getAllVendors = async (page = 1, limit = 10) => {
  try {
    // Fetch all three types of vendors
    const [farmersRes, suppliersRes, thirdPartiesRes] = await Promise.all([
      getAllFarmers(page, limit),
      getAllSuppliers(page, limit),
      getAllThirdParties(page, limit)
    ]);

    // Combine all vendors into one array
    const allVendors = [
      ...(farmersRes.data || []).map(vendor => ({ ...vendor, vendor_type: 'farmer', fid: vendor.fid })),
      ...(suppliersRes.data || []).map(vendor => ({ ...vendor, vendor_type: 'supplier', sid: vendor.sid })),
      ...(thirdPartiesRes.data || []).map(vendor => ({ ...vendor, vendor_type: 'third party', tpid: vendor.tpid }))
    ];

    return {
      success: true,
      message: 'Vendors retrieved successfully',
      data: allVendors,
      pagination: {
        currentPage: page,
        totalPages: Math.max(
          farmersRes.pagination?.totalPages || 0,
          suppliersRes.pagination?.totalPages || 0,
          thirdPartiesRes.pagination?.totalPages || 0
        ),
        totalItems: (farmersRes.pagination?.totalItems || 0) + 
                   (suppliersRes.pagination?.totalItems || 0) + 
                   (thirdPartiesRes.pagination?.totalItems || 0)
      }
    };
  } catch (error) {
    console.error('Error fetching all vendors:', error);
    throw error.response?.data || error.message;
  }
};