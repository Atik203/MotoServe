import { presignGet, presignPut, s3Key } from "../../lib/s3.js";

export interface PresignUploadResult {
  uploadUrl: string;
  key: string;
  getUrl: string | null;
}

export async function presignDocumentUpload(userId: string, fileName: string, fileType: string): Promise<PresignUploadResult> {
  return presignUpload("docs", userId, fileName, fileType);
}

export async function presignImageUpload(userId: string, fileName: string, fileType: string): Promise<PresignUploadResult> {
  return presignUpload("images", userId, fileName, fileType);
}

async function presignUpload(prefix: string, userId: string, fileName: string, fileType: string): Promise<PresignUploadResult> {
  const key = s3Key(prefix, userId, fileName);
  const uploadUrl = await presignPut(key, fileType);
  return { uploadUrl, key, getUrl: null };
}

export function presignRead(key: string) {
  return presignGet(key);
}
