import { BikeCard } from "./BikeCard";

interface BikeGridProps {
  bikes: any[];
}

export function BikeGrid({ bikes }: BikeGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {bikes.map((bike) => (
        <BikeCard
          key={bike.id}
          bike={{
            slug: bike.id,
            year: bike.year,
            brand: bike.bike_models.brands.name,
            model: bike.bike_models.name,
            category: bike.bike_models.category,
            value: bike.msrp,
            imageUrl: bike.image_url,
          }}
        />
      ))}
    </div>
  );
}