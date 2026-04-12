import axios from "axios";
import { auth } from "../firebase";

const BASE = "http://localhost:5000";
const API_URL = `${BASE}/api/notifications`;

// Unified Auth Header Helper
async function getAuthHeader() {
  if (auth.currentUser) {
    const token = await auth.currentUser.getIdToken();
    return { Authorization: `Bearer ${token}` };
  }
  const googleToken = localStorage.getItem("googleToken");
  if (googleToken) {
    return { Authorization: `Bearer ${googleToken}` };
  }
  return {};
}

export const fetchNotifications = async () => {
  const headers = await getAuthHeader();
  const response = await axios.get(API_URL, { headers });
  return response.data;
};

export const markNotificationAsRead = async (notificationId) => {
  const headers = await getAuthHeader();
  const response = await axios.patch(`${API_URL}/${notificationId}`, {}, { headers });
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const headers = await getAuthHeader();
  const response = await axios.patch(`${API_URL}/mark-all/read`, {}, { headers });
  return response.data;
};
