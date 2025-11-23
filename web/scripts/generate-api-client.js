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
const OPENAPI_JSON_FILE = join(OUTPUT_DIR, "openapi.json");

async function fetchOpenApiSpec() {
  // Try to use existing spec file first (for offline generation)
  try {
    const { readFileSync, existsSync } = await import("fs");
    if (existsSync(OPENAPI_JSON_FILE)) {
      console.log(`Using existing OpenAPI spec from ${OPENAPI_JSON_FILE}...`);
      return JSON.parse(readFileSync(OPENAPI_JSON_FILE, "utf-8"));
    }
  } catch (error) {
    // Ignore and try fetching
  }

  // Try to fetch from API
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
    console.error(
      "Alternatively, place an openapi.json file in the generated-api directory"
    );
    process.exit(1);
  }
}

async function generateClient() {
  try {
    // Fetch the OpenAPI spec
    const openApiSpec = await fetchOpenApiSpec();

    // Save the spec for reference
    mkdirSync(OUTPUT_DIR, { recursive: true });
    writeFileSync(
      join(OUTPUT_DIR, "openapi.json"),
      JSON.stringify(openApiSpec, null, 2)
    );

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
    process.exit(1);
  }
}

generateClient();
