import { exec } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let isGenerating = false;

/**
 * Vite plugin to automatically regenerate API client when API changes
 */
export default function apiClientPlugin() {
  return {
    name: "api-client-generator",
    async buildStart() {
      // Generate on startup
      await generateApiClient();
    },
    configureServer(server) {
      // Watch for API server changes by polling the OpenAPI endpoint
      const API_URL = process.env.API_URL || "http://localhost:4200";
      const OPENAPI_JSON_URL = `${API_URL}/api/docs-json`;
      let lastSpecHash = null;

      const checkAndRegenerate = async () => {
        if (isGenerating) return;

        try {
          const response = await fetch(OPENAPI_JSON_URL);
          if (response.ok) {
            const spec = await response.json();
            const specHash = JSON.stringify(spec);

            // Only regenerate if spec changed
            if (lastSpecHash !== specHash) {
              lastSpecHash = specHash;
              console.log("🔄 API spec changed, regenerating client...");
              await generateApiClient();
              // Trigger HMR for the generated files
              server.moduleGraph.invalidateAll();
              server.ws.send({
                type: "full-reload",
              });
            }
          }
        } catch (error) {
          // API not available yet, will retry silently
        }
      };

      // Check every 5 seconds in dev mode
      const interval = setInterval(checkAndRegenerate, 5000);

      // Initial check after a short delay
      setTimeout(checkAndRegenerate, 2000);

      // Cleanup on server close
      server.httpServer?.on("close", () => {
        clearInterval(interval);
      });
    },
  };
}

async function generateApiClient() {
  if (isGenerating) return;
  isGenerating = true;

  try {
    const scriptPath = join(__dirname, "scripts/generate-api-client.js");
    const { stdout, stderr } = await execAsync(`node ${scriptPath}`, {
      cwd: __dirname,
      env: { ...process.env, WATCH_MODE: "true" },
    });
    if (stdout) console.log(stdout.trim());
    if (stderr && !stderr.includes("Error fetching OpenAPI spec")) {
      console.error(stderr.trim());
    }
  } catch (error) {
    // Don't fail the build if API is not available
    if (
      !error.message?.includes("fetch") &&
      !error.message?.includes("ECONNREFUSED")
    ) {
      console.error("Error generating API client:", error.message);
    }
  } finally {
    isGenerating = false;
  }
}
