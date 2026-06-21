export interface Vendor {
  id: string;
  name: string;
  hederaAccountId: string;
  priceHbar: number;
  description: string;
  fetchData: (query: string) => Promise<Record<string, unknown>>;
}

async function fetchWeather(city: string): Promise<Record<string, unknown>> {
  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&format=json`
  );

  if (!geoRes.ok) {
    return { error: `Geocoding lookup failed (HTTP ${geoRes.status}).` };
  }

  const geoData = await geoRes.json();
  const place = geoData.results?.[0];

  if (!place) {
    return { error: `Could not find a location matching "${city}".` };
  }

  const weatherRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,wind_speed_10m,relative_humidity_2m`
  );

  if (!weatherRes.ok) {
    return { error: `Weather lookup failed (HTTP ${weatherRes.status}).` };
  }

  const weatherData = await weatherRes.json();

  return {
    location: `${place.name}${place.country ? `, ${place.country}` : ""}`,
    temperatureC: weatherData.current?.temperature_2m,
    windSpeedKmh: weatherData.current?.wind_speed_10m,
    relativeHumidityPercent: weatherData.current?.relative_humidity_2m,
    source: "open-meteo.com",
  };
}

const COIN_ID_MAP: Record<string, string> = {
  btc: "bitcoin",
  bitcoin: "bitcoin",
  eth: "ethereum",
  ethereum: "ethereum",
  hbar: "hedera-hashgraph",
  hedera: "hedera-hashgraph",
  sol: "solana",
  solana: "solana",
};

async function fetchCryptoPrice(query: string): Promise<Record<string, unknown>> {
  const requested = query
    .toLowerCase()
    .split(/[,\s]+/)
    .map((token) => COIN_ID_MAP[token])
    .filter((id): id is string => Boolean(id));

  const coinIds = requested.length > 0 ? Array.from(new Set(requested)) : ["bitcoin", "ethereum", "hedera-hashgraph"];

  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(",")}&vs_currencies=usd`
  );

  if (!res.ok) {
    return { error: `Price lookup failed (HTTP ${res.status}).` };
  }

  const data = await res.json();

  return {
    prices: data,
    source: "coingecko.com",
  };
}

export const VENDORS: Vendor[] = [
  {
    id: "weather",
    name: "WeatherAPI",
    hederaAccountId: "0.0.9245568",
    priceHbar: 1,
    description:
      "Current weather conditions for any city. Pass the city name as the query.",
    fetchData: fetchWeather,
  },
  {
    id: "crypto-prices",
    name: "PriceAPI",
    hederaAccountId: "0.0.9245568",
    priceHbar: 1,
    description:
      "Current cryptocurrency prices in USD (BTC, ETH, HBAR, SOL). Pass the coin symbol(s) as the query.",
    fetchData: fetchCryptoPrice,
  },
];

export function getVendorById(id: string): Vendor | undefined {
  return VENDORS.find((v) => v.id === id);
}
