
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
  imageUrl: string;
}

export interface GeneratedImage {
  id: string;
  src: string;
  prompt: string;
  type: 'Cinematic Shot' | 'Scene Plan';
  params?: {
    lens: string;
    time: string;
    weather: string;
    direction:string;
    location: string;
  };
  createdAt: Date;
}
