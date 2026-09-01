const API_BASE = import.meta.env.VITE_API_BASE || "/api";

async function request(path, { method = "GET", body, params } = {}) {
  let url = `${API_BASE}${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        searchParams.append(k, String(v));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) url += `?${queryString}`;
  }

  // Attach Authorization header if a token is stored
  const headers = body ? { "Content-Type": "application/json" } : {};
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("jiwekee_token") : null;
    if (token) headers["Authorization"] = `Bearer ${token}`;
  } catch (e) {
    // ignore if localStorage not accessible
  }

  const resp = await fetch(url, {
    method,
    credentials: "include", // send/receive httpOnly auth cookie
    headers: Object.keys(headers).length ? headers : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(data.error || "Something went wrong.");
  }
  return data;
}

export const api = {
  // Auth & Users
  signup: (payload) => request("/auth/signup", { method: "POST", body: payload }),
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  adminLogin: (payload) => request("/auth/admin-login", { method: "POST", body: payload }),
  logout: () => request("/auth/logout", { method: "POST" }),
  me: () => request("/auth/me"),
  getUserMe: () => request("/users/me"),
  getStaff: () => request("/auth/staff"),
  switchDemoRole: (role) => request("/auth/switch-demo-role", { method: "POST", body: { role } }),
  forgotPassword: (payload) => request("/auth/forgot-password", { method: "POST", body: payload }),
  verifyResetToken: (token) => request(`/auth/verify-reset-token/${token}`),
  resetPassword: (payload) => request("/auth/reset-password", { method: "POST", body: payload }),

  // Digital Wallet
  getWalletBalance: () => request("/wallet/balance"),
  getWalletTransactions: () => request("/wallet/transactions"),
  topUpWallet: (payload) => request("/wallet/topup", { method: "POST", body: payload }),

  // Menu & Categories
  getMenu: (params) => request("/menu", { params }),
  getCategories: () => request("/menu/categories"),
  createMenuItem: (payload) => request("/menu", { method: "POST", body: payload }),
  updateMenuItem: (id, payload) => request(`/menu/${id}`, { method: "PUT", body: payload }),
  deleteMenuItem: (id) => request(`/menu/${id}`, { method: "DELETE" }),
  toggleMenuAvailability: (id) => request(`/menu/${id}/toggle-availability`, { method: "PATCH" }),
  uploadDishImage: async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    const headers = {};
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("jiwekee_token") : null;
      if (token) headers["Authorization"] = `Bearer ${token}`;
    } catch (_e) {
      // ignore
    }
    const resp = await fetch(`${API_BASE}/menu/upload`, {
      method: "POST",
      credentials: "include",
      headers: Object.keys(headers).length ? headers : undefined,
      body: formData,
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      throw new Error(data.error || "Failed to upload image.");
    }
    return data;
  },

  // Orders
  getOrders: () => request("/orders"),
  getOrderById: (id) => request(`/orders/${id}`),
  getAllOrders: (params) => request("/orders/all", { params }),
  checkout: (payload) => request("/orders", { method: "POST", body: payload }),
  updateOrderFulfillment: (id, payload) => request(`/orders/${id}/fulfillment`, { method: "PATCH", body: payload }),

  // KDS (Kitchen Display System)
  getKitchenTickets: () => request("/kds"),
  advanceKitchenTicket: (id) => request(`/kds/${id}/advance`, { method: "PATCH" }),

  // Tables
  getTables: () => request("/tables"),
  createTable: (payload) => request("/tables", { method: "POST", body: payload }),
  updateTableStatus: (id, status) => request(`/tables/${id}/status`, { method: "PATCH", body: { status } }),
  deleteTable: (id) => request(`/tables/${id}`, { method: "DELETE" }),

  // Reservations
  getMyReservations: () => request("/reservations/my"),
  getAllReservations: (params) => request("/reservations", { params }),
  bookReservation: (payload) => request("/reservations", { method: "POST", body: payload }),
  updateReservationStatus: (id, payload) => request(`/reservations/${id}/status`, { method: "PATCH", body: payload }),

  // Inventory
  getInventory: () => request("/inventory"),
  createInventoryItem: (payload) => request("/inventory", { method: "POST", body: payload }),
  updateInventoryItem: (id, payload) => request(`/inventory/${id}`, { method: "PUT", body: payload }),
  adjustStock: (id, payload) => request(`/inventory/${id}/adjust`, { method: "POST", body: payload }),
  getInventoryLogs: () => request("/inventory/logs"),

  // CRM & Loyalty
  getCRM: () => request("/crm"),
  adjustCustomerPoints: (id, payload) => request(`/crm/${id}/adjust-points`, { method: "POST", body: payload }),
  redeemPoints: (points) => request("/crm/redeem-points", { method: "POST", body: { points } }),
  getLoyaltyLogs: () => request("/crm/loyalty-logs"),

  // Payments & Reconciliation
  getPayments: () => request("/payments"),
  getReconciliation: (params) => request("/reconciliation", { params }),

  // Statistics, Reports & Analytics
  getStats: () => request("/stats"),
  getDashboardStats: () => request("/reports/dashboard"),
  getSalesAnalytics: (params) => request("/reports/analytics", { params }),

  // Notifications
  getNotifications: () => request("/notifications"),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllNotificationsRead: () => request("/notifications/read-all", { method: "POST" }),

  // Audit Logs
  getAuditLogs: (params) => request("/audit-logs", { params }),
};
