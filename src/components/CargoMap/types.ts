import type { CargoLocationUpdate } from '../../types';

export interface CargoMapProps {
  cargoId: string;
  deliveryAddress: string;
  productionAddress?: string | null;
  vehicleLabel: string;
  licensePlate?: string;
  liveLocation?: CargoLocationUpdate | null;
  subscribe?: boolean;
}
