import axios from "axios";
import { env } from "../config/env.config";

const paystackClient = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

export default paystackClient;
