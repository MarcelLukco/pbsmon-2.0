#!/usr/bin/env node

import { generate } from "openapi-typescript-codegen";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_URL = process.env.API_URL || "http://localhost:4200";
const OPENAPI_JSON_URL = `${API_URL}/api/docs-json`;
const OUTPUT_DIR = join(__dirname, "../src/lib/generated-api");

async function fetchOpenApiSpec() {
  // Fetch from API directly
  try {
    console.log(`Fetching OpenAPI spec from ${OPENAPI_JSON_URL}...`);
    const response = await fetch(OPENAPI_JSON_URL);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch OpenAPI spec: ${response.status} ${response.statusText}`
      );
    }

    const spec = await response.json();
    return spec;
  } catch (error) {
    console.error("Error fetching OpenAPI spec:", error.message);
    console.error(
      "Make sure the API server is running or set API_URL environment variable"
    );
    if (process.env.WATCH_MODE !== "true") {
      process.exit(1);
    }
    throw error;
  }
}

async function generateClient() {
  try {
    // Fetch the OpenAPI spec directly from API
    const openApiSpec = await fetchOpenApiSpec();

    // Ensure output directory exists
    mkdirSync(OUTPUT_DIR, { recursive: true });

    console.log("Generating TypeScript client...");

    // Generate the client
    await generate({
      input: openApiSpec,
      output: OUTPUT_DIR,
      httpClient: "fetch",
      clientName: "ApiClient",
      useOptions: true,
      useUnionTypes: true,
      exportCore: true,
      exportServices: true,
      exportModels: true,
      exportSchemas: false,
    });

    console.log(`✅ API client generated successfully in ${OUTPUT_DIR}`);
  } catch (error) {
    console.error("Error generating API client:", error);
    if (process.env.WATCH_MODE !== "true") {
      process.exit(1);
    }
    throw error;
  }
}

generateClient();
