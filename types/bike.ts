export type BikeVersion = {
  id: string;
  year: number;
  msrp: number | null;
  frame_material: string | null;
  wheel_size: string | null;
  front_travel_mm: number | null;
  rear_travel_mm: number | null;
  image_url: string | null;
  bike_models: {
    name: string;
    category: string | null;
    brands: {
      name: string;
    };
  };
};