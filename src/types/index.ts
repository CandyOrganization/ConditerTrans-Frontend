export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthUser {
  email: string;
  accessToken: string;
  refreshToken: string;
  id?: string;
  userRole?: UserRole;
  isAdmin?: boolean;
}

export type UserRole = 'Manager' | 'Dispatcher' | 'Coordinator' | 'Driver';

/** Статусы заказа с бэкенда (Common.Enums.OrderStatus) */
export type DispatcherOrderStatus =
  | 'Draft'
  | 'PendingApproval'
  | 'Confirmed'
  | 'Rescheduled'
  | 'Rejected'
  | 'AwaitingShipment'
  | 'Shipped'
  | 'Delivered';

export interface DispatcherOrderLine {
  productName: string;
  quantity: number;
  unit: string;
  formattedQuantity?: string;
  productPrice?: number;
}

export interface DispatcherOrderListItem {
  id: string;
  orderNumber: number;
  companyName: string;
  creationDate: string;
  deliveryAddress: string;
  status: DispatcherOrderStatus;
  amount?: number;
  paymentType?: string | null;
}

export interface DispatcherOrderDetail extends DispatcherOrderListItem {
  productionAddress?: string | null;
  lines: DispatcherOrderLine[];
  /** Для модалки отгрузки (когда логист уже назначен) */
  handoverVehicle?: string | null;
  handoverDriver?: string | null;
}

export interface RejectDispatcherOrderDto {
  reason: string;
}

export interface RescheduleDispatcherOrderDto {
  newDeliveryDate: string;
  reason: string;
}

export interface ReadyForShipmentDto {
  shipmentDate: string;
}

export interface HandoverDispatcherOrderDto {
  documentsHandedOver: boolean;
}

export type ManagerOrderStatus = Exclude<DispatcherOrderStatus, 'Draft'>;

export interface RescheduleProposal {
  proposedDeliveryDate: string;
  reason: string;
}

export interface ManagerOrderListItem {
  id: string;
  orderNumber: number;
  creationDate: string;
  status: ManagerOrderStatus;
  productionAddress?: string | null;
  deliveryAddress?: string | null;
  paymentType?: string | null;
  amount: number;
  reschedule?: RescheduleProposal;
}

export interface ManagerOrderDetail extends ManagerOrderListItem {
  lines: DispatcherOrderLine[];
}

export interface AcceptManagerRescheduleDto {
  comment?: string;
}

export interface RejectManagerRescheduleDto {
  reason?: string;
}

export interface EmployeeInfo {
  name: string;
  surname: string;
  patronymic?: string | null;
  phone: string;
  employeeNumber: string;
  companyId: string;
  createdAt: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  userRole: UserRole;
  isAdmin: boolean;
  employeeId: string;
  employee?: EmployeeInfo | null;
}

export interface CreateEmployeeDto {
  name: string;
  surname: string;
  patronymic?: string;
  phone: string;
  employeeNumber: string;
  email: string;
  userRole?: UserRole;
}

export interface TokensResponse {
  accessToken: string;
  refreshToken: string;
}

export interface SetPasswordDto {
  inviteId: string;
  password: string;
}

export type TripStatus =
  | 'in_transit'
  | 'awaiting'
  | 'problem'
  | 'delayed'
  | 'completed';

export interface Application {
  id: string;
  orderNumber?: number;
  from: string;
  to: string;
  weight: string;
  loadingDate: string;
  dimensions: string;
  price: string;
  specialConditions?: string;
}

export interface Trip {
  id: string;
  route: string;
  client: string;
  driver: string;
  vehicle: string;
  status: TripStatus;
  loadingDate: string;
}

export interface CreateApplicationDto {
  from: string;
  to: string;
  weight: string;
  dimensions: string;
  price: string;
  loadingDate: string;
  deliveryDate: string;
  specialConditions?: string;
}

export interface TripsFilter {
  search?: string;
  status?: TripStatus | 'all';
  page?: number;
  pageSize?: number;
}

export interface PaginatedTrips {
  items: Trip[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type DriverStatus = 'free' | 'busy';

export interface Driver {
  id: string;
  employeeId: string;
  name: string;
  phone: string;
  employeeNumber?: string;
  status: DriverStatus;
}

export interface ProcessApplicationDto {
  driverId: string;
  comment?: string;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  middleName: string;
  role: string;
  personnelNumber: string;
  phone: string;
  email: string;
  registrationDate: string;
}

export type ReportType = 'rejections' | 'product-rating';

export interface ReportDateFilter {
  dateFrom: string;
  dateTo: string;
}

export interface RejectionReportRow {
  reason: string;
  orderCount: number;
  sharePercent: number;
}

export interface ProductRatingRow {
  rank: number;
  name: string;
  orderCount: number;
}

export interface FreeTransportRow {
  driver: string;
  vehicle: string;
  licensePlate: string;
  city: string;
  availableSince: string;
}

export interface UpdateProfileDto {
  lastName: string;
  firstName: string;
  middleName: string;
  phone: string;
  email: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface TripOrderInfo {
  client: string;
  contactName: string;
  contactPhone: string;
  weight: string;
  dimensions: string;
  cost: string;
  requestDate: string;
  plannedLoadingDate: string;
  eta: string;
  specialConditions?: string;
}

export interface TripTransportInfo {
  employeeId: string;
  driver: string;
  driverPhone: string;
  vehicle: string;
  licensePlate: string;
  bodyType: string;
  payloadCapacity: string;
}

export interface CargoLocationUpdate {
  cargoId: string;
  driverId: string;
  latitude: number;
  longitude: number;
  heading?: number | null;
  speed?: number | null;
  updatedAt: string;
}

/** @deprecated Use CargoLocationUpdate */
export type TripLocationUpdate = CargoLocationUpdate;

export interface TripLocationUpdateLegacy {
  tripId: string;
  employeeId: string;
  latitude: number;
  longitude: number;
  heading?: number | null;
  speed?: number | null;
  updatedAt: string;
}

export interface TripHistoryEvent {
  id: string;
  date: string;
  description: string;
  variant: 'success' | 'default';
}

export type TripDocumentType = 'pdf' | 'docx' | 'contract';

export interface TripDocument {
  id: string;
  name: string;
  type: TripDocumentType;
}

export interface TripDetails {
  id: string;
  status: TripStatus;
  routeShort: string;
  routeFull: string;
  order: TripOrderInfo;
  transport: TripTransportInfo;
  history: TripHistoryEvent[];
  documents: TripDocument[];
}
