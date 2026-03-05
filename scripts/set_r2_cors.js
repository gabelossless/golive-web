const { S3Client, PutBucketCorsCommand } = require("@aws-sdk/client-s3");

const R2_ACCOUNT_ID = "233bc538f73403cc7a658941e7cfab88";
const R2_ACCESS_KEY_ID = "b18aac9338768806542dc69c3346953b";
const R2_SECRET_ACCESS_KEY = "9f86843592b540de8d69a356fb7859f9d03f6d9ebb4ab163551a6ec6132719b3";
const R2_BUCKET_NAME = "golive-media";

const client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

async function setCors() {
    const corsParams = {
        Bucket: R2_BUCKET_NAME,
        CORSConfiguration: {
            CORSRules: [
                {
                    AllowedHeaders: ["*"],
                    AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
                    AllowedOrigins: ["*"],
                    ExposeHeaders: ["ETag"],
                    MaxAgeSeconds: 3000
                },
            ],
        },
    };

    try {
        const data = await client.send(new PutBucketCorsCommand(corsParams));
        console.log("Success: CORS policy updated", data);
    } catch (err) {
        console.error("Error setting CORS:", err);
    }
}

setCors();
