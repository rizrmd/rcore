import { join } from "node:path";
import { URLSearchParams } from "node:url";
import { defineAPI } from "rlib/server";
import sharp from "sharp";

export default defineAPI({
  name: "files",
  url: "/_file/upload/*",
  async handler(): Promise<Response> {
    const req = this.req!;
    let path = req.url.split("?")[0];
    const qs = !req.url.split("?")[1] ? "" : "?" + req.url.split("?")[1];
    const fileName = path!.split("/_file/upload/").slice(1).join("/");
    const fileExtension = fileName.split(".").pop();

    const isImage =
      fileExtension === "jpg" ||
      fileExtension === "jpeg" ||
      fileExtension === "png" ||
      fileExtension === "gif" ||
      fileExtension === "webp";

    path = join(
      process.cwd(),
      "_file/upload",
      ...path!.split("/_file/upload/").slice(1)
    );
    let bunFile = Bun.file(path);

    if (!(await bunFile.exists())) {
      if (isImage) {
        const prodPath =
          "https://esensi.online/_img/upload/" +
          req.url.split("/_file/upload/").slice(1).join("/");

        try {
          const resp = await fetch(prodPath, { method: "HEAD" });
          if (resp.ok) return Response.redirect(prodPath);
        } catch (error) {
          console.error("Failed to fetch production image:", error);
        }

        return new Response("Not Found", { status: 404 });
      } else {
        const prodPath =
          "https://esensi.online/_file/upload/" +
          req.url.split("/_file/upload/").slice(1).join("/");

        try {
          const resp = await fetch(prodPath, { method: "HEAD" });
          if (resp.ok) return Response.redirect(prodPath);
        } catch (error) {
          console.error("Failed to fetch production image:", error);
        }

        return new Response("Not Found", { status: 404 });
      }
    } else {
      if (isImage) {
        const params = new URLSearchParams(qs);
        const width = params.get("w");
        const height = params.get("h");
        let resize: Record<string, string | number> = {};
        if (!!params.get("w")) if (!!width) resize.width = parseInt(width!);
        if (!!height) resize.height = parseInt(height!);

        try {
          // Check if we actually need to resize
          const hasResizeParams = width || height;

          if (!hasResizeParams) {
            // No resize needed, serve original file
            return new Response(bunFile, {
              headers: {
                "Content-Type": `image/${
                  fileExtension === "jpg" ? "jpeg" : fileExtension
                }`,
                "Cache-Control": "public, max-age=31536000",
              },
            });
          }

          // Try to get metadata first
          let metadata;
          try {
            metadata = await sharp(path).metadata();
          } catch (metadataError) {
            console.warn(
              "Could not read image metadata, serving original:",
              path
            );
            return new Response(bunFile, {
              headers: {
                "Content-Type": `image/${
                  fileExtension === "jpg" ? "jpeg" : fileExtension
                }`,
                "Cache-Control": "public, max-age=31536000",
              },
            });
          }

          // Try different approaches based on file type
          let processedImage;
          if (fileExtension === "png") {
            // For PNG files, try a more lenient approach
            try {
              processedImage = await sharp(path, {
                failOnError: false,
                limitInputPixels: false,
              })
                .resize(resize)
                .png({ compressionLevel: 6, progressive: false })
                .toBuffer();
            } catch (pngError) {
              console.warn(
                "PNG processing failed, trying JPEG conversion:",
                path
              );
              // Try converting to JPEG as fallback
              processedImage = await sharp(path, {
                failOnError: false,
                limitInputPixels: false,
              })
                .resize(resize)
                .jpeg({ quality: 85 })
                .toBuffer();

              return new Response(processedImage, {
                headers: {
                  "Content-Type": "image/jpeg",
                  "Cache-Control": "public, max-age=31536000",
                },
              });
            }
          } else {
            // For other formats, use standard processing
            processedImage = await sharp(path).resize(resize).toBuffer();
          }

          // Set appropriate content-type header
          const contentType =
            metadata.format === "jpeg"
              ? "image/jpeg"
              : metadata.format === "png"
              ? "image/png"
              : metadata.format === "gif"
              ? "image/gif"
              : metadata.format === "webp"
              ? "image/webp"
              : "image/jpeg"; // fallback

          return new Response(processedImage, {
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "public, max-age=31536000",
            },
          });
        } catch (error) {
          console.error("Sharp image processing error:", error);
          console.error("Failed to process image:", path);

          // Try to serve the original file without processing
          try {
            return new Response(bunFile, {
              headers: {
                "Content-Type": `image/${
                  fileExtension === "jpg" ? "jpeg" : fileExtension
                }`,
                "Cache-Control": "public, max-age=31536000",
              },
            });
          } catch (fallbackError) {
            console.error("Failed to serve original file:", fallbackError);
            return new Response("Image processing failed", { status: 500 });
          }
        }
      } else {
        // Non-image files
        return new Response(bunFile, {
          headers: {
            "Cache-Control": "public, max-age=31536000",
          },
        });
      }
    }
  },
});
