import { $ } from "bun";

const server = Bun.serve({
  port: 3005,
  async fetch(req) {
    if (req.method === "POST") {
      try {
        const data = await req.json();
        const fileName = new Date();
        const path = `./${fileName}.md`;
        await Bun.write(path, data.content);
        await $`npx @marp-team/marp-cli@latest ${fileName}.md -o ${fileName}.pdf`;
      } catch {
        console.error("Error handling incoming request:", error);
        return new Response("Internal server error.", { status: 500 });
      }
    } else {
      return new Response("This endpoint only accepts POST requests.");
    }
  },
});

console.log(`Listening on localhost:${server.port}`);
