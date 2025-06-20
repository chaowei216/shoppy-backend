import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateSessionRequest } from './dto/create-session.request';
import { CheckoutService } from './checkout.service';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutSerive: CheckoutService) {}

  @Post('session')
  @UseGuards(JwtAuthGuard)
  async createSession(@Body() request: CreateSessionRequest) {
    return this.checkoutSerive.createSession(request.productId);
  }

  @Post('webhook')
  async handleCheckoutWebhooks(@Body() event: any) {
    return this.checkoutSerive.handleCheckoutWebhook(event);
  }
}
