export function generateOpenApiStub() {
  return {
    openapi: "3.0.0",
    info: {
      title: "Lisbook API",
      version: "0.1.0"
    },
    paths: {
      "/v1/health": {
        get: {
          summary: "Health check"
        }
      }
    }
  };
}

if (require.main === module) {
  // Placeholder until Swagger generation is wired in a later slice.
  console.log(JSON.stringify(generateOpenApiStub(), null, 2));
}

