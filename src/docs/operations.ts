import { properties } from "zod";
import { describe } from "zod/v4/core";

const body = (schema: string) => ({
    required: true,
    content: {
        "application/json": {
            schema: {
                $ref: `#/components/schemas/${schema}`,
            },
        },
    },
});

const query = (schema: string) => ({
    name: "filters",
    in: "query",
    description: "Query parameters",
    style: "form",
    explode: true,
    schema: {
        $ref: `#/components/schemas/${schema}`,
    },
});

const response = (
  description: string,
  schema?: Record<string, unknown>
) => ({
  description,
  ...(schema
    ? {
        content: {
          "application/json": {
            ...(schema && { schema })
          },
        },
      }
    : {}),
});

const messageSchema = {
  type: "object",
  properties: {
    message: {
      type: "string",
    },
  },
  required: ["message"],
};

const registerResponseSchema = {
  type: "object",
  properties: {
    message: {
      type: "string",
    },
    user: {
      type: "object",
    },
  },
  required: ["message", "user"],
};

const loginResponseSchema = {
  type: "object",
  properties: {
    message: {
      type: "string",
    },
    accessToken: {
      type: "string",
    },
    user : {
      type: "object",
    },
  },
  required: ["message", "accessToken", "user"],
};

const refreshResponseSchema = {
  type: "object",
  properties: {
    accessToken: {
      type: "string",
    },
  },
  required: ["accessToken"],
};

const UserResponseSchema = {
  type: "object",
  properties: {
    message: {
      type: "string",
    },
    user: {
      type: "object",
    },
  },
  required: ["message", "user"],
};

const PlanResponseSchema = {
  type: "object",
  properties: {
    message: {
      type: "string",
    },
    plan: {
      type: "object",
    },
  },
  required: ["message", "plan"],
};

const PriceResponseSchema = {
  type: "object",
  properties: {
    message: {
      type: "string",
    },
    price: {
      type: "object",
    },
  },
  required: ["message", "price"],
};

const FacilityResponseSchema = {
  type: "object",
  properties: {
    message: {
      type: "string",
    },
    facility: {
      type: "object",
    },
  },
  required: ["message", "facility"],
};

const facilitiesResponseSchema = {
  type: "object",
  properties: {
    message: {
      type: "string",
    },
    facilities: {
      type: "object",
    },
  },
  required: ["message", "facilities"],
};

const usersByRoleResponseSchema = {
  type: "object",
  properties: {
    message: {
      type: "string",
    },
    users: {
      type: "object",
    },
  },
  required: ["message", "users"],
};

const subscriptionResponseSchema = {
  type: "object",
  properties: {
    message: {
      type: "string",
    },
    subscription: {
      type: "object",
    },
  },
  required: ["message", "subscription"],
};

const usersWithSubscriptionResponseSchema = {
  type: "object",
  properties: {
    message: {
      type: "string",
    },
    users: {
      type: "object",
    },
  },
  required: ["message", "users"],
};

const subscriptionPaymentResponseSchema = {
  type: "object",
  properties: {
    message: {
      type: "string",
    },
    subscription: {
      type: "object",
    },
    payment: {
      type: "object",
    },
  },
  required: ["message", "subscription", "payment"],
};

const paymentResponseSchema = {
  type: "object",
  properties: {
    message: {
      type: "string",
    },
    payment: {
      type: "object",
    },
  },
  required: ["message", "payment"],
};

const receiptResponseSchema = {
  type: "object",
  properties: {
    message: {
      type: "string",
    },
    receipt: {
      type: "object",
    },
  },
  required: ["message", "receipt"],
};

const sessionResponseSchema = {
  type: "object",
  properties: {
    message: {
      type: "string",
    },
    session: {
      type: "object",
    },
  },
  required: ["message", "session"],
};

const aiResponseSchema = {
  type: "object",
  properties: {
    message: {
      type: "string",
    },
    result: {
      type: "object",
    },
  },
  required: ["message", "result"],
};
export const operations = {
  // AUTH
  "get /api/auth/google": {
    description: "Initiates Google OAuth authentication.",
    responses: {
      "302": response("Redirects the user to Google's authentication page."),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "get /api/auth/google/callback": {
    description: "Handles the Google OAuth callback and completes authentication.",
    responses: {
      "200": response("Request completed successfully.", loginResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "post /api/auth/register": {
    description: "Creates a new user account using the provided registration details.",
    requestBody: body("registerSchema"),
    responses: {
      "201": response("Resource created successfully.", registerResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "409": response("Conflict. The request conflicts with the current state of the resource.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "post /api/auth/login": {
    description: "Authenticates a user using their email and password.",
    requestBody: body("loginSchema"),
    responses: {
      "200": response("Request completed successfully.", loginResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "409": response("Conflict. The request conflicts with the current state of the resource.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "post /api/auth/refresh": {
    description: "Uses the refresh token cookie to obtain a new access token.",
    responses: {
      "200": response("Request completed successfully.", refreshResponseSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "409": response("Conflict. The request conflicts with the current state of the resource.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "post /api/auth/logout": {
    description: "Logs out the current session and invalidates its refresh token.",
    responses: {
      "200": response("Request completed successfully.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },

  // ADMIN - USERS
  "get /api/admin/users": {
    description: "Retrieves the list of users.",
    responses: {
      "200": response("Request completed successfully.", PlanResponseSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "get /api/admin/users/{id}": {
    description: "Retrieves a specific user by their ID.",
    responses: {
      "200": response("Request completed successfully.", PlanResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "patch /api/admin/users/{id}/role": {
    description: "Changes the role assigned to a specific user.",
    requestBody: body("roleChangeSchema"),
    responses: {
      "200": response("Request completed successfully.", PlanResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "delete /api/admin/users/{id}": {
    description: "Deletes a specific user account.",
    responses: {
      "200": response("Request completed successfully.", messageSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },

  // ADMIN - PLANS
  "post /api/admin/plan": {
    description: "Creates a new membership plan.",
    requestBody: body("planCreateSchema"),
    responses: {
      "201": response("Resource created successfully.", PlanResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "409": response("Conflict. The request conflicts with the current state of the resource.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "patch /api/admin/plan/{id}": {
    description: "Updates the price of an existing membership plan.",
    requestBody: body("priceChangeSchema"),
    responses: {
      "200": response("Request completed successfully.", PriceResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "delete /api/admin/plan/{id}": {
    description: "Deletes a membership plan by its ID.",
    responses: {
      "200": response("Request completed successfully.", messageSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },

  // ADMIN - FACILITIES
  "post /api/admin/facilities/": {
    description: "Creates a new facility.",
    requestBody: body("facilityCreateSchema"),
    responses: {
      "201": response("Resource created successfully.", FacilityResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "409": response("Conflict. The request conflicts with the current state of the resource.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "get /api/admin/facilities/": {
    description: "Retrieves available facilites.",
    responses: {
      "200": response("Request completed successfully.", facilitiesResponseSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    }
  },
  "get /api/admin/facilities/{id}": {
    description: "Retrieves a specific facility by its ID.",
    responses: {
      "200": response("Request completed successfully.", facilitiesResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "delete /api/admin/facilities/{id}": {
    description: "Deletes a facility by its ID.",
    responses: {
      "200": response("Request completed successfully.", messageSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },

  // ADMIN - ROLES
  "get /api/admin/role/users": {
    description: "Retrieves users filtered by their assigned role.",
    parameters: [query("getByRoleSchema")],
    responses: {
      "200": response("Request completed successfully.", usersByRoleResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },

  // ADMIN - SUBSCRIPTIONS
  "get /api/admin/subscriptions/": {
    description: "Retrieves subscriptions with query option.",
    parameters: [query("subscriptionQuery1Schema")],
    responses: {
      "200": response("Request completed successfully.", subscriptionResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "get /api/admin/subscriptions/users": {
    description: "Get all the user with subscriptions along with the subscriptions.",
    responses: {
      "200": response("Request completed successfully.", usersWithSubscriptionResponseSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "post /api/admin/subscriptions/": {
    description: "Creates a subscription for a user.",
    requestBody: body("subscriptionCreate1Schema"),
    responses: {
      "201": response("Resource created successfully.", subscriptionPaymentResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "409": response("Conflict. The request conflicts with the current state of the resource.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "get /api/admin/subscriptions/{id}": {
    description: "Retrieves a specific subscription by its ID.",
    responses: {
      "200": response("Request completed successfully.", subscriptionResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "patch /api/admin/subscriptions/{id}": {
    description: "Updates the details of a specific subscription.",
    requestBody: body("subscriptionChangeSchema"),
    responses: {
      "200": response("Request completed successfully.", subscriptionResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "delete /api/admin/subscriptions/{id}": {
    description: "Deletes a specific subscription.",
    responses: {
      "200": response("Request completed successfully.", messageSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },

  // ADMIN - PAYMENTS
  "get /api/admin/payments": {
    description: "Retrieves payment records with query option.",
    parameters: [query("paymentQuery1Schema")],
    responses: {
      "200": response("Request completed successfully.", paymentResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "get /api/admin/payments/{id}": {
    description: "Retrieves a specific payment by its ID.",
    responses: {
      "200": response("Request completed successfully.", paymentResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "patch /api/admin/payments/{id}": {
    description: "Updates the details a payment.",
    requestBody: body("paymentChangeSchema"),
    responses: {
      "200": response("Request completed successfully.", paymentResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "delete /api/admin/payments/{id}": {
    description: "Deletes a payment record.",
    responses: {
      "200": response("Request completed successfully.", messageSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "get /api/admin/payments/{id}/receipt": {
    description: "Retrieves the receipt associated with a specific payment.",
    responses: {
      "200": response("Request completed successfully.", receiptResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },

  // ADMIN - SESSIONS
  "get /api/admin/sessions": {
    description: "Retrieves facility sessions with query option.",
    parameters: [query("sessionQuery1Schema")],
    responses: {
      "200": response("Request completed successfully.", sessionResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "post /api/admin/sessions/": {
    description: "Creates a new facility session.",
    requestBody: body("sessionCreate1Schema"),
    responses: {
      "201": response("Resource created successfully.", sessionResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "409": response("Conflict. The request conflicts with the current state of the resource.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "get /api/admin/sessions/{id}": {
    description: "Retrieves a specific facility session by its ID.",
    responses: {
      "200": response("Request completed successfully.", sessionResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "patch /api/admin/sessions/{id}": {
    description: "Updates an existing facility session.",
    responses: {
      "200": response("Request completed successfully.", sessionResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "delete /api/admin/sessions/{id}": {
    description: "Deletes a facility session.",
    responses: {
      "200": response("Request completed successfully.", messageSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },

  // ADMIN - LOGOUT
  "post /api/admin/logout-all": {
    description: "Invalidates all active sessions.",
    responses: {
      "200": response("Request completed successfully.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },

  // USERS
  "get /api/users/me": {
    description: "Retrives the current user's information",
    responses: {
      "200": response("Request completed successfully.", UserResponseSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    }
  },
  "patch /api/users/me": {
    description: "Allows a user to change their name, email, password.",
    requestBody: body("dataChangeSchema"),
    responses: {
      "200": response("Request completed successfully.", UserResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "patch /api/users/me/avatar": {
    description: "Uploads or updates the authenticated user's profile avatar.",
    requestBody: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              avatar: {
                type: "string",
                format: "binary",
              },
            },
          },
        },
      },
    },
    responses: {
      "200": response("Request completed successfully.", UserResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "patch /api/users/me/remove-avatar": {
    description: "Removes a user's profile avatar.",
    responses: {
      "200": response("Request completed successfully.", UserResponseSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "delete /api/users/me": {
    description: "Deletes a users information.",
    responses: {
      "200": response("Request completed successfully.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },

  // USERS - SUBSCRIPTIONS
  "get /api/users/subscriptions": {
    description: "Retrieves subscriptions belonging to the authenticated user.",
    parameters: [query("subscriptionQuerySchema")],
    responses: {
      "200": response("Request completed successfully.", subscriptionResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "get /api/users/subscriptions/{id}": {
    description: "Retrieves a specific subscription belonging to the authenticated user.",
    responses: {
      "200": response("Request completed successfully.", subscriptionResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "post /api/users/subscription": {
    description: "Creates a subscription for the authenticated user.",
    requestBody: body("subscriptionCreateSchema"),
    responses: {
      "201": response("Resource created successfully.", subscriptionPaymentResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "409": response("Conflict. The request conflicts with the current state of the resource.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "patch /api/users/subscription/{id}/status": {
    description: "Updates a subscription belonging to the authenticated user.",
    responses: {
      "200": response("Request completed successfully.", subscriptionResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },

  // USERS - PAYMENTS
  "get /api/users/payments": {
    description: "Retrieves payment records belonging to the authenticated user.",
    parameters: [query("paymentQuerySchema")],
    responses: {
      "200": response("Request completed successfully.", paymentResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "get /api/users/payments/{id}": {
    description: "Retrieves a specific payment belonging to the authenticated user.",
    responses: {
      "200": response("Request completed successfully.", paymentResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "patch /api/users/payments/{id}": {
    description: "Updates a payment record belonging to the authenticated user.",
    responses: {
      "200": response("Request completed successfully.", paymentResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "patch /api/users/payment/{id}/upload": {
    description: "Uploads a receipt for a specific payment.",
    requestBody: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              receipt: {
                type: "string",
                format: "binary",
              },
            },
          },
        },
      },
    },
    responses: {
      "200": response("Request completed successfully.", paymentResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },

  // USERS - SESSIONS
  "get /api/users/sessions": {
    description: "Retrieves facility sessions belonging to the authenticated user.",
    parameters: [query("sessionQuerySchema")],
    responses: {
      "200": response("Request completed successfully.", sessionResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "get /api/users/sessions/{id}": {
    description: "Retrieves a specific facility session associated with the authenticated user.",
    responses: {
      "200": response("Request completed successfully.", sessionResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "post /api/users/sessions": {
    description: "Creates a facility session for the authenticated user.",
    requestBody: body("sessionCreateSchema"),
    responses: {
      "201": response("Resource created successfully.", sessionResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "409": response("Conflict. The request conflicts with the current state of the resource.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "patch /api/users/sessions/{id}/checkout": {
    description: "Records the checkout of the authenticated user from a facility session.",
    responses: {
      "200": response("Request completed successfully.", sessionResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },

  // PLANS
  "get /api/plans/": {
    description: "Retrieves available membership plans using the supplied filters.",
    parameters: [query("planQuerySchema")],
    responses: {
      "200": response("Request completed successfully.", PlanResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "get /api/plans/price": {
    description: "Retrieves membership plan pricing information.",
    parameters: [query("planQuerySchema")],
    responses: {
      "200": response("Request completed successfully.", PriceResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "get /api/plans/facilities": {
    description: "Retrieves facilities associated with membership plans.",
    responses: {
      "200": response("Request completed successfully.", facilitiesResponseSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "get /api/plans/{id}": {
    description: "Retrieves a specific membership plan by its ID.",
    responses: {
      "200": response("Request completed successfully.", PlanResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },

  // FACILITIES
  "get /api/facilities/": {
    description: "Retrieves the available facilities.",
    responses: {
      "200": response("Request completed successfully.", facilitiesResponseSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "get /api/facilities/{id}": {
    description: "Retrieves a specific facility by its ID.",
    responses: {
      "200": response("Request completed successfully.", facilitiesResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },

  // SUBSCRIPTIONS
  "get /api/subscriptions/": {
    description: "Retrieves subscriptions with query options.",
    parameters: [query("subscriptionQuery1Schema")],
    responses: {
      "200": response("Request completed successfully.", subscriptionResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "get /api/subscriptions/users": {
    description: "Get users with subscriptions with a certain status.",
    responses: {
      "200": response("Request completed successfully.", usersWithSubscriptionResponseSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "get /api/subscriptions/{id}": {
    description: "Retrieves a specific subscription by its ID.",
    responses: {
      "200": response("Request completed successfully.", subscriptionResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "post /api/subscriptions/": {
    description: "Creates a new subscription.",
    requestBody: body("subscriptionCreate1Schema"),
    responses: {
      "201": response("Resource created successfully.", subscriptionPaymentResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "409": response("Conflict. The request conflicts with the current state of the resource.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "patch /api/subscriptions/{id}/status": {
    description: "Updates the status of a specific subscription.",
    requestBody: body("subscriptionChangeSchema"),
    responses: {
      "200": response("Request completed successfully.", subscriptionResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },

  // SESSIONS
  "get /api/sessions/": {
    description: "Retrieves facility sessions with query options.",
    parameters: [query("sessionQuery1Schema")],
    responses: {
      "200": response("Request completed successfully.", sessionResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "get /api/sessions/{id}": {
    description: "Retrieves a specific facility session by its ID.",
    responses: {
      "200": response("Request completed successfully.", sessionResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "post /api/sessions/": {
    description: "Creates a new facility session.",
    requestBody: body("sessionCreateSchema"),
    responses: {
      "201": response("Resource created successfully.", sessionResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "409": response("Conflict. The request conflicts with the current state of the resource.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "patch /api/sessions/{id}": {
    description: "Updates an existing facility session.",
    responses: {
      "200": response("Request completed successfully.", sessionResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },

  // PAYMENTS
  "get /api/payments/": {
    description: "Retrieves payment records with query options.",
    parameters: [query("paymentQuery1Schema")],
    responses: {
      "200": response("Request completed successfully.", paymentResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "get /api/payments/{id}": {
    description: "Retrieves a specific payment by its ID.",
    responses: {
      "200": response("Request completed successfully.", paymentResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "get /api/payments/{id}/receipt": {
    description: "Retrieves the receipt associated with a specific payment.",
    responses: {
      "200": response("Request completed successfully.", receiptResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
  "patch /api/payments/{id}": {
    description: "Updates a payment record.",
    responses: {
      "200": response("Request completed successfully.", paymentResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "403": response("You are authenticated but do not have permission to perform this action.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },

  // AI
  "post /api/ai/support": {
    description: "Submits a support request and returns an AI-generated response.",
    requestBody: body("userRequestSchema"),
    responses: {
      "200": response("Request completed successfully.", aiResponseSchema),
      "400": response("Bad request. The provided data is invalid or malformed.", messageSchema),
      "401": response("Authentication is required or the provided credentials are invalid.", messageSchema),
      "404": response("The requested resource was not found.", messageSchema),
      "500": response("An unexpected internal server error occurred.", messageSchema),
    },
  },
};