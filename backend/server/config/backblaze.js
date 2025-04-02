import axios from "axios";
import dotenv from "dotenv";

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
  



