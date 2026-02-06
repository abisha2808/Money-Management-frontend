import axios from "axios";

const API = axios.create({
  baseURL: "https://money-management-backend-production.up.railway.app/api",
   headers: { "Content-Type": "application/json" },
});

export default API;
