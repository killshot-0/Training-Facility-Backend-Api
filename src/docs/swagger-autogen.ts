import swaggerAutogen from "swagger-autogen";
import { schemaGenerator } from "./openapi.js";
import { readFile, writeFile } from "node:fs/promises";
import { operations } from "./operations.js";
import { REFRESH_COOKIE_NAME } from "../utils/refresh-token.js";

const schemas = schemaGenerator();

const doc = {
  info: {
    title: "Training Facility Backend API",
    description: "Backend for managing sign-ups, subscriptions, payments and sessions for a training facility.",
    version: "1.0.0",
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Local development server",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
      RefreshCookie: {
        type: "apiKey",
        in: "cookie",
        name: REFRESH_COOKIE_NAME,
        description: "Refresh token stored in an HTTP-only cookie.",
      },
    },
  },
};

const outputFile = "./src/docs/swagger-output.json";

// Use the root file where Express mounts the routers.
const routes = ["./src/app.ts"];


type SecurityRequirement = Record<string, string[]>;

type OpenApiOperation = {
  security?: SecurityRequirement[];
  description?: string;
  tags?: string[];
  parameters?: {
    name: string;
    in: string;
    schema?: Record<string, unknown>;
  }[];
};

type OpenApiDocument = {
  paths: Record<string, Record<string, OpenApiOperation>>;
  components?: {
    schemas?: Record<string, unknown>;
    securitySchemes?: Record<string, unknown>;
  };
  security?: SecurityRequirement[];
};
async function generateDocs() {
    // Generate paths and methods first.
    await swaggerAutogen({ openapi: "3.0.0" })(
        outputFile,
        routes,
        doc
    );

    const swaggerDoc = JSON.parse(
        await readFile(outputFile, "utf-8")
    ) as OpenApiDocument;

    // Merge the genuine Zod-generated OpenAPI schemas afterward.
    swaggerDoc.components!.schemas = schemaGenerator();

    const paths = swaggerDoc.paths;

    for (const [path, methods] of Object.entries(paths)) {
        for (const operation of Object.values(methods)) {
            operation.security = [{ bearerAuth: [] }];
        }
    }

    swaggerDoc.security = [
        {
            bearerAuth: [],
        },
    ];
    swaggerDoc.paths["/api/auth/register"].post.security = [];
    swaggerDoc.paths["/api/auth/login"].post.security = [];

    swaggerDoc.paths["/api/auth/refresh"].post.security = [
        {
            RefreshCookie: [],
        },
    ];

    // Add tags, request bodies, parameters and response descriptions.
    for (const [key, operation] of Object.entries(operations)) {
        const [method, ...pathParts] = key.split(" ");
        const path = pathParts.join(" ");

        const target = swaggerDoc.paths[path]?.[method];

        if (!target) {
            console.warn(`Documentation target not found: ${key}`);
            continue;
        }

        Object.assign(target, operation);
    }

    for (const [path, methods] of Object.entries(swaggerDoc.paths)) {
        const group = path.split("/")[2];
        const tag = group
            ? group.charAt(0).toUpperCase() + group.slice(1)
            : "General";

        for (const operation of Object.values(methods)) {
            operation.tags = [tag];
        }
    }

        // 2. Set path parameter formats
    for (const methods of Object.values(swaggerDoc.paths)) {
        for (const operation of Object.values(methods)) {
            for (const parameter of operation.parameters ?? []) {
                if (parameter.in === "path" && parameter.name === "id") {
                    parameter.schema = {
                    type: "string",
                    format: "uuid",
                    };
                }
            }
        }
    }

    for (const methods of Object.values(swaggerDoc.paths)) {
        for (const operation of Object.values(methods)) {
            operation.parameters = operation.parameters?.filter(
            (parameter) =>
                !(
                parameter.in === "header" &&
                parameter.name.toLowerCase() === "authorization"
                )
            );
        }
    }

    await writeFile(
        outputFile,
        JSON.stringify(swaggerDoc, null, 2)
    );

    console.log("Swagger documentation generated.");
}

generateDocs();