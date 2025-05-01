import axios from "axios";
import dotenv from "dotenv";

import crypto from "crypto"

dotenv.config(); // Load .env variables

const keyId = process.env.B2_KEY_ID;
const appKey = process.env.B2_APPLICATION_KEY;
const apiUrl = process.env.BACKBLAZE_URL

// Function to authorize with B2
export const b2 = async () => {
  try {
    const response = await axios.get(`${apiUrl}/b2_authorize_account`, {
      auth: { username: keyId, password: appKey },
    });

    return {
      apiUrl: response.data.apiUrl,
      authToken: response.data.authorizationToken,
      downloadUrl: response.data.downloadUrl,
      accountId: response.data.accountId,
    };
  } catch (error) {
    console.error("B2 Authorization Failed:", error.response?.data || error.message);
    throw error;
  }
};



export const getUploadUrl = async (bucketId) => {
    try {
      const { apiUrl, authToken } = await b2();
      const response = await axios.post(
        `${apiUrl}/b2api/v2/b2_get_upload_url`,
        { bucketId },
        {
          headers: {
            Authorization: authToken,
          },
        }
      );
  
      return response.data; // Contains upload URL and authorization token
    } catch (error) {
      console.error("Failed to get upload URL:", error.response?.data || error.message);
      throw error;
    }
  };
  


// // Signed Url Generation

// export const getSignedUrl = async (fileName, validDurationInSeconds = 270) => {
//   try {
//     const { apiUrl, authToken, downloadUrl } = await b2();

//     // Your  bucket ID and file name are required
//     const bucketId = process.env.B2_BUCKET_ID;

//     // Make the API call to get a signed URL for the file
//     const response = await axios.post(
//       `${apiUrl}/b2api/v2/b2_get_download_url`,
//       {
//         bucketId,
//         fileName,
//         expiresIn: validDurationInSeconds, // Specify expiration in seconds
//       },
//       {
//         headers: {
//           Authorization: authToken,
//         },
//       }
//     );

//     // Get the signedm Urk from the response data
//     const signedUrl = `${downloadUrl}/file/${process.env.B2_BUCKET_NAME}/${fileName}?Authorization=${response.data.authorizationToken}`;
    
//     return signedUrl;
//   } catch (error) {
//     console.error("Failed to generate signed URL:", error.response?.data || error.message);
//     throw error;    
//   }
// };



// export const getSignedUrl = (fileName, validDurationInSeconds = 270) => {
//   try {
//     const downloadUrl = process.env.B2_DOWNLOAD_URL; // e.g. https://f123.backblazeb2.com
//     const bucketName = process.env.B2_BUCKET_NAME;
//     const keyId = process.env.B2_KEY_ID; // Application Key ID
//     const appKey = process.env.B2_APPLICATION_KEY; // Application Key Secret

//     if (!downloadUrl || !bucketName || !keyId || !appKey) {
//       throw new Error("Missing B2 configuration environment variables");
//     }

//     const expires = Math.floor(Date.now() / 1000) + validDurationInSeconds;
//     const path = `/file/${bucketName}/${fileName}`;
//     const dataToSign = `${path}\n${expires}`;
//     const signature = crypto.createHmac('sha1', appKey).update(dataToSign).digest('hex');

//     const signedUrl = `${downloadUrl}${path}?Authorization=${keyId}:${signature}:${expires}`;
//     return signedUrl;
//   } catch (error) {
//     console.error("Failed to generate signed URL:", error.message);
//     throw error;
//   }
// };


// export const getSignedUrl = (fileName, validDurationInSeconds = 500) => {
//   try {
//     const downloadUrl = process.env.B2_DOWNLOAD_URL;
//     const bucketName = process.env.B2_BUCKET_NAME;
//     const keyId = process.env.B2_KEY_ID;
//     const appKey = process.env.B2_APPLICATION_KEY;

//     if (!downloadUrl || !bucketName || !keyId || !appKey) {
//       throw new Error("Missing B2 configuration environment variables");
//     }

//     const expires = Math.floor(Date.now() / 1000) + validDurationInSeconds;
//     const path = `/file/${bucketName}/${fileName}`;
//     const dataToSign = `${path}\n${expires}`;
//     const signature = crypto.createHmac('sha1', appKey).update(dataToSign).digest('hex');

//     const signedUrl = `${downloadUrl}${path}?Authorization=${keyId}:${signature}:${expires}`;
//     return signedUrl;
//   } catch (error) {
//     console.error("Failed to generate signed URL:", error.message);
//     throw error;
//   }
// };



import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl as getAwsSignedUrl } from "@aws-sdk/s3-request-presigner";
// Remove the 'crypto' import if no longer needed

// --- Keep your existing imports and setup ---

export const getSignedUrl = async (fileName, validDurationInSeconds = 3600) => { // Increased default duration
  try {
    const endpoint = process.env.B2_S3_ENDPOINT;
    const region = process.env.B2_S3_REGION;
    const bucketName = process.env.B2_BUCKET_NAME;
    const keyId = process.env.B2_KEY_ID;
    const appKey = process.env.B2_APPLICATION_KEY;

    if (!endpoint || !region || !bucketName || !keyId || !appKey) {
      console.error("Missing B2 S3 configuration environment variables");
      throw new Error("Missing B2 S3 configuration environment variables");
    }

    // Configure the S3 client to use B2's S3 endpoint
    const s3Client = new S3Client({
      endpoint: `https://${endpoint}`, // Make sure to include https://
      region: region,
      credentials: {
        accessKeyId: keyId,
        secretAccessKey: appKey,
      },
    });

    // Create the command for getting an object
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileName, // fileName should be the object key (path within the bucket)
    });

    // Generate the pre-signed URL
    const signedUrl = await getAwsSignedUrl(s3Client, command, {
      expiresIn: validDurationInSeconds, // Duration in seconds
    });

    return signedUrl;

  } catch (error) {
    console.error("Failed to generate AWS SDK signed URL for B2:", error);
    // It's often better not to throw here in production unless you handle it upstream
    // Return null or a specific error indicator might be better for the map function
    return null; // Or throw error; depending on how you want to handle failures
  }
};

