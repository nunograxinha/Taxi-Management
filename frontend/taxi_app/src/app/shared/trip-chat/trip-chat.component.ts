import {
  Component,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { Subscription } from 'rxjs';
import { ChatMessage, SocketService } from '../../appServices/socket.service';
import { AlertNotificationService } from '../../appServices/alert-notification.service';

@Component({
  selector: 'app-trip-chat',
  templateUrl: './trip-chat.component.html',
  styleUrls: ['./trip-chat.component.css']
})
export class TripChatComponent implements OnInit, OnChanges, OnDestroy {
  @Input() pedidoId: string = '';
  @Input() role: 'client' | 'driver' = 'client';
  @Input() senderName: string = '';
  @Input() counterpartName: string = '';

  @ViewChild('messagesContainer') private messagesContainer?: ElementRef<HTMLDivElement>;

  isOpen = false;
  messages: ChatMessage[] = [];
  draftMessage = '';
  unreadCount = 0;

  private subscriptions = new Subscription();
  private lastSyncedPedidoId = '';
  private initialHistoryLoaded = false;

  private readonly clientQuickReplies = [
    "I'm at the entrance",
    "I'll be right there",
    'Running 2 min late',
    'Thank you!'
  ];

  private readonly driverQuickReplies = [
    "I'm 2 min away",
    "I've arrived at pickup",
    'Stuck in traffic',
    'On my way!'
  ];

  constructor(
    private socketService: SocketService,
    private ngZone: NgZone,
    private alertService: AlertNotificationService
  ) {}

  get quickReplies(): string[] {
    return this.role === 'driver' ? this.driverQuickReplies : this.clientQuickReplies;
  }

  ngOnInit(): void {
    this.syncRoom();

    this.subscriptions.add(
      this.socketService
        .onEvent<{ pedidoId: string; messages: ChatMessage[] }>('chat:history')
        .subscribe((payload) => {
          this.ngZone.run(() => {
            if (!payload || String(payload.pedidoId) !== String(this.pedidoId)) return;
            const incoming = Array.isArray(payload.messages) ? payload.messages : [];
            const knownIds = new Set(this.messages.map((m) => m.id));
            const newForeignMessages = incoming.filter(
              (m) => !knownIds.has(m.id) && m.senderRole !== this.role
            );

            // Preserve server chronological history first, followed by any local message not yet in snapshot
            const incomingIds = new Set(incoming.map((m) => m.id));
            const localOnly = this.messages.filter((m) => !incomingIds.has(m.id));
            this.messages = [...incoming, ...localOnly];

            if (this.initialHistoryLoaded && newForeignMessages.length > 0) {
              if (!this.isOpen) {
                this.unreadCount += newForeignMessages.length;
              }
              const latest = newForeignMessages[newForeignMessages.length - 1];
              this.alertService.notify({
                title: `New message from ${latest.senderName || (latest.senderRole === 'driver' ? 'Driver' : 'Client')}`,
                body: latest.text,
                sound: 'chat',
                tag: `chat-${this.pedidoId}`
              });
            }
            this.initialHistoryLoaded = true;

            if (this.isOpen) {
              this.scrollToBottom();
            }
          });
        })
    );

    this.subscriptions.add(
      this.socketService.onEvent<ChatMessage>('chat:message').subscribe((msg) => {
        this.ngZone.run(() => {
          if (!msg || String(msg.pedidoId) !== String(this.pedidoId)) return;
          if (this.messages.some((m) => m.id === msg.id)) return;

          this.messages.push(msg);
          if (msg.senderRole !== this.role) {
            this.alertService.notify({
              title: `New message from ${msg.senderName || (msg.senderRole === 'driver' ? 'Driver' : 'Client')}`,
              body: msg.text,
              sound: 'chat',
              tag: `chat-${this.pedidoId}`
            });
          }
          if (!this.isOpen && msg.senderRole !== this.role) {
            this.unreadCount += 1;
          } else if (this.isOpen) {
            this.scrollToBottom();
          }
        });
      })
    );

    this.subscriptions.add(
      this.socketService.onEvent('connect').subscribe(() => {
        this.ngZone.run(() => {
          if (this.pedidoId) {
            this.socketService.requestChatHistory(this.pedidoId);
          }
        });
      })
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pedidoId'] && !changes['pedidoId'].firstChange) {
      this.syncRoom();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private syncRoom(): void {
    if (!this.pedidoId || String(this.pedidoId) === this.lastSyncedPedidoId) {
      return;
    }
    this.lastSyncedPedidoId = String(this.pedidoId);
    this.initialHistoryLoaded = false;
    this.messages = [];
    this.unreadCount = 0;
    this.socketService.joinPedido(this.pedidoId);
    this.socketService.requestChatHistory(this.pedidoId);
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.unreadCount = 0;
      this.scrollToBottom();
    }
  }

  sendMessage(customText?: string): void {
    const text = (customText ?? this.draftMessage).trim();
    if (!text || !this.pedidoId) return;

    this.socketService.sendChatMessage({
      pedidoId: this.pedidoId,
      senderRole: this.role,
      senderName: this.senderName || (this.role === 'driver' ? 'Driver' : 'Client'),
      text
    });

    if (customText === undefined) {
      this.draftMessage = '';
    }
    this.scrollToBottom();
  }

  trackById(_index: number, msg: ChatMessage): string {
    return msg.id;
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.messagesContainer?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }, 0);
  }
}
