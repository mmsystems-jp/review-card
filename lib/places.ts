export interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  rating: number | null;
  totalReviews: number | null;
  reviews: {
    text: string;
    rating: number;
    relativeTime: string;
    authorName: string;
  }[];
  googleMapsUri: string;
}

const BASE = "https://places.googleapis.com/v1";
const API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? "";

export async function searchPlace(query: string): Promise<PlaceResult | null> {
  const res = await fetch(`${BASE}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.reviews,places.googleMapsUri",
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: "ja",
      maxResultCount: 1,
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  const place = data.places?.[0];
  if (!place) return null;
  return formatPlace(place);
}

function formatPlace(place: Record<string, unknown>): PlaceResult {
  const reviews = ((place.reviews as Record<string, unknown>[] | undefined) ?? [])
    .slice(0, 5)
    .map((r) => ({
      text: (r.text as { text?: string } | undefined)?.text ?? "",
      rating: (r.rating as number | undefined) ?? 0,
      relativeTime: (r.relativePublishTimeDescription as string | undefined) ?? "",
      authorName: (r.authorAttribution as { displayName?: string } | undefined)?.displayName ?? "",
    }))
    .filter((r) => r.text.length > 10);

  return {
    placeId: (place.id as string | undefined) ?? "",
    name: (place.displayName as { text?: string } | undefined)?.text ?? "",
    address: (place.formattedAddress as string | undefined) ?? "",
    rating: (place.rating as number | undefined) ?? null,
    totalReviews: (place.userRatingCount as number | undefined) ?? null,
    reviews,
    googleMapsUri: (place.googleMapsUri as string | undefined) ?? "",
  };
}
