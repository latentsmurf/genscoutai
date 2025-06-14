
export interface FilmingLocation {
  id: string;
  movieTitle: string;
  sceneDescription: string;
  locationName: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  year: number;
  imageUrl: string; // Changed from imageHint
}

