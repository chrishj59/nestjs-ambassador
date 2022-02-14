import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { client } from '../../main';
import { Order } from '../entity/order.entity';

@Injectable()
export class OrderListener {
  constructor(private mailerService: MailerService) {}
  @OnEvent('order.completed')
  async handleOrderCompletedEvent(order: Order) {
    console.log('called listener');
    client.zIncrBy('rankings', order.ambassador_revenue, order.name);
    console.log('after zincrBy line 14');
    await this.mailerService.sendMail({
      to: 'admin@admin.com',
      subject: 'An order has been completed',
      html: `Order #${order.id} with a total of $${order.total} has been completed!`,
    });

    await this.mailerService.sendMail({
      to: order.ambassador_email,
      subject: 'An order has been completed',
      html: `You earned $${order.ambassador_revenue} from the link #${order.code}`,
    });

    console.log('after sendmail');
  }
}
