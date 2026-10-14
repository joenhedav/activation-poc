import { Injectable } from '@nestjs/common';

@Injectable()
export class ProvisioningServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
