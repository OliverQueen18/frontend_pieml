import {
  AfterViewChecked,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  inject
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ChatbotContext,
  ChatbotLink,
  ChatbotReply,
  findChatbotReply,
  getChatbotQuickPrompts,
  getChatbotWelcome,
  getCitizenRouteForFragment
} from './chatbot.data';

interface ChatMessage {
  id: number;
  role: 'bot' | 'user';
  text: string;
  links?: ChatbotLink[];
}

@Component({
  selector: 'app-pieml-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './pieml-chatbot.component.html',
  styleUrl: './pieml-chatbot.component.scss'
})
export class PiemlChatbotComponent implements AfterViewChecked {
  @ViewChild('messagesEl') messagesEl?: ElementRef<HTMLElement>;
  @ViewChild('inputEl') inputEl?: ElementRef<HTMLInputElement>;

  @Input() context: ChatbotContext = 'public';

  @Output() trackRequested = new EventEmitter<void>();
  @Output() contactRequested = new EventEmitter<void>();

  private router = inject(Router);
  private nextId = 1;
  private shouldScroll = false;

  open = false;
  draft = '';
  messages: ChatMessage[] = [];
  initialized = false;

  get quickPrompts() {
    return getChatbotQuickPrompts(this.context);
  }

  get subtitle() {
    return this.context === 'citizen'
      ? 'Aide espace citoyen'
      : 'Guide d\'immatriculation en ligne';
  }

  get inputId() {
    return this.context === 'citizen' ? 'chatbot-input-citizen' : 'chatbot-input-public';
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  toggle() {
    this.open = !this.open;
    if (this.open) {
      this.ensureWelcome();
      setTimeout(() => this.inputEl?.nativeElement.focus(), 100);
    }
  }

  close() {
    this.open = false;
  }

  onBackdropKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.close();
    }
  }

  send() {
    const text = this.draft.trim();
    if (!text) return;

    this.appendMessage('user', text);
    this.draft = '';
    this.replyTo(text);
  }

  ask(query: string) {
    this.ensureWelcome();
    this.appendMessage('user', query);
    this.replyTo(query);
  }

  followLink(link: ChatbotLink) {
    if (link.action === 'track') {
      this.trackRequested.emit();
      return;
    }
    if (link.action === 'contact') {
      if (this.context === 'citizen') {
        void this.router.navigate(['/tableau-de-bord/contact']);
        this.close();
      } else {
        this.contactRequested.emit();
      }
      return;
    }
    if (link.routerLink) {
      this.router.navigateByUrl(link.routerLink);
      this.close();
      return;
    }
    if (link.fragment) {
      this.close();
      if (this.context === 'citizen') {
        const route = getCitizenRouteForFragment(link.fragment);
        if (route) {
          void this.router.navigateByUrl(route);
        }
      } else {
        void this.router.navigate(['/'], { fragment: link.fragment });
      }
    }
  }

  private ensureWelcome() {
    if (this.initialized) return;
    this.initialized = true;
    this.appendBotReply(getChatbotWelcome(this.context));
  }

  private replyTo(query: string) {
    const reply = findChatbotReply(query, this.context);
    setTimeout(() => this.appendBotReply(reply), 280);
  }

  private appendBotReply(reply: ChatbotReply) {
    this.appendMessage('bot', reply.text, reply.links);
  }

  private appendMessage(role: 'bot' | 'user', text: string, links?: ChatbotLink[]) {
    this.messages.push({ id: this.nextId++, role, text, links });
    this.shouldScroll = true;
  }

  private scrollToBottom() {
    const el = this.messagesEl?.nativeElement;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }
}
