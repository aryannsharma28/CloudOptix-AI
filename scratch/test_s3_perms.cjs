const { S3Client, ListBucketsCommand, CreateBucketCommand, DeleteBucketCommand } = require("@aws-sdk/client-s3");
require("dotenv").config({ path: "./.env" });

const s3 = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function test() {
  console.log("Testing S3 ListBuckets with credentials for account:", process.env.AWS_ACCOUNT_ID);
  try {
    const listRes = await s3.send(new ListBucketsCommand({}));
    console.log("ListBuckets SUCCESS! Buckets found:", listRes.Buckets?.length || 0);
    console.log("Buckets:", listRes.Buckets);
  } catch (err) {
    console.error("ListBuckets FAILED:", err.name, err.message);
  }

  // Try creating a test bucket with unique name
  const testName = `test-cloudoptix-${Date.now()}`;
  console.log("Testing CreateBucket:", testName);
  try {
    const createParams = {
      Bucket: testName,
      CreateBucketConfiguration: { LocationConstraint: "ap-south-1" }
    };
    await s3.send(new CreateBucketCommand(createParams));
    console.log("CreateBucket SUCCESS!");

    console.log("Testing DeleteBucket:", testName);
    await s3.send(new DeleteBucketCommand({ Bucket: testName }));
    console.log("DeleteBucket SUCCESS!");
  } catch (err) {
    console.error("S3 Bucket operation FAILED:", err.name, err.message);
  }
}

test();
