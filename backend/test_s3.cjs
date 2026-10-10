const { S3Client, ListBucketsCommand, CreateBucketCommand, DeleteBucketCommand, PutBucketVersioningCommand } = require("@aws-sdk/client-s3");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const s3 = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function test() {
  console.log("=== AWS S3 PERMISSION AUDIT ===");
  console.log("AccessKey:", process.env.AWS_ACCESS_KEY_ID);
  console.log("Region:", process.env.AWS_REGION || "ap-south-1");

  // 1. List Buckets
  try {
    const listRes = await s3.send(new ListBucketsCommand({}));
    console.log("1. ListBuckets: SUCCESS! Active buckets count:", listRes.Buckets?.length || 0);
    if (listRes.Buckets && listRes.Buckets.length > 0) {
      console.log("   Existing buckets:", listRes.Buckets.map(b => b.Name));
    }
  } catch (err) {
    console.error("1. ListBuckets: FAILED ->", err.name, ":", err.message);
  }

  // 2. Create Bucket
  const testBucketName = `cloudoptix-test-${Date.now()}`;
  try {
    const createParams = {
      Bucket: testBucketName,
      CreateBucketConfiguration: { LocationConstraint: "ap-south-1" }
    };
    await s3.send(new CreateBucketCommand(createParams));
    console.log("2. CreateBucket: SUCCESS -> Created bucket:", testBucketName);

    // 3. Edit / PutBucketVersioning
    try {
      await s3.send(new PutBucketVersioningCommand({
        Bucket: testBucketName,
        VersioningConfiguration: { Status: "Enabled" }
      }));
      console.log("3. Configure Bucket (Versioning): SUCCESS!");
    } catch (vErr) {
      console.error("3. Configure Bucket (Versioning): FAILED ->", vErr.name, ":", vErr.message);
    }

    // 4. Delete Bucket
    try {
      await s3.send(new DeleteBucketCommand({ Bucket: testBucketName }));
      console.log("4. DeleteBucket: SUCCESS -> Deleted bucket:", testBucketName);
    } catch (dErr) {
      console.error("4. DeleteBucket: FAILED ->", dErr.name, ":", dErr.message);
    }
  } catch (err) {
    console.error("2. CreateBucket: FAILED ->", err.name, ":", err.message);
  }
}

test();
