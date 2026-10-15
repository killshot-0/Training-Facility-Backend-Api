import { z } from "./zod-openapi.js";
import {
    OpenAPIRegistry,
    OpenApiGeneratorV31,
} from "@asteasolutions/zod-to-openapi";

import * as authSchemas from "../schemas/auth.schemas.js";
import * as adminSchemas from '../schemas/admin.schemas.js';
import * as aiSchemas from "../schemas/ai.schemas.js";
import * as facilitySchemas from "../schemas/facility.schemas.js";
import * as fileSchemas from "../schemas/file.schemas.js";
import * as paymentSchemas from "../schemas/payment.schemas.js";
import * as planSchemas from "../schemas/plan.schemas.js";
import * as sessionSchemas from "../schemas/session.schemas.js";
import * as subscriptionSchemas from "../schemas/subscription.schemas.js";
import * as userSchemas from "../schemas/user.schemas.js";

const schemas = {
  authSchemas,
  adminSchemas,
  aiSchemas,
  facilitySchemas,
  fileSchemas,
  paymentSchemas,
  planSchemas,
  sessionSchemas,
  subscriptionSchemas,
  userSchemas,
};


export const registry = new OpenAPIRegistry();

export function schemaGenerator(){
    
    for(const [modeuleName, module] of Object.entries(schemas)){
        for(const [schemaName, schema] of Object.entries(module)){
            if(!(schema instanceof z.ZodObject)) continue;

            for(const [requestInput, schemaObject] of Object.entries(schema.shape)){
                if (!(schemaObject instanceof z.ZodType)) continue;
    
                registry.register(schemaName, schemaObject);
            }
        };
    };
    const generator = new OpenApiGeneratorV31(registry.definitions);

    const document = generator.generateDocument({
        openapi: "3.1.0",
        info: {
            title: "My API",
            version: "1.0.0"
        },
    });
    return document.components?.schemas;
};