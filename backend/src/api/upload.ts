import { Busboy } from "@fastify/busboy";
import { join } from "node:path";
import { Readable } from "node:stream";
import { defineAPI, dir } from "rlib/server";

export type UploadAPIResponse = { url?: string; name?: string; error?: string };

export default defineAPI({
  name: "upload",
  url: "/api/upload",
  async handler(): Promise<UploadAPIResponse> {
    const req = this.req!;
    const type = req.headers.get("content-type");
    if (!req.body || !type) {
      return { error: "No file uploaded" };
    }
    const busboy = new Busboy({
      headers: { "content-type": type },
    });
    Readable.fromWeb(req.body).pipe(busboy);

    const date = new Date();
    const yyyyMM = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const dd = `${date.getDate()}`;
    const dirname = ["_file", "upload", yyyyMM, dd];
    dir.ensure(join(process.cwd(), ...dirname));

    const upload = await new Promise<{ name: string; file: Buffer }>((done) => {
      busboy.on("file", (name, file, info) => {
        file
          .on("data", (data) => {
            // Extract extension from the original filename
            const originalFilename = info || name || "file";
            const extension = originalFilename.includes('.') ? originalFilename.split('.').pop() : '';
            const filename = extension ? `file.${extension}` : "file";
            console.log("Upload info:", { name, info, filename });
            done({ name: filename, file: data });
          })
          .on("close", () => {
            // console.log(`File [${name}] done`);
          });
      });
    });

    // Ensure proper filename with extension
    const originalName = upload.name || "file";
    const timestamp = Date.now();
    const fileName = `${timestamp}-${originalName}`;
    const file = Bun.file(join(process.cwd(), ...dirname, fileName));

    await file.write(upload.file);
    const filePath = [...dirname, fileName].join("/");
    return {
      name: fileName,
      url: "/" + filePath,
    };
  },
});
