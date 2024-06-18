import { Injectable, Logger } from '@nestjs/common';
import * as AWS from 'aws-sdk';

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
    try {
      const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `sub/${Date.now()}_${file.originalname}`,
        Body: file.buffer,
        ACL: 'public-read',
      };
      const uploadResult = await this.s3.upload(uploadParams).promise();
      return uploadResult.Location;
    } catch (error) {
      throw error;
    }
  }
}
