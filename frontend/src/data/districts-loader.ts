
interface District {
  id: string;
  name: string;
  regency: string;
}

export const loadDistrictsByCity = async (citySlug: string): Promise<District[]> => {
  if (!citySlug) {
    return [];
  }

  try {
    // Use fetch() to get the data from the public URL
    const response = await fetch(`/data/districts/${citySlug}.json`);

    // Check if the request was successful (e.g., handle 404 errors)
    if (!response.ok) {
      console.error(`Failed to fetch districts for ${citySlug}. Status: ${response.status}`);
      return [];
    }

    // Parse the response body as JSON
    return await response.json();

  } catch (error) {
    console.error(`Network error when trying to load districts for ${citySlug}`, error);
    return [];
  }
};