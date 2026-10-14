import { Injectable } from '@nestjs/common';

@Injectable()
export class BillingServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
