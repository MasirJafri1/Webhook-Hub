import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8787/api/v1",
});
