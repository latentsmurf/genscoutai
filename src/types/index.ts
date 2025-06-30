

export interface Project {
  id: string;
  name: string;
  images: GeneratedImage[];
  createdAt: Date;
}

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

export interface Shot {
  shotNumber: number;
  cameraAngle: string;
  shotDescription: string;
  notes?: string;
}

export interface Vendor {
  name: string;
  category: string;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface MapNote {
  id: string;
  position: google.maps.LatLngLiteral;
  text: string;
  color: string;
  shape?: 'marker' | 'polygon' | 'rectangle' | 'circle';
}
