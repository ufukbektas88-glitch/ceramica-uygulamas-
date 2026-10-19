import { previewImport, ImportedProduct } from "./importer";
import { PrismaPg } from "@prisma/adapter-pg";
import "reflect-metadata";
import { NestFactory, Reflector } from "@nestjs/core";
import {
  Module,
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  Res,
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  NotFoundException,
  SetMetadata,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import {
  SwaggerModule,
  DocumentBuilder,
  ApiProperty,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { ThrottlerModule, ThrottlerGuard, Throttle } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { PrismaClient, Prisma, Role, OrderStatus } from "@prisma/client";
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsNumber,
  IsIn,
} from "class-validator";
import { Type } from "class-transformer";
import { randomBytes, createHash, randomUUID } from "node:crypto";
import { compare } from "bcryptjs";
import helmet from "helmet";
import { NestExpressApplication } from "@nestjs/platform-express";
import Decimal from "decimal.js";
import { calculate } from "./calculator";
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const hash = (v: string) => createHash("sha256").update(v).digest("hex");
const Public = () => SetMetadata("public", true);
const Roles = (...roles: Role[]) => SetMetadata("roles", roles);
@Injectable()
class Auth implements CanActivate {
  constructor(private reflector: Reflector) {}
  async canActivate(ctx: ExecutionContext) {
    if (this.reflector.get("public", ctx.getHandler())) return true;
    const req = ctx.switchToHttp().getRequest();
    const token =
      req.headers.authorization?.replace(/^Bearer /, "") ||
      req.headers.cookie
        ?.split("; ")
        .find((s: string) => s.startsWith("ceramica_session="))
        ?.split("=")[1];
    if (!token) throw new UnauthorizedException();
    const session = await db.session.findUnique({
      where: { tokenHash: hash(token) },
      include: { user: true },
    });
    if (!session || session.expiresAt < new Date())
      throw new UnauthorizedException();
    req.user = session.user;
    req.sessionId = session.id;
    const roles = this.reflector.get<Role[]>("roles", ctx.getHandler());
    if (roles && !roles.includes(session.user.role))
      throw new ForbiddenException();
    return true;
  }
}
class LoginDto {
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty() @IsString() @MinLength(12) @MaxLength(128) password!: string;
}
class CalcDto {
  @ApiProperty() @IsNumber() @Min(0.0001) @Max(1000000) area!: number;
  @ApiProperty() @IsNumber() @Min(0) @Max(100) waste!: number;
  @ApiProperty() @IsUUID() productId!: string;
}
class ItemDto {
  @ApiProperty() @IsUUID() productId!: string;
  @ApiProperty() @IsInt() @Min(1) @Max(100000) boxes!: number;
}
class OrderDto {
  @ApiProperty({ type: [ItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items!: ItemDto[];
  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  deliveryAddress!: string;
  @ApiProperty() @IsUUID() idempotencyKey!: string;
}
class StatusDto {
  @ApiProperty()
  @IsIn(["CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"])
  status!: OrderStatus;
}
class ImportDto {
  @ApiProperty() @IsIn(["Graniser", "Duratiles"]) brand!: string;
  @ApiProperty() @IsIn(["csv", "xlsx"]) format!: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(1000000) content!: string;
  @ApiProperty() @IsString() @MinLength(5) @MaxLength(200) source!: string;
}
@ApiBearerAuth()
@Controller("api/v1")
@UseGuards(Auth)
class Api {
  @Get("health") @Public() async health() {
    await db.$queryRaw`SELECT 1`;
    return { status: "ok", service: "ceramica-api" };
  }
  @Post("auth/login")
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login(@Body() input: LoginDto, @Res({ passthrough: true }) res: any) {
    const user = await db.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });
    if (!user || !(await compare(input.password, user.passwordHash)))
      throw new UnauthorizedException("E-posta veya parola hatalı");
    const token = randomBytes(32).toString("hex");
    await db.session.create({
      data: {
        userId: user.id,
        tokenHash: hash(token),
        expiresAt: new Date(Date.now() + 8 * 3600000),
      },
    });
    res.cookie("ceramica_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 8 * 3600000,
      path: "/",
    });
    return { token, user: { id: user.id, name: user.name, role: user.role } };
  }
  @Get("auth/me") me(@Req() req: any) {
    return { id: req.user.id, name: req.user.name, role: req.user.role };
  }
  @Post("auth/logout") async logout(
    @Req() req: any,
    @Res({ passthrough: true }) res: any,
  ) {
    await db.session.delete({ where: { id: req.sessionId } });
    res.clearCookie("ceramica_session", { path: "/" });
    return { ok: true };
  }
  @Get("products") @Public() async products(
    @Query("q") q = "",
    @Query("brand") brand = "",
    @Query("page") page = "1",
  ) {
    const n = Number(page);
    if (!Number.isInteger(n) || n < 1)
      throw new BadRequestException("Geçersiz sayfa");
    const where: Prisma.ProductWhereInput = {
      active: true,
      ...(brand ? { brand: { name: brand } } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { sku: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          brand: true,
          lots: { select: { physical: true, reserved: true } },
        },
        take: 24,
        skip: (n - 1) * 24,
        orderBy: { name: "asc" },
      }),
      db.product.count({ where }),
    ]);
    return {
      items: items.map(({ lots, ...p }) => ({
        ...p,
        availableBoxes: lots.reduce((s, l) => s + l.physical - l.reserved, 0),
      })),
      total,
      page: n,
    };
  }
  @Post("calculator") @Public() async calculator(@Body() data: CalcDto) {
    const p = await db.product.findUnique({ where: { id: data.productId } });
    if (!p || !p.active) throw new NotFoundException();
    return calculate(
      data.area,
      data.waste,
      p.boxArea.toString(),
      p.price.toString(),
      p.vatRate.toString(),
    );
  }
  @Get("orders") async orders(@Req() req: any) {
    return db.order.findMany({
      where: req.user.role === "CUSTOMER" ? { userId: req.user.id } : {},
      include: { items: true, history: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }
  @Post("orders") async order(@Body() data: OrderDto, @Req() req: any) {
    if (new Set(data.items.map((i) => i.productId)).size !== data.items.length)
      throw new BadRequestException("Aynı ürünü tek satırda gönderin");
    try {
      return await db.$transaction(
        async (tx) => {
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${req.user.id + ":" + data.idempotencyKey},0))`;
          const existing = await tx.order.findUnique({
            where: {
              userId_idempotencyKey: {
                userId: req.user.id,
                idempotencyKey: data.idempotencyKey,
              },
            },
            include: { items: true },
          });
          if (existing) return existing;
          let subtotal = new Decimal(0),
            tax = new Decimal(0);
          const rows: any[] = [];
          for (const item of [...data.items].sort((a, b) =>
            a.productId.localeCompare(b.productId),
          )) {
            const p = await tx.product.findUnique({
              where: { id: item.productId },
            });
            if (!p?.active)
              throw new BadRequestException("Ürün satışa açık değil");
            const lots = await tx.$queryRaw<
              any[]
            >`SELECT * FROM "InventoryLot" WHERE "productId"=${p.id} ORDER BY id FOR UPDATE`;
            const lot = lots.find((l) => l.physical - l.reserved >= item.boxes);
            if (!lot)
              throw new ConflictException(
                "Aynı parti/ton için yeterli stok yok",
              );
            await tx.inventoryLot.update({
              where: { id: lot.id },
              data: { reserved: { increment: item.boxes } },
            });
            const area = new Decimal(p.boxArea.toString()).mul(item.boxes),
              sub = area.mul(p.price.toString()).toDecimalPlaces(2),
              t = sub.mul(p.vatRate.toString()).div(100).toDecimalPlaces(2);
            subtotal = subtotal.plus(sub);
            tax = tax.plus(t);
            rows.push({
              productId: p.id,
              sku: p.sku,
              name: p.name,
              boxes: item.boxes,
              area: area.toFixed(4),
              unitPrice: p.price,
              vatRate: p.vatRate,
              subtotal: sub.toFixed(2),
              tax: t.toFixed(2),
              total: sub.plus(t).toFixed(2),
              lotId: lot.id,
            });
          }
          const order = await tx.order.create({
            data: {
              number: "CER-" + randomUUID().toUpperCase(),
              userId: req.user.id,
              idempotencyKey: data.idempotencyKey,
              deliveryAddress: data.deliveryAddress,
              subtotal: subtotal.toFixed(2),
              tax: tax.toFixed(2),
              total: subtotal.plus(tax).toFixed(2),
              items: { create: rows },
              history: { create: { status: "RECEIVED", actorId: req.user.id } },
            },
            include: { items: true },
          });
          await tx.auditLog.create({
            data: {
              actorId: req.user.id,
              action: "ORDER_CREATED",
              entityId: order.id,
              data: { total: order.total.toString() },
            },
          });
          return order;
        },
        { timeout: 15000 },
      );
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        const existing = await db.order.findUnique({
          where: {
            userId_idempotencyKey: {
              userId: req.user.id,
              idempotencyKey: data.idempotencyKey,
            },
          },
          include: { items: true },
        });
        if (existing) return existing;
      }
      throw e;
    }
  }
  @Patch("orders/:id/status")
  @Roles("ADMIN", "SALES", "WAREHOUSE")
  async status(
    @Param("id") id: string,
    @Body() input: StatusDto,
    @Req() req: any,
  ) {
    return db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Order" WHERE id=${id} FOR UPDATE`;
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!order) throw new NotFoundException();
      const flow: Record<string, string[]> = {
        RECEIVED: ["CONFIRMED", "CANCELLED"],
        CONFIRMED: ["PREPARING", "CANCELLED"],
        PREPARING: ["SHIPPED", "CANCELLED"],
        SHIPPED: ["DELIVERED"],
        DELIVERED: [],
        CANCELLED: [],
      };
      if (
        req.user.role === "WAREHOUSE" &&
        !["PREPARING", "SHIPPED", "DELIVERED"].includes(input.status)
      )
        throw new ForbiddenException();
      if (!flow[order.status].includes(input.status))
        throw new ConflictException("Geçersiz durum geçişi");
      if (["CANCELLED", "SHIPPED"].includes(input.status))
        for (const item of [...order.items].sort((a, b) =>
          a.lotId.localeCompare(b.lotId),
        )) {
          await tx.inventoryLot.update({
            where: { id: item.lotId },
            data: {
              reserved: { decrement: item.boxes },
              ...(input.status === "SHIPPED"
                ? { physical: { decrement: item.boxes } }
                : {}),
            },
          });
        }
      await tx.orderStatusHistory.create({
        data: { orderId: id, status: input.status, actorId: req.user.id },
      });
      await tx.auditLog.create({
        data: {
          actorId: req.user.id,
          action: "ORDER_STATUS",
          entityId: id,
          data: { from: order.status, to: input.status },
        },
      });
      return tx.order.update({ where: { id }, data: { status: input.status } });
    });
  }
  @Post("imports/preview") @Roles("ADMIN") async preview(
    @Body() input: ImportDto,
    @Req() req: any,
  ) {
    let rows: ImportedProduct[];
    try {
      rows = await previewImport(input.brand, input.format, input.content);
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }
    return db.importJob.create({
      data: {
        brand: input.brand,
        source: input.source,
        data: rows,
        actorId: req.user.id,
      },
    });
  }
  @Get("imports") @Roles("ADMIN") imports() {
    return db.importJob.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  }
  @Post("imports/:id/approve") @Roles("ADMIN") async approve(
    @Param("id") id: string,
    @Req() req: any,
  ) {
    return db.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM "ImportJob" WHERE id=${id} FOR UPDATE`;
        const job = await tx.importJob.findUnique({ where: { id } });
        if (!job) throw new NotFoundException();
        if (job.status === "APPROVED") return job;
        const brand = await tx.brand.upsert({
          where: { name: job.brand },
          update: {},
          create: { name: job.brand },
        });
        for (const row of job.data as unknown as ImportedProduct[]) {
          const old = await tx.product.findUnique({ where: { sku: row.sku } });
          if (old && old.brandId !== brand.id)
            throw new ConflictException(
              "SKU başka bir üreticiye ait: " + row.sku,
            );
          await tx.product.upsert({
            where: { sku: row.sku },
            update: { ...row, demo: false },
            create: { ...row, brandId: brand.id, demo: false },
          });
          await tx.auditLog.create({
            data: {
              actorId: req.user.id,
              action: "PRODUCT_IMPORTED",
              entityId: row.sku,
              data: {
                importId: job.id,
                previous: old ? JSON.parse(JSON.stringify(old)) : null,
                next: row,
              },
            },
          });
        }
        return tx.importJob.update({
          where: { id },
          data: { status: "APPROVED", approvedAt: new Date() },
        });
      },
      { timeout: 30000 },
    );
  }
  @Get("inventory") @Roles("ADMIN", "SALES", "WAREHOUSE") inventory() {
    return db.inventoryLot.findMany({
      include: { product: true, warehouse: true },
    });
  }
  @Get("dashboard") @Roles("ADMIN", "SALES", "FINANCE") async dashboard() {
    const orders = await db.order.findMany({
      where: { status: { not: "CANCELLED" } },
      select: { total: true, subtotal: true, status: true, createdAt: true },
    });
    return {
      orderCount: orders.length,
      revenue: orders
        .reduce((s, o) => s.plus(o.total.toString()), new Decimal(0))
        .toFixed(2),
      netRevenue: orders
        .reduce((s, o) => s.plus(o.subtotal.toString()), new Decimal(0))
        .toFixed(2),
      openCount: orders.filter((o) => o.status !== "DELIVERED").length,
      demo: true,
    };
  }
}
@Module({
  imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }])],
  controllers: [Api],
  providers: [Auth, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
class App {}
async function main() {
  const app = await NestFactory.create<NestExpressApplication>(App);
  app.use(helmet());
  app.useBodyParser("json", { limit: "2mb" });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const doc = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle("CERAMICA API")
      .setVersion("1.0")
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup("api/docs", app, doc);
  await app.listen(Number(process.env.PORT || 4000), "0.0.0.0");
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
