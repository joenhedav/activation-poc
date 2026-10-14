import { Injectable } from '@nestjs/common';

@Injectable()
export class ActivationApiService {
  getHello(): string {
    return 'Hello World!';
  }
}
