import { Controller, Sse, MessageEvent } from '@nestjs/common';
import { EventsService } from './events.service';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Controller()
export class EventsController {
  constructor(private events: EventsService) {}

  @Sse('events')
  eventsStream(): Observable<MessageEvent> {
    return this.events.stream();
  }
}


