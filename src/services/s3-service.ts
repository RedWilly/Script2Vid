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

// Create bucket if it doesn't exist
export async function ensureBucketExists() {
  try {
    const client = await getMinioClient();
    const exists = await client.bucketExists(BUCKET_NAME);
    
    if (!exists) {
      await client.makeBucket(BUCKET_NAME, 'us-east-1');
      
      // Set bucket policy to allow public read access
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
          },
        ],
      };
      
      await client.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
      console.log(`Bucket '${BUCKET_NAME}' created with public read policy`);
    }
    return true;
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    return false;
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
