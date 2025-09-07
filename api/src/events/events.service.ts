import { Injectable, MessageEvent } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';

@Injectable()
export class EventsService {
  private subject = new Subject<MessageEvent>();

  stream(): Observable<MessageEvent> {
    return this.subject.asObservable();
  }

  emit(type: string, data: any) {
    this.subject.next({ data: { type, payload: data, at: new Date().toISOString() } as any } as MessageEvent);
  }
}


