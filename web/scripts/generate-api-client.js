#!/usr/bin/env node

import { generate } from "openapi-typescript-codegen";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { loadEnv } from "vite";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env files using Vite's loadEnv
const mode = process.env.NODE_ENV || "development";
const envDir = join(__dirname, "..");
const env = loadEnv(mode, envDir, "");

const API_URL =
  env.API_BASE_URL || process.env.API_BASE_URL || "http://147.251.245.82/:4200";
const OUTPUT_DIR = join(__dirname, "../src/lib/generated-api");
const GENERATED_CLIENT_EXISTS = existsSync(OUTPUT_DIR);

if (!API_URL) {
  if (GENERATED_CLIENT_EXISTS) {
    console.warn(
      "⚠️  API_BASE_URL is not set, but generated API client exists. Skipping regeneration."
    );
    console.warn(
      "   To regenerate the client, set API_BASE_URL environment variable."
    );
    process.exit(0);
  } else {
    console.error(
      "ERROR: API_BASE_URL is not set and no generated API client exists."
    );
    console.error(
      "   Please set API_BASE_URL as an environment variable or in a .env file."
    );
    process.exit(1);
  }
}

const OPENAPI_JSON_URL = `${API_URL}/docs-json`;

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
