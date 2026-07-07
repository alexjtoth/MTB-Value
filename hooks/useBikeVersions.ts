import { useEffect, useState } from "react";
import { supabase } from "../app/lib/supabase";
import type { BikeVersion } from "@/types/bike";

type BikeFilters = {
  brand?: string;
  category?: string;
  year?: number;
};

export function useBikeVersions(filters: BikeFilters = {}) {
  const [bikeVersions, setBikeVersions] = useState<BikeVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBikeVersions() {
      setLoading(true);

      let query = supabase
        .from("bike_versions")
        .select(`
          id,
          year,
          msrp,
          frame_material,
          wheel_size,
          front_travel_mm,
          rear_travel_mm,
          image_url,
          bike_models (
            name,
            category,
            brands (
              name
            )
          )
        `);

      if (filters.year) {
        query = query.eq("year", filters.year);
      }

      if (filters.category) {
        query = query.eq("bike_models.category", filters.category);
      }

      if (filters.brand) {
        query = query.eq("bike_models.brands.name", filters.brand);
      }

      const { data, error } = await query;

      if (error) {
        console.log("Error loading bike versions:", error);
        setLoading(false);
        return;
      }

      setBikeVersions((data as unknown as BikeVersion[]) || []);
      setLoading(false);
    }

    loadBikeVersions();
  }, [filters.brand, filters.category, filters.year]);

  return { bikeVersions, loading };
}