import multer from "multer"
import dotenv from "dotenv"

dotenv.config();
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 9 * 1024 * 1024 }, // Max 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'image/jpeg', 'image/png'];
    
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only MP3, WAV, JPEG, and PNG files are allowed!'), false);
    }
    
    cb(null, true);
  },
});

// export default upload;

// export const upload = multer({ storage: multer.memoryStorage() })

// export const uploadB2 = async (req, res, next) => {
//   const b2 = new B2({
//     applicationKeyId: process.env.KEY_ID, // or accountId: 'accountId'
//     applicationKey: process.env.APPLICATION_KEY // or masterApplicationKey
//   });

//   const authResponse = await b2.authorize();
//   console.log(authResponse.data)

//   next;
// }


