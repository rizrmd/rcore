// Cities loader utility
interface City {
  id: string;
  name: string;
  province: string;
}

export const loadCitiesByProvince = async (provinceId: string): Promise<City[]> => {
  if (!provinceId) {
    return [];
  }

  try {
    let citiesData: any;
    
    // Try to import the specific province cities file
    switch (provinceId) {
      case 'aceh':
        citiesData = (await import('./cities/aceh.json')).default;
        break;
      case 'sumatera-utara':
        citiesData = (await import('./cities/sumatera-utara.json')).default;
        break;
      case 'sumatera-barat':
        citiesData = (await import('./cities/sumatera-barat.json')).default;
        break;
      case 'riau':
        citiesData = (await import('./cities/riau.json')).default;
        break;
      case 'kepulauan-riau':
        citiesData = (await import('./cities/kepulauan-riau.json')).default;
        break;
      case 'jambi':
        citiesData = (await import('./cities/jambi.json')).default;
        break;
      case 'sumatera-selatan':
        citiesData = (await import('./cities/sumatera-selatan.json')).default;
        break;
      case 'bangka-belitung':
        citiesData = (await import('./cities/bangka-belitung.json')).default;
        break;
      case 'bengkulu':
        citiesData = (await import('./cities/bengkulu.json')).default;
        break;
      case 'lampung':
        citiesData = (await import('./cities/lampung.json')).default;
        break;
      case 'dki-jakarta':
        citiesData = (await import('./cities/dki-jakarta.json')).default;
        break;
      case 'jawa-barat':
        citiesData = (await import('./cities/jawa-barat.json')).default;
        break;
      case 'jawa-tengah':
        citiesData = (await import('./cities/jawa-tengah.json')).default;
        break;
      case 'diy-yogyakarta':
        citiesData = (await import('./cities/diy-yogyakarta.json')).default;
        break;
      case 'jawa-timur':
        citiesData = (await import('./cities/jawa-timur.json')).default;
        break;
      case 'banten':
        citiesData = (await import('./cities/banten.json')).default;
        break;
      case 'bali':
        citiesData = (await import('./cities/bali.json')).default;
        break;
      case 'nusa-tenggara-barat':
        citiesData = (await import('./cities/nusa-tenggara-barat.json')).default;
        break;
      case 'nusa-tenggara-timur':
        citiesData = (await import('./cities/nusa-tenggara-timur.json')).default;
        break;
      case 'kalimantan-barat':
        citiesData = (await import('./cities/kalimantan-barat.json')).default;
        break;
      case 'kalimantan-tengah':
        citiesData = (await import('./cities/kalimantan-tengah.json')).default;
        break;
      case 'kalimantan-selatan':
        citiesData = (await import('./cities/kalimantan-selatan.json')).default;
        break;
      case 'kalimantan-timur':
        citiesData = (await import('./cities/kalimantan-timur.json')).default;
        break;
      case 'kalimantan-utara':
        citiesData = (await import('./cities/kalimantan-utara.json')).default;
        break;
      case 'sulawesi-utara':
        citiesData = (await import('./cities/sulawesi-utara.json')).default;
        break;
      case 'sulawesi-tengah':
        citiesData = (await import('./cities/sulawesi-tengah.json')).default;
        break;
      case 'sulawesi-selatan':
        citiesData = (await import('./cities/sulawesi-selatan.json')).default;
        break;
      case 'sulawesi-tenggara':
        citiesData = (await import('./cities/sulawesi-tenggara.json')).default;
        break;
      case 'gorontalo':
        citiesData = (await import('./cities/gorontalo.json')).default;
        break;
      case 'sulawesi-barat':
        citiesData = (await import('./cities/sulawesi-barat.json')).default;
        break;
      case 'maluku':
        citiesData = (await import('./cities/maluku.json')).default;
        break;
      case 'maluku-utara':
        citiesData = (await import('./cities/maluku-utara.json')).default;
        break;
      case 'papua':
        citiesData = (await import('./cities/papua.json')).default;
        break;
      case 'papua-barat':
        citiesData = (await import('./cities/papua-barat.json')).default;
        break;
      case 'papua-selatan':
        citiesData = (await import('./cities/papua-selatan.json')).default;
        break;
      case 'papua-tengah':
        citiesData = (await import('./cities/papua-tengah.json')).default;
        break;
      case 'papua-pegunungan':
        citiesData = (await import('./cities/papua-pegunungan.json')).default;
        break;
      case 'papua-barat-daya':
        citiesData = (await import('./cities/papua-barat-daya.json')).default;
        break;
      default:
        console.warn(`No cities file found for province: ${provinceId}`);
        return [];
    }

    // Validate and return the cities data
    if (Array.isArray(citiesData)) {
      return citiesData;
    } else {
      console.warn(`Invalid cities data format for province: ${provinceId}`, citiesData);
      return [];
    }
    
  } catch (error) {
    console.error(`Error loading cities for province ${provinceId}:`, error);
    
    // Fallback: try to load from the main cities.json file
    try {
      const allCitiesModule = await import('./cities.json');
      const allCities = allCitiesModule.default;
      if (Array.isArray(allCities)) {
        const filteredCities = allCities.filter((city: any) => city.province === provinceId);
        return filteredCities;
      }
    } catch (fallbackError) {
      console.error("Failed to load cities from fallback source:", fallbackError);
    }
    
    return [];
  }
};
