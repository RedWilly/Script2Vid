import serverConfig from '@/config/server-config';

// We'll use dynamic imports to prevent Node.js modules from being loaded during build time
let minioClient: any = null;

// Initialize MinIO client
const getMinioClient = async () => {
  if (minioClient) return minioClient;
  
  try {
    // Dynamically import minio only on the server
    const { Client } = await import('minio');
    
    minioClient = new Client({
      endPoint: serverConfig.s3.apiUrl.replace('https://', ''),
      port: 443,
      useSSL: true,
      accessKey: serverConfig.s3.accessKey,
      secretKey: serverConfig.s3.secretKey,
    });
    
    return minioClient;
  } catch (error) {
    console.error('Error initializing MinIO client:', error);
    throw error;
  }
};

const BUCKET_NAME = 'voiceover';
const CAPTIONS_BUCKET_NAME = 'captions';

// Create bucket if it doesn't exist
export async function ensureBucketExists() {
  try {
    const client = await getMinioClient();
    const exists = await client.bucketExists(BUCKET_NAME);
    
    if (!exists) {
      await client.makeBucket(BUCKET_NAME, 'us-east-1');
      console.log(`Bucket '${BUCKET_NAME}' created successfully`);
    }
    
    // Also ensure captions bucket exists
    const captionsBucketExists = await client.bucketExists(CAPTIONS_BUCKET_NAME);
    
    if (!captionsBucketExists) {
      await client.makeBucket(CAPTIONS_BUCKET_NAME, 'us-east-1');
      console.log(`Bucket '${CAPTIONS_BUCKET_NAME}' created successfully`);
    }
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    throw error;
  }
}

// Upload file to MinIO
export async function uploadFile(file: File): Promise<string | null> {
  try {
    // Ensure bucket exists
    await ensureBucketExists();
    
    // Generate a unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}-${file.name}`;
    
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Upload file
    const client = await getMinioClient();
    await client.putObject(
      BUCKET_NAME, 
      fileName, 
      buffer, 
      buffer.length,
      { 'Content-Type': file.type } as any // Type assertion to bypass TypeScript error
    );
    
    // Return the URL to the uploaded file
    const fileUrl = `${serverConfig.s3.apiUrl}/${BUCKET_NAME}/${fileName}`;
    console.log(`File uploaded successfully: ${fileUrl}`);
    return fileUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
}

// Upload buffer to MinIO
export async function uploadBufferToS3(
  buffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string | null> {
  try {
    // Ensure bucket exists
    await ensureBucketExists();
    
    // Upload buffer
    const client = await getMinioClient();
    await client.putObject(
      BUCKET_NAME, 
      fileName, 
      buffer, 
      buffer.length,
      { 'Content-Type': contentType } as any // Type assertion to bypass TypeScript error
    );
    
    // Return the URL to the uploaded file
    const fileUrl = `${serverConfig.s3.apiUrl}/${BUCKET_NAME}/${fileName}`;
    console.log(`Buffer uploaded successfully as ${fileName}: ${fileUrl}`);
    return fileUrl;
  } catch (error) {
    console.error('Error uploading buffer:', error);
    return null;
  }
}

// List all files in the bucket
export async function listFiles(): Promise<{ name: string; url: string; size: number; lastModified: Date }[]> {
  try {
    // Ensure bucket exists
    await ensureBucketExists();
    
    const client = await getMinioClient();
    const objectsStream = client.listObjects(BUCKET_NAME, '', true);
    const files: { name: string; url: string; size: number; lastModified: Date }[] = [];
    
    return new Promise((resolve, reject) => {
      objectsStream.on('data', (obj: any) => {
        if (obj.name) {
          files.push({
            name: obj.name,
            url: `${serverConfig.s3.apiUrl}/${BUCKET_NAME}/${obj.name}`,
            size: obj.size || 0, // Default to 0 if size is undefined
            lastModified: obj.lastModified || new Date(), // Default to current date if undefined
          });
        }
      });
      
      objectsStream.on('error', (err: Error) => {
        console.error('Error listing files:', err);
        reject(err);
      });
      
      objectsStream.on('end', () => {
        resolve(files);
      });
    });
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
}

// Delete a file from the bucket
export async function deleteFile(fileName: string): Promise<boolean> {
  try {
    const client = await getMinioClient();
    await client.removeObject(BUCKET_NAME, fileName);
    console.log(`File '${fileName}' deleted successfully`);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

// Upload caption file to S3
export async function uploadCaptionFile(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  try {
    await ensureBucketExists();
    const client = await getMinioClient();
    
    // Create a unique file name to avoid collisions
    const uniqueFileName = `${Date.now()}-${fileName}`;
    
    await client.putObject(
      CAPTIONS_BUCKET_NAME,
      uniqueFileName,
      file,
      {
        'Content-Type': contentType,
      }
    );
    
    // Generate a presigned URL for the uploaded file
    const presignedUrl = await client.presignedGetObject(
      CAPTIONS_BUCKET_NAME,
      uniqueFileName,
      24 * 60 * 60 // URL expires in 24 hours
    );
    
    return presignedUrl;
  } catch (error) {
    console.error('Error uploading caption file:', error);
    throw error;
  }
}

// List all caption files in the bucket
export async function listCaptionFiles(): Promise<{ name: string; url: string }[]> {
  try {
    await ensureBucketExists();
    const client = await getMinioClient();
    
    const objectsStream = client.listObjects(CAPTIONS_BUCKET_NAME, '', true);
    const objects: { name: string; url: string }[] = [];
    
    for await (const obj of objectsStream) {
      if (obj.name) {
        const url = await client.presignedGetObject(
          CAPTIONS_BUCKET_NAME,
          obj.name,
          24 * 60 * 60 // URL expires in 24 hours
        );
        
        objects.push({
          name: obj.name.split('-').slice(1).join('-'), // Remove timestamp prefix
          url,
        });
      }
    }
    
    return objects;
  } catch (error) {
    console.error('Error listing caption files:', error);
    throw error;
  }
}
