import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { VENDORS, getVendorById } from "@/lib/vendors";
import { purchaseFromVendor } from "@/lib/agent/purchase";

const vendorIds = VENDORS.map((v) => v.id) as [string, ...string[]];

export const buyDataTool = tool(
  async ({ vendorId, query }: { vendorId: string; query: string }) => {
    const vendor = getVendorById(vendorId);

    if (!vendor) {
      return JSON.stringify({
        executed: false,
        error: `Unknown vendor id "${vendorId}". Valid options: ${VENDORS.map((v) => v.id).join(", ")}`,
      });
    }

    const result = await purchaseFromVendor({
      toAccountId: vendor.hederaAccountId,
      amountHbar: vendor.priceHbar,
      vendorName: vendor.name,
    });

    if (!result.executed) {
      return JSON.stringify(result);
    }

    try {
      const data = await vendor.fetchData(query);
      return JSON.stringify({ ...result, data });
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : "Unknown error";
      return JSON.stringify({
        ...result,
        data: { error: `Payment succeeded but fetching data failed: ${message}` },
      });
    }
  },
  {
    name: "buy_data",
    description:
      "Purchase data from a vendor by paying them HBAR, then fetch the real data. Use this " +
      "when the user asks for information that one of the available vendors provides. The " +
      "payment is subject to policy checks (allowlist, spend limit, daily budget) and may be " +
      "blocked.\n\n" +
      "Available vendors:\n" +
      VENDORS.map((v) => `- "${v.id}" (${v.name}, ${v.priceHbar} HBAR): ${v.description}`).join(
        "\n"
      ),
    schema: z.object({
      vendorId: z
        .enum(vendorIds)
        .describe("The id of the vendor to purchase data from."),
      query: z
        .string()
        .describe(
          "The specific thing to look up from this vendor — e.g. a city name for weather, " +
            "or a coin symbol like 'BTC' for crypto prices. Extract this from the user's message."
        ),
    }),
  }
);
