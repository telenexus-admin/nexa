import type { EventBus } from "./ports.js";
import type { EventHandler, NexaEvent } from "./events.js";

export class InMemoryEventBus implements EventBus {
  private readonly handlers = new Map<NexaEvent["name"], EventHandler[]>();

  subscribe(eventName: NexaEvent["name"], handler: EventHandler): void {
    const handlers = this.handlers.get(eventName) ?? [];
    handlers.push(handler);
    this.handlers.set(eventName, handlers);
  }

  async publish(event: NexaEvent): Promise<void> {
    const handlers = this.handlers.get(event.name) ?? [];
    await Promise.all(handlers.map((handler) => handler(event)));
  }
}
