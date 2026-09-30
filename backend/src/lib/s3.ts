import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const BUCKET = process.env.AWS_BUCKET_NAME ?? "scholar-flow-uploads";
const ROOT_PREFIX = process.env.S3_ROOT_PREFIX ?? "MotoServe/";

export const s3 = new S3Client({
  region: process.env.AWS_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  },
});

export function s3Key(prefix: string, userId: string, fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const uuid = crypto.randomUUID();
  return `${ROOT_PREFIX}${prefix}/${userId}/${uuid}-${safeName}`;
}

export function presignPut(key: string, contentType: string, expiresIn = 300) {
  return getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }),
    { expiresIn },
  );
}

export function presignGet(key: string, expiresIn = 900) {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn });
}

export async function putObject(key: string, body: Buffer, contentType: string) {
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType }));
}

export async function deleteObjects(keys: (string | null | undefined)[]) {
  const targets = [...new Set(keys.filter((k): k is string => typeof k === "string" && k.startsWith(ROOT_PREFIX)))];
  const failed: string[] = [];

  for (let i = 0; i < targets.length; i += 1000) {
    const batch = targets.slice(i, i + 1000);
    try {
      const result = await s3.send(
        new DeleteObjectsCommand({
          Bucket: BUCKET,
          Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
        }),
      );
      for (const err of result.Errors ?? []) {
        if (err.Key) failed.push(err.Key);
      }
    } catch (err) {
      console.warn(`S3 cleanup failed for ${batch.length} object(s):`, err instanceof Error ? err.message : err);
      failed.push(...batch);
    }
  }

  return { deleted: targets.length - failed.length, failed };
}

export { BUCKET };
