type NominatimAddress = {
  state?: string;
  province?: string;
  city?: string;
  county?: string;
  town?: string;
  village?: string;
  suburb?: string;
  borough?: string;
  city_district?: string;
};

type NominatimReverse = {
  address?: NominatimAddress;
};

const cache = new Map<string, string>();

function cacheKey(lat: number, lng: number) {
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

function uniqueParts(parts: string[]) {
  return parts.filter((part, index) => part && part !== parts[index - 1]);
}

export function formatPlaceName(address: NominatimAddress) {
  const region = address.state || address.province || "";
  const city = address.city || address.county || "";
  const district =
    address.borough ||
    address.city_district ||
    address.suburb ||
    address.town ||
    address.village ||
    "";

  const parts = uniqueParts(
    (region && city === region ? [city, district] : [region, city, district]).filter(
      Boolean,
    ),
  );

  return parts.slice(0, 2).join(" ");
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string | null> {
  const key = cacheKey(lat, lng);
  const cached = cache.get(key);
  if (cached) return cached;

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "jsonv2",
    "accept-language": "ko",
    zoom: "14",
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "CapsuleMe/1.0 (time-capsule weather)",
        },
        signal: controller.signal,
        next: { revalidate: 86400 },
      },
    );
    if (!response.ok) return null;

    const data = (await response.json()) as NominatimReverse;
    const placeName = data.address ? formatPlaceName(data.address) : "";
    if (!placeName) return null;

    cache.set(key, placeName);
    return placeName;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
