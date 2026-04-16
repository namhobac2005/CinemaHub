const API_BASE = 'http://localhost:5000'.replace(/\/$/, '');

async function handleResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message || 'Lỗi hệ thống');
  }
  return payload as T;
}

/** CUSTOMERS */
export const fetchCustomers = () =>
  fetch(`${API_BASE}/users/customers`).then(handleResponse);

export const createCustomer = (payload: any) =>
  fetch(`${API_BASE}/users/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(handleResponse);

export const updateCustomer = (id: string, payload: any) =>
  fetch(`${API_BASE}/users/customers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(handleResponse);

export const deleteCustomer = (id: string) =>
  fetch(`${API_BASE}/users/customers/${id}`, { method: 'DELETE' }).then(
    handleResponse,
  );

/** EMPLOYEES */
export const fetchEmployees = () =>
  fetch(`${API_BASE}/users/employees`).then(handleResponse);

export const createEmployee = (payload: any) =>
  fetch(`${API_BASE}/users/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(handleResponse);

export const updateEmployee = (id: string, payload: any) =>
  fetch(`${API_BASE}/users/employees/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(handleResponse);

export const deleteEmployee = (id: string) =>
  fetch(`${API_BASE}/users/employees/${id}`, { method: 'DELETE' }).then(
    handleResponse,
  );

export default {
  fetchCustomers,
  fetchEmployees,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
