import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js"
import axios from "axios"

const server = new Server(
  {
    name: "algeria-salawat-mcp",
    version: "1.0.0"
  },
  {
    capabilities: {
      tools: {}
    }
  }
)

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_salawat_times",
        description: "Get prayer times for an Algerian wilaya",
        inputSchema: {
          type: "object",
          properties: {
            wilaya: {
              type: "string",
              description: "Name of the Algerian wilaya"
            }
          },
          required: ["wilaya"]
        }
      }
    ]
  }
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "get_salawat_times") {
    throw new Error("Tool not found")
  }

  const wilaya = request.params.arguments?.wilaya as string

  const today = new Date()
  const date = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`

  try {
    const response = await axios.get(
      `https://api.aladhan.com/v1/timingsByCity/${date}`,
      {
        params: {
          city: wilaya,
          country: "Algeria",
          method: 2
        }
      }
    )

    const t = response.data.data.timings

    return {
      content: [
        {
          type: "text",
          text:
            `Prayer Times for ${wilaya}\n\n` +
            `Fajr: ${t.Fajr}\n` +
            `Dhuhr: ${t.Dhuhr}\n` +
            `Asr: ${t.Asr}\n` +
            `Maghrib: ${t.Maghrib}\n` +
            `Isha: ${t.Isha}`
        }
      ]
    }
  } catch {
    return {
      content: [
        {
          type: "text",
          text: "Failed to fetch prayer times."
        }
      ]
    }
  }
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main()