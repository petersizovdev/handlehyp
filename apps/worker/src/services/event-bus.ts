import Redis from "ioredis";

export type EventChannel =
  | "market:update"
  | "signal:new"
  | "signal:update"
  | "execution:start"
  | "execution:result"
  | "position:update"
  | "order:update";

export interface EventBus {
  publish(
    channel: EventChannel,
    payload: unknown,
  ): Promise<void>;
  subscribe(
    channels: EventChannel[],
    handler: (
      channel: EventChannel,
      payload: unknown,
    ) => void,
  ): Promise<void>;
  disconnect(): Promise<void>;
}

export interface RedisEventBusOptions {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
}

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 6379;

export class RedisEventBus implements EventBus {
  private readonly publisher: Redis;
  private readonly subscriber: Redis;
  private connected = false;

  constructor(
    options: RedisEventBusOptions = {},
  ) {
    const config = {
      host: options.host ?? DEFAULT_HOST,
      port: options.port ?? DEFAULT_PORT,
      password: options.password,
      db: options.db ?? 0,
    };

    this.publisher = new Redis(config);
    this.subscriber = new Redis(config);

    this.subscriber.on(
      "error",
      (err: Error) => {
        console.error(
          "[event-bus] subscriber error:",
          err,
        );
      },
    );
    this.publisher.on(
      "error",
      (err: Error) => {
        console.error(
          "[event-bus] publisher error:",
          err,
        );
      },
    );
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    await Promise.all([
      this.waitForReady(this.publisher),
      this.waitForReady(
        this.subscriber,
      ),
    ]);

    this.connected = true;
  }

  async publish(
    channel: EventChannel,
    payload: unknown,
  ): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }

    await this.publisher.publish(
      channel,
      JSON.stringify(payload),
    );
  }

  async subscribe(
    channels: EventChannel[],
    handler: (
      channel: EventChannel,
      payload: unknown,
    ) => void,
  ): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }

    for (const channel of channels) {
      await this.subscriber.subscribe(
        channel,
      );
    }

    this.subscriber.on(
      "message",
      (
        channel: string,
        message: string,
      ) => {
        let payload: unknown;

        try {
          payload = JSON.parse(message);
        } catch {
          payload = message;
        }

        handler(
          channel as EventChannel,
          payload,
        );
      },
    );
  }

  async disconnect(): Promise<void> {
    this.connected = false;

    await Promise.all([
      this.publisher.quit(),
      this.subscriber.quit(),
    ]);
  }

  private waitForReady(
    instance: Redis,
  ): Promise<void> {
    return new Promise(
      (resolve, reject) => {
        if (
          instance.status === "ready"
        ) {
          resolve();
          return;
        }

        const timer = setTimeout(
          () => {
            reject(
              new Error(
                "Redis connection timed out",
              ),
            );
          },
          10_000,
        );

        instance.once(
          "ready",
          () => {
            clearTimeout(timer);
            resolve();
          },
        );

        instance.once(
          "error",
          (err: Error) => {
            clearTimeout(timer);
            reject(err);
          },
        );
      },
    );
  }
}
