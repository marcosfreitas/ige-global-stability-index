import { ValidateComposeSpecService } from '@/core/compose/services/validate-compose-spec.service';
import { ORDER_TTL_SECONDS } from '@/config/limits';
import type { IOrderRepository, IPixProvider } from '../contracts';
import type { Order, PixCharge } from '../entities/order';

export interface CreateOrderInput {
  userId: string;
  photoKey: string;
  amountCents: number;
  spec: { cargo: unknown; numero: unknown; nome?: unknown; frameId: unknown };
}

export interface CreateOrderResult {
  order: Order;
  charge: PixCharge;
}

export class CreateOrderService {
  constructor(
    private readonly orders: IOrderRepository,
    private readonly pix: IPixProvider,
    private readonly validateSpec = new ValidateComposeSpecService()
  ) {}

  async execute(input: CreateOrderInput): Promise<CreateOrderResult> {
    const spec = this.validateSpec.execute(input.spec);

    const charge = await this.pix.createCharge({
      amountCents: input.amountCents,
      expiresInSeconds: ORDER_TTL_SECONDS,
      reference: `Moldura VOTEI`,
    });

    const order = await this.orders.create({
      userId: input.userId,
      amountCents: input.amountCents,
      txid: charge.txid,
      spec,
      photoKey: input.photoKey,
      expiresAt: charge.expiresAt,
    });

    return { order, charge };
  }
}
