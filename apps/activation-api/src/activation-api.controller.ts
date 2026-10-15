import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ActivationApiService } from './activation-api.service';
import { CreateActivationDto } from './dto/create-activation.dto';

@Controller('activations')
export class ActivationApiController {
  constructor(private readonly service: ActivationApiService) {}

  /** RF-02: responde 202 con el activationId y PENDING, sin esperar a los demás servicios. */
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  create(@Body() dto: CreateActivationDto) {
    return this.service.create(dto);
  }

  /** RF-09: estado actual e historial de eventos. */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
