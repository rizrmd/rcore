
interface Village {
  id: string;
  name: string;
  district: string;
}

export const loadVillagesByDistrict = async (districtSlug: string): Promise<Village[]> => {
  if (!districtSlug) {
    return [];
  }

  try {
    // Use fetch() to get the data from the public URL.
    // This is the correct way to load data files from the network.
    const response = await fetch(`/data/villages/${districtSlug}.json`);

    // Check if the request was successful. This handles 404 Not Found errors.
    if (!response.ok) {
      console.error(`Failed to fetch villages for ${districtSlug}. Status: ${response.status}`);
      // You could add fallback logic here if needed, for now we return empty.
      return [];
    }

    // If the response is OK, parse the response body as JSON.
    return await response.json();

  } catch (error) {
    // This catches network errors (e.g., user is offline).
    console.error(`Network error when trying to load villages for ${districtSlug}`, error);
    return [];
  }
};
