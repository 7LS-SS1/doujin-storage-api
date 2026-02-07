import {
  S3Client,
  DeleteObjectCommand,
  type DeleteObjectCommandInput,
} from "@aws-sdk/client-s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.R2_REGION || "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;
const PUBLIC_BASE = process.env.R2_PUBLIC_BASE_URL!;
const PREFIX = "doujin-storage";
const PRESIGN_EXPIRY = 600; // 10 minutes

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_SIZE = 15 * 1024 * 1024; // 15MB

function randomId() {
  return Math.random().toString(36).substring(2, 10);
}

export function validateFile(contentType: string, size: number) {
  if (!ALLOWED_TYPES.includes(contentType)) {
    return `Invalid content type: ${contentType}. Allowed: ${ALLOWED_TYPES.join(", ")}`;
  }
  if (size > MAX_SIZE) {
    return `File too large: ${size} bytes. Max: ${MAX_SIZE} bytes (15MB)`;
  }
  return null;
}

function getExtension(contentType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return map[contentType] || "jpg";
}

export async function generatePresignedUrl(params: {
  contentType: string;
  targetType: "cover" | "chapterPage";
  comicSlug: string;
  chapterId?: number;
  sortOrder?: number;
}) {
  const ext = getExtension(params.contentType);
  const rid = randomId();

  let objectKey: string;
  if (params.targetType === "cover") {
    objectKey = `${PREFIX}/${params.comicSlug}/cover/${rid}.${ext}`;
  } else {
    objectKey = `${PREFIX}/${params.comicSlug}/${params.chapterId}/pages/${params.sortOrder ?? 0}-${rid}.${ext}`;
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: objectKey,
    ContentType: params.contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, {
    expiresIn: PRESIGN_EXPIRY,
  });

  const publicUrl = `${PUBLIC_BASE}/${objectKey}`;

  return { objectKey, uploadUrl, publicUrl };
}

export async function deleteR2Object(objectKey: string) {
  const input: DeleteObjectCommandInput = {
    Bucket: BUCKET,
    Key: objectKey,
  };
  await s3.send(new DeleteObjectCommand(input));
}
