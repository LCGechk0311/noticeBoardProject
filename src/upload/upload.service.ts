import { Injectable, Logger } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private s3: AWS.S3;
  private readonly logger = new Logger(UploadService.name);
  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY,
      region: process.env.AWS_DEFAULT_REGION,
    });
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    this.logger.log('Uploading file to S3');
    try {
      const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `sub/${Date.now()}_${file.originalname}`,
        Body: file.buffer,
        ACL: 'public-read',
      };
      this.logger.log(`Upload Params: ${JSON.stringify(uploadParams)}`);
      const uploadResult = await this.s3.upload(uploadParams).promise();
      this.logger.log('File uploaded successfully', uploadResult);
      return uploadResult.Location;
    } catch (error) {
      console.log(3);
      console.log(error);
      throw error;
    }
  }
}
