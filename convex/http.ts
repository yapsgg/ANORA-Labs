import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();

// Auth routes
auth.addHttpRoutes(http);

export default http;
