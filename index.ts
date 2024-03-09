import { $ } from "bun";
const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    if (req.method === "POST") {
      try {
        const data: any = await req.json();
        const context = `Generate marp code for presentation on topic ${data.content}`
        const fileName = `${data.content}-${Date.now()}`;
        const response = await fetch("http://127.0.0.1:8000/mistral-7b-v0.1", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: context,
            config: { max_new_tokens: 1280 },
            stream: false,
          }),
        });
        const generatedContent: any = await response.json();
        let presentationContent = String(generatedContent.text).trim();
        presentationContent = prepareMarpString(presentationContent, context);
        const path = `./${fileName}.md`;
        await Bun.write(path, presentationContent);
        await $`npx @marp-team/marp-cli@latest ${fileName}.md -o ${fileName}.pdf`;
        const file = Bun.file(`./${fileName}.pdf`);
        return new Response(file);
      } catch {
        console.error("Error handling incoming request:", error);
        return new Response("Internal server error.", { status: 500 });
      }
    } else {
      return new Response("This endpoint only accepts POST requests.");
    }
  },
});

function prepareMarpString(str: string, variableToRemove: string) {
  // Remove leading variable and multiple newlines
  str = str.trim();
  const variableRegex = new RegExp(`^${variableToRemove}\s*\n*`);
  str = str.replace(variableRegex, "");

  // Add Marp metadata and separator before headers (unchanged)
  const marpIntro = "---\n\nmarp: true\n\n---\n\n";
  const modifiedStr = marpIntro + str.replace(/\n\s*#/g, "\n\n---\n\n#");
  return modifiedStr;
}

console.log(`Listening on localhost:${server.port}`);
