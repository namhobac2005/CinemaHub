const API_BASE =
  (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
export { API_BASE };

const BOOKING_BASE = `${API_BASE.replace(/\/$/, '')}/booking`;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BOOKING_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  let payload: any = null;
  try {
    payload = await response.json();
  } catch (err) {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.message || response.statusText || 'Request failed';
    throw new Error(message);
  }

  return payload as T;
}

export interface TheaterResponse {
  id: string;
  name: string;
  address: string;
  city: string;
  status: string;
}

export interface MovieResponse {
  id: string;
  tenPhim: string;
  moTa: string;
  thoiLuong: number;
  xuatXu: string;
  dangPhim: string;
  ngayPhatHanh: string;
  trailerURL: string | null;
  posterURL: string | null;
  gioiHanTuoi: number;
  longTieng: boolean;
  phuDe: string | null;
}

export interface ShowtimeResponse {
  id: string;
  startTime: string;
  phongChieu: string;
  rapid: string;
  rapName: string;
  dinhDang: string;
  longTieng: boolean;
  phuDe: string | null;
  gioiHanTuoi: number;
  giaVe: number;
}

export type SeatStatus = 'available' | 'booked' | 'processing';

export interface SeatResponse {
  id: string;
  row: string;
  col: number;
  type: string;
  status: SeatStatus;
  price: number;
}

export interface SeatMapResponse {
  showtime: {
    id: string;
    rapid: string;
    rapName: string;
    room: string;
    startTime: string;
    format: string;
    longTieng: boolean;
    phuDe: string | null;
    movieName: string;
  };
  seats: SeatResponse[];
}

export interface VoucherResponse {
  voucherid: string;
  code: string;
  type: 'PhanTram' | 'SoTien';
  amount: number;
  discountValue: number;
}

export interface CheckoutSeatPayload {
  row: string;
  number: number | string;
}

export interface CheckoutProductPayload {
  productid: string;
  quantity: number;
}

export interface CheckoutPayload {
  customerId?: number | null;
  showtimeid: string;
  seats: CheckoutSeatPayload[];
  products?: CheckoutProductPayload[];
  voucherCode?: string;
  paymentMethod: string;
}

export interface CheckoutResponse {
  invoiceid: string;
  bookingCode: string;
  subtotal: number;
  ticketTotal: number;
  productTotal: number;
  discount: number;
  total: number;
  voucher: { id: string; code: string; type: string } | null;
  tickets: Array<{ seatCode: string; price: number; seatType: string }>;
  products: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  showtime: {
    id: string;
    rapid: string;
    rapName: string;
    room: string;
    startTime: string;
    format: string;
    movieName: string;
  };
}

export const fetchTheaters = () => request<TheaterResponse[]>('/theaters');

export const fetchMovies = (theaterId: string) =>
  request<MovieResponse[]>(`/theaters/${theaterId}/movies`);

export const fetchShowtimes = (params: {
  theaterId: string;
  movieId: string;
  date?: string;
}) => {
  const query = new URLSearchParams({
    theaterId: params.theaterId,
    movieId: params.movieId,
  });
  if (params.date) {
    query.set('date', params.date);
  }
  return request<ShowtimeResponse[]>(`/showtimes?${query.toString()}`);
};

export const fetchSeatMap = (showtimeid: string) =>
  request<SeatMapResponse>(`/showtimes/${showtimeid}/seats`);

export const applyVoucher = (code: string, total: number) =>
  request<VoucherResponse>('/voucher/apply', {
    method: 'POST',
    body: JSON.stringify({ code, total }),
  });

export const checkoutBooking = (payload: CheckoutPayload) =>
  request<CheckoutResponse>('/checkout', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
