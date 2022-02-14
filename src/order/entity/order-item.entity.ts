import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Order } from './order.entity';

@Entity({ name: 'order_items' })
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  product_title: string;

  @Column({
    type: 'double precision',

    scale: 2,

    default: 0.0,
  })
  price: number;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({
    type: 'double precision',

    scale: 2,

    default: 0.0,
  })
  admin_revenue: number;

  @Column({
    type: 'double precision',

    scale: 2,

    default: 0.0,
  })
  ambassador_revenue: number;

  @ManyToOne(() => Order, (order) => order.order_items)
  @JoinColumn({ name: 'order_id' })
  order: Order;
}
