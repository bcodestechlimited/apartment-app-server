import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 1,
  message: {
    status: 429,
    message:
      "Your mail has been sent. If you have another query, try again in 5 minutes.",
  },
});
export default limiter;
