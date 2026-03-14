import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { buildSearchPlan, listSupplierSummaries, loadSuppliers, resolveSupplier } from "../shared/suppliers.js";
import { jsonContent, startServer } from "../shared/mcp.js";

const server = new McpServer({
  name: "supplier-catalog",
  version: "0.1.0",
});

server.tool("list_suppliers", {}, async () => {
  return jsonContent({
    suppliers: listSupplierSummaries(),
  });
});

server.tool(
  "get_supplier_profile",
  {
    supplier: z.string().describe("Supplier id or alias, for example mcmaster or digikey."),
  },
  async ({ supplier }) => {
    const match = resolveSupplier(supplier);

    if (!match) {
      return jsonContent({
        error: `Unknown supplier: ${supplier}`,
        availableSuppliers: listSupplierSummaries().map((item) => item.id),
      });
    }

    return jsonContent({
      supplier: match,
    });
  },
);

server.tool(
  "plan_catalog_trace",
  {
    query: z.string().describe("Part number or descriptive search string."),
    suppliers: z
      .array(z.string())
      .optional()
      .describe("Optional supplier ids or aliases. Defaults to all configured suppliers."),
  },
  async ({ query, suppliers }) => {
    const selectedSuppliers = suppliers?.length
      ? suppliers
          .map((supplier) => resolveSupplier(supplier))
          .filter((supplier): supplier is NonNullable<typeof supplier> => Boolean(supplier))
      : loadSuppliers();

    return jsonContent({
      query,
      plans: selectedSuppliers.map((supplier) => buildSearchPlan(supplier, query)),
    });
  },
);

startServer(server).catch((error) => {
  console.error(error);
  process.exit(1);
});
