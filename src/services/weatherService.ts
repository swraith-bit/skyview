import { LocationData, ObservationData, SuitabilityStatus } from '../types';
import { estimateBortleScale } from '../utils/events';
import { fetchJsonWithTimeout } from '../utils/fetchWithTimeout';

// Fetch current weather data from OpenMeteo
export const fetchWeather = async (
  requestLocation: LocationData,
  signal?: AbortSignal
): Promise<ObservationData> => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${requestLocation.latitude}&longitude=${requestLocation.longitude}&current=temperature_2m,relative_humidity_2m,cloud_cover,wind_speed_10m&hourly=cloud_cover,wind_speed_10m&timeformat=unixtime&forecast_days=3&timezone=auto`;
  
    const response = await fetchJsonWithTimeout(url, { signal }, 10_000);
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
  // §6 zod ilk-yükleme: şema modülü ilk ağ doğrulamasına kadar geciktirilir.
  const { openMeteoWeatherSchema, parseContract } = await import('../schemas/apiSchemas');
  const data = parseContract('Open-Meteo weather', openMeteoWeatherSchema, response.data);

    const current = data.current;
    const hourlyList = data.hourly;
    
    const cloudCover = current.cloud_cover ?? 0;
  let suitability: SuitabilityStatus = 'unsuitable';

  if (cloudCover <= 15) {
    suitability = 'excellent';
  } else if (cloudCover <= 40) {
    suitability = 'good';
  } else if (cloudCover <= 55) {
    suitability = 'fair';
  } else if (cloudCover <= 80) {
    suitability = 'poor';
  } else {
    suitability = 'unsuitable';
  }
  
  // Find current time index in hourly
  const nowSec = Math.floor(Date.now() / 1000);
  let startIndex = hourlyList.time.findIndex((ts: number) => ts > nowSec);
  if (startIndex < 0) startIndex = 0;
  
  const next36h = {
    time: hourlyList.time.slice(startIndex, startIndex + 36),
    cloudCover: hourlyList.cloud_cover.slice(startIndex, startIndex + 36),
    windspeed: hourlyList.wind_speed_10m.slice(startIndex, startIndex + 36)
  };

  return {
    cloudCover,
    temp: Math.round(current.temperature_2m ?? 0),
    humidity: current.relative_humidity_2m ?? 0,
    windSpeed: Math.round(current.wind_speed_10m ?? 0),
    suitability,
    statusText: '', // Will be localized in the UI/Hook
    colorTheme: suitability === 'excellent' || suitability === 'good' ? 'green' : 'red',
    hourly: next36h,
    bortleIndex: estimateBortleScale(requestLocation.latitude, requestLocation.longitude)
  };
};
