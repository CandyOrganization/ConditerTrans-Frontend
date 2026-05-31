import type { TripLocationUpdate } from '../../types';

export interface TripMapProps {
  tripId: string;
  routeLabel: string;
  vehicleLabel: string;
  licensePlate: string;
  liveLocation?: TripLocationUpdate | null;
  subscribe?: boolean;
}
