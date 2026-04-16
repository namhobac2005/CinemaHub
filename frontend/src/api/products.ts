import axios from 'axios';

// Đảm bảo URL này khớp với khai báo trong server.js của bạn (thường là /products)
const API_URL = 'http://localhost:5000/products';

export const getProducts = async (showAll = false) => {
  // Thêm query all=true để Backend biết khi nào cần lấy cả IsDeleted
  const res = await axios.get(API_URL, {
    params: { all: showAll },
  });
  return res.data;
};

export const addProduct = async (product: any) => {
  const res = await axios.post(API_URL, product);
  return res.data;
};

// Đảm bảo id truyền vào là chuỗi UUID
export const updateProduct = async (id: string, product: any) => {
  const res = await axios.put(`${API_URL}/${id}`, product);
  return res.data;
};

// Xóa mềm: Backend sẽ gọi INSERT INTO SanPham_Status ... ON DUPLICATE KEY UPDATE IsDeleted = 1
export const deleteProduct = async (id: string) => {
  const res = await axios.delete(`${API_URL}/${id}`);
  return res.data;
};
