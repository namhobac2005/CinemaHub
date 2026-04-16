import axios from "axios";

// Cấu hình API URL
const API_URL = "http://localhost:5000/invoice";

// (Tuỳ chọn) Định nghĩa kiểu dữ liệu cho Hóa đơn để code gợi ý thông minh hơn
export interface Invoice {
  id?: number;
  customerName: string;
  totalAmount: number;
  createdAt?: string;
  items?: any[]; // Chi tiết các món trong hóa đơn
}

// 1. Lấy danh sách tất cả hóa đơn
export const getInvoices = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách hóa đơn:", error);
    throw error;
  }
};

// 2. Lấy chi tiết một hóa đơn theo ID
export const getInvoiceDetails = async (id: number) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy chi tiết hóa đơn #${id}:`, error);
    throw error;
  }
};

// 3. Tạo hóa đơn mới (Thường dùng khi thanh toán giỏ hàng)
export const createInvoice = async (invoiceData: Invoice) => {
  try {
    const response = await axios.post(API_URL, invoiceData);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi tạo hóa đơn:", error);
    throw error;
  }
};

// 4. Xóa hóa đơn (Nếu cần)
export const deleteInvoice = async (id: number) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi xóa hóa đơn #${id}:`, error);
    throw error;
  }
};