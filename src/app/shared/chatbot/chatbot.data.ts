import { FAQ_ITEMS } from '../faq.data';

export type ChatbotContext = 'public' | 'citizen';

export interface ChatbotLink {
  label: string;
  routerLink?: string;
  fragment?: string;
  action?: 'track' | 'contact';
}

export interface ChatbotReply {
  text: string;
  links?: ChatbotLink[];
}

export interface ChatbotKnowledgeEntry {
  keywords: string[];
  reply: ChatbotReply;
}

export const CHATBOT_WELCOME: ChatbotReply = {
  text: 'Bonjour ! Je suis l\'assistant PIEML. Je peux vous guider pour immatriculer votre engin, comprendre les étapes du parcours ou répondre à vos questions fréquentes.',
  links: [
    { label: 'Créer un compte', routerLink: '/inscription' },
    { label: 'Suivre un dossier', action: 'track' }
  ]
};

export const CHATBOT_QUICK_PROMPTS: { label: string; query: string }[] = [
  { label: 'Comment déposer un dossier ?', query: 'comment déposer un dossier immatriculation' },
  { label: 'Documents requis', query: 'quels documents sont nécessaires' },
  { label: 'Tarifs et paiement', query: 'combien coûte l immatriculation paiement' },
  { label: 'Suivre mon dossier', query: 'comment suivre mon dossier' },
  { label: 'Prendre rendez-vous', query: 'comment obtenir un rendez-vous' }
];

export const CHATBOT_CITIZEN_WELCOME: ChatbotReply = {
  text: 'Bonjour ! Je suis votre assistant dans l\'espace citoyen. Je peux vous guider pour créer une demande, téléverser vos documents, payer, prendre rendez-vous ou suivre l\'avancement de vos dossiers.',
  links: [
    { label: 'Nouvelle demande', routerLink: '/tableau-de-bord/nouvelle-demande' },
    { label: 'Mes demandes', routerLink: '/tableau-de-bord' }
  ]
};

export const CHATBOT_CITIZEN_QUICK_PROMPTS: { label: string; query: string }[] = [
  { label: 'Créer une nouvelle demande', query: 'comment créer une nouvelle demande' },
  { label: 'Où en est mon dossier ?', query: 'comment voir le statut de mon dossier' },
  { label: 'Téléverser des documents', query: 'comment téléverser mes documents' },
  { label: 'Payer et prendre RDV', query: 'comment payer et prendre rendez-vous' },
  { label: 'Modifier mon profil', query: 'comment modifier mon profil réclamation' }
];

const CITIZEN_GUIDE_ENTRIES: ChatbotKnowledgeEntry[] = [
  {
    keywords: ['tableau', 'bord', 'accueil', 'mes demandes', 'liste', 'dossiers'],
    reply: {
      text: 'Depuis le tableau de bord, consultez la liste de vos demandes d\'immatriculation. Cliquez sur un dossier pour voir son statut, les documents, le paiement et le rendez-vous.',
      links: [
        { label: 'Tableau de bord', routerLink: '/tableau-de-bord' },
        { label: 'Nouvelle demande', routerLink: '/tableau-de-bord/nouvelle-demande' }
      ]
    }
  },
  {
    keywords: ['nouvelle', 'demande', 'creer', 'créer', 'wizard', 'formulaire', 'declarer', 'déclarer'],
    reply: {
      text: 'Pour déposer une nouvelle demande : menu « Nouvelle demande », renseignez les informations de l\'engin (marque, modèle, cylindrée, n° châssis…), puis poursuivez les étapes documents et paiement.',
      links: [{ label: 'Nouvelle demande', routerLink: '/tableau-de-bord/nouvelle-demande' }]
    }
  },
  {
    keywords: ['statut', 'avancement', 'etape', 'étape', 'ou en est', 'progression', 'detail', 'détail'],
    reply: {
      text: 'Ouvrez votre dossier depuis « Mes demandes » pour voir chaque étape : déclaration, documents, paiement, validation, rendez-vous et immatriculation. Le statut et les actions possibles s\'affichent en haut de la page.',
      links: [{ label: 'Mes demandes', routerLink: '/tableau-de-bord' }]
    }
  },
  {
    keywords: ['notification', 'alerte', 'email', 'sms', 'message'],
    reply: {
      text: 'PIEML vous envoie des notifications par email à chaque changement important (validation, rejet, paiement, rendez-vous). Consultez aussi le détail du dossier pour l\'historique des actions.',
      links: [{ label: 'Mes demandes', routerLink: '/tableau-de-bord' }]
    }
  },
  {
    keywords: ['mot de passe', 'password', 'securite', 'sécurité', 'changer', 'connexion'],
    reply: {
      text: 'Pour modifier votre mot de passe, allez dans Mon compte > Sécurité. Utilisez un mot de passe fort et ne le partagez avec personne.',
      links: [{ label: 'Sécurité', routerLink: '/tableau-de-bord/securite' }]
    }
  },
  {
    keywords: ['faq', 'question', 'aide'],
    reply: {
      text: 'La FAQ de l\'espace citoyen répond aux questions les plus courantes sur l\'immatriculation, les documents et le suivi des dossiers.',
      links: [
        { label: 'Consulter la FAQ', routerLink: '/tableau-de-bord/faq' },
        { label: 'Nous contacter', routerLink: '/tableau-de-bord/contact' }
      ]
    }
  },
  {
    keywords: ['suivre', 'suivi', 'reference', 'référence', 'qr', 'numero', 'numéro'],
    reply: {
      text: 'Retrouvez vos dossiers dans « Mes demandes » ou ouvrez le détail d\'un dossier pour suivre chaque étape. Vous pouvez aussi utiliser « Suivre un dossier » avec un numéro de référence ou un QR code.',
      links: [
        { label: 'Mes demandes', routerLink: '/tableau-de-bord' },
        { label: 'Suivre un dossier', action: 'track' }
      ]
    }
  },
  {
    keywords: ['document', 'piece', 'pièce', 'pieces', 'pièces', 'televerser', 'téléverser', 'upload', 'fichier', 'carte nina', 'facture', 'photo'],
    reply: {
      text: 'Dans votre dossier ou lors de la « Nouvelle demande », téléversez les pièces demandées (carte NINA, facture, photos…). Formats acceptés : PDF, JPG ou PNG. Les documents validés apparaissent avec une coche verte.',
      links: [
        { label: 'Mes demandes', routerLink: '/tableau-de-bord' },
        { label: 'Nouvelle demande', routerLink: '/tableau-de-bord/nouvelle-demande' }
      ]
    }
  },
  {
    keywords: ['tarif', 'prix', 'cout', 'coût', 'fcfa', 'payer', 'paiement', 'tresor', 'trésor', 'pay', 'frais'],
    reply: {
      text: 'Le tarif forfaitaire est de 12 000 FCFA. Depuis le détail de votre dossier, accédez à l\'étape paiement et réglez via Trésor Pay. Le dossier pourra ensuite être validé et vous pourrez prendre rendez-vous.',
      links: [{ label: 'Mes demandes', routerLink: '/tableau-de-bord' }]
    }
  },
  {
    keywords: ['rendez', 'rdv', 'centre', 'creneau', 'créneau', 'convocation', 'immatriculation'],
    reply: {
      text: 'Une fois votre dossier validé et le paiement confirmé, ouvrez le détail du dossier pour choisir un centre, une date et un créneau. Présentez-vous avec vos documents originaux le jour du rendez-vous.',
      links: [{ label: 'Mes demandes', routerLink: '/tableau-de-bord' }]
    }
  },
  {
    keywords: ['rejet', 'rejete', 'rejeté', 'refus', 'corriger', 'correction', 'motif'],
    reply: {
      text: 'Si un document ou le dossier est rejeté, ouvrez le détail pour lire le motif, corrigez les éléments signalés et soumettez à nouveau les pièces requises.',
      links: [{ label: 'Mes demandes', routerLink: '/tableau-de-bord' }]
    }
  },
  {
    keywords: ['profil', 'modifier', 'information', 'reclamation', 'réclamation', 'adresse', 'telephone', 'téléphone', 'nina'],
    reply: {
      text: 'Votre profil est en lecture seule. Pour modifier une information (adresse, téléphone…), déposez une réclamation avec justificatif depuis Mon compte > Profil. Le NINA n\'est pas modifiable directement.',
      links: [{ label: 'Mon profil', routerLink: '/tableau-de-bord/profil' }]
    }
  },
  {
    keywords: ['contact', 'support', 'humain', 'agent', 'assistance'],
    reply: {
      text: 'Pour une question personnalisée, utilisez le formulaire de contact de votre espace citoyen. Décrivez votre situation et notre équipe vous répondra.',
      links: [{ label: 'Nous contacter', routerLink: '/tableau-de-bord/contact' }]
    }
  },
  {
    keywords: ['parcours', 'etape', 'étapes', 'procedure', 'procédure', 'demarrer', 'déposer', 'dossier', 'immatriculer', 'commencer'],
    reply: {
      text: 'Dans votre espace : 1) Nouvelle demande pour déclarer l\'engin, 2) Téléverser les documents, 3) Payer via Trésor Pay, 4) Attendre la validation, 5) Prendre rendez-vous, 6) Présenter-vous au centre avec vos originaux.',
      links: [
        { label: 'Nouvelle demande', routerLink: '/tableau-de-bord/nouvelle-demande' },
        { label: 'Mes demandes', routerLink: '/tableau-de-bord' }
      ]
    }
  }
];

const GUIDE_ENTRIES: ChatbotKnowledgeEntry[] = [
  {
    keywords: ['bonjour', 'salut', 'hello', 'bonsoir', 'coucou', 'aide'],
    reply: {
      text: 'Bonjour ! Choisissez une question ci-dessous ou décrivez ce que vous souhaitez faire sur PIEML.',
      links: [
        { label: 'Voir la procédure', fragment: 'procedure' },
        { label: 'Questions fréquentes', fragment: 'faq' }
      ]
    }
  },
  {
    keywords: ['parcours', 'etape', 'etapes', 'procedure', 'comment ca marche', 'demarrer', 'deposer', 'dossier', 'demande', 'immatriculer', 'commencer'],
    reply: {
      text: 'Le parcours PIEML comporte 6 étapes : 1) Créer un compte (NINA + OTP), 2) Déclarer l\'engin, 3) Téléverser les documents, 4) Payer via Trésor Pay, 5) Choisir un rendez-vous au centre, 6) Présenter-vous avec vos originaux pour l\'immatriculation.',
      links: [
        { label: 'Créer un compte', routerLink: '/inscription' },
        { label: 'Voir la procédure', fragment: 'procedure' }
      ]
    }
  },
  {
    keywords: ['compte', 'inscription', 'inscrire', 'creer', 'otp', 'verifier', 'verif', 'email'],
    reply: {
      text: 'Pour vous inscrire, cliquez sur « Créer un compte », renseignez vos informations (dont le NINA) puis validez le code OTP reçu par email. Si le code n\'arrive pas, vérifiez vos spams et utilisez « Renvoyer le code » après expiration.',
      links: [
        { label: 'S\'inscrire', routerLink: '/inscription' },
        { label: 'Se connecter', routerLink: '/connexion' }
      ]
    }
  },
  {
    keywords: ['connecter', 'connexion', 'login', 'mot de passe', 'password', 'oublie'],
    reply: {
      text: 'Si vous avez déjà un compte, connectez-vous avec votre email et mot de passe. En cas d\'oubli de mot de passe, utilisez la récupération depuis la page de connexion.',
      links: [{ label: 'Se connecter', routerLink: '/connexion' }]
    }
  },
  {
    keywords: ['document', 'piece', 'pieces', 'nina', 'facture', 'photo', 'televerser', 'upload', 'fichier'],
    reply: {
      text: 'Les documents habituellement requis : carte NINA, facture ou titre d\'achat, photos de l\'engin et pièce d\'identité. Des pièces complémentaires peuvent être demandées selon le type d\'engin. Formats acceptés : PDF, JPG ou PNG.',
      links: [{ label: 'Démarrer ma demande', routerLink: '/inscription' }]
    }
  },
  {
    keywords: ['tarif', 'prix', 'cout', 'coût', 'fcfa', 'payer', 'paiement', 'tresor', 'trésor', 'pay', 'frais', '12000'],
    reply: {
      text: 'Le tarif forfaitaire est de 12 000 FCFA pour tous les engins à deux roues (motos, scooters, tricycles…). Le paiement s\'effectue en ligne via Trésor Pay, de manière sécurisée et officielle.',
      links: [
        { label: 'Voir les tarifs', fragment: 'tarifs' },
        { label: 'Créer un compte', routerLink: '/inscription' }
      ]
    }
  },
  {
    keywords: ['suivre', 'suivi', 'avancement', 'statut', 'reference', 'qr', 'numero', 'numéro', 'dossier'],
    reply: {
      text: 'Pour suivre votre dossier, connectez-vous à votre espace citoyen ou utilisez « Suivre un dossier » avec votre numéro de référence ou le QR code. Vous recevrez aussi des notifications par email à chaque étape.',
      links: [
        { label: 'Suivre un dossier', action: 'track' },
        { label: 'Se connecter', routerLink: '/connexion' }
      ]
    }
  },
  {
    keywords: ['rendez', 'rdv', 'centre', 'immatriculation', 'creneau', 'créneau', 'convocation'],
    reply: {
      text: 'Après validation de votre dossier et confirmation du paiement, vous pourrez choisir un centre d\'immatriculation, une date et un créneau depuis votre espace citoyen. Présentez-vous avec vos documents originaux le jour du rendez-vous.',
      links: [{ label: 'Mon espace', routerLink: '/connexion' }]
    }
  },
  {
    keywords: ['rejet', 'rejete', 'rejeté', 'refus', 'corriger', 'correction', 'motif'],
    reply: {
      text: 'Si votre dossier est rejeté, consultez le motif dans le détail du dossier, corrigez les éléments signalés et soumettez à nouveau les documents requis depuis votre espace citoyen.',
      links: [{ label: 'Se connecter', routerLink: '/connexion' }]
    }
  },
  {
    keywords: ['profil', 'modifier', 'information', 'reclamation', 'réclamation', 'nina', 'adresse', 'telephone', 'téléphone'],
    reply: {
      text: 'Vos informations de profil sont consultables depuis Mon compte. Pour modifier une donnée (hors mot de passe), déposez une réclamation avec justificatif depuis la page Profil. Le NINA n\'est pas modifiable directement pour des raisons de sécurité.',
      links: [{ label: 'Se connecter', routerLink: '/connexion' }]
    }
  },
  {
    keywords: ['securite', 'sécurité', 'vol', 'plaque', 'legal', 'légal', 'controle', 'contrôle'],
    reply: {
      text: 'Immatriculer votre engin renforce votre sécurité : identification en cas de vol, conformité lors des contrôles et protection de votre investissement. PIEML permet de régulariser votre situation simplement en ligne.',
      links: [{ label: 'En savoir plus', fragment: 'securite' }]
    }
  },
  {
    keywords: ['contact', 'support', 'humain', 'agent', 'assistance', 'telephone', 'téléphone', 'email', 'mail'],
    reply: {
      text: 'Pour une question non couverte ici, notre équipe peut vous répondre via le formulaire de contact. Décrivez votre situation et nous vous recontacterons.',
      links: [{ label: 'Nous contacter', action: 'contact' }]
    }
  },
  {
    keywords: ['merci', 'thanks', 'parfait', 'super', 'ok'],
    reply: {
      text: 'Avec plaisir ! N\'hésitez pas si vous avez d\'autres questions sur PIEML.',
      links: [{ label: 'Créer un compte', routerLink: '/inscription' }]
    }
  }
];

const FAQ_ENTRIES: ChatbotKnowledgeEntry[] = FAQ_ITEMS.map(item => ({
  keywords: tokenize(item.question + ' ' + item.answer),
  reply: { text: item.answer }
}));

const CHATBOT_FALLBACK: ChatbotReply = {
  text: 'Je n\'ai pas trouvé de réponse précise à votre question. Consultez la FAQ ou contactez-nous — un agent pourra vous aider.',
  links: [
    { label: 'Voir la FAQ', fragment: 'faq' },
    { label: 'Nous contacter', action: 'contact' }
  ]
};

const CHATBOT_CITIZEN_FALLBACK: ChatbotReply = {
  text: 'Je n\'ai pas trouvé de réponse précise. Consultez la FAQ de votre espace ou contactez le support — nous vous aiderons.',
  links: [
    { label: 'FAQ', routerLink: '/tableau-de-bord/faq' },
    { label: 'Nous contacter', routerLink: '/tableau-de-bord/contact' }
  ]
};

const CITIZEN_LINK_REMAP: Record<string, string> = {
  '/inscription': '/tableau-de-bord/nouvelle-demande',
  '/connexion': '/tableau-de-bord'
};

const CITIZEN_LABEL_REMAP: Record<string, string> = {
  'Créer un compte': 'Nouvelle demande',
  'S\'inscrire': 'Nouvelle demande',
  'Démarrer ma demande': 'Nouvelle demande',
  'Se connecter': 'Mes demandes',
  'Mon espace': 'Tableau de bord'
};

const CITIZEN_FRAGMENT_ROUTES: Record<string, string> = {
  procedure: '/tableau-de-bord/nouvelle-demande',
  faq: '/tableau-de-bord/faq',
  tarifs: '/tableau-de-bord/faq',
  securite: '/tableau-de-bord/faq'
};

function entriesForContext(context: ChatbotContext): ChatbotKnowledgeEntry[] {
  if (context === 'citizen') {
    return [...CITIZEN_GUIDE_ENTRIES, ...GUIDE_ENTRIES, ...FAQ_ENTRIES];
  }
  return [...GUIDE_ENTRIES, ...FAQ_ENTRIES];
}

export function getChatbotWelcome(context: ChatbotContext): ChatbotReply {
  return context === 'citizen' ? CHATBOT_CITIZEN_WELCOME : CHATBOT_WELCOME;
}

export function getChatbotQuickPrompts(context: ChatbotContext): { label: string; query: string }[] {
  return context === 'citizen' ? CHATBOT_CITIZEN_QUICK_PROMPTS : CHATBOT_QUICK_PROMPTS;
}

export function getCitizenRouteForFragment(fragment: string): string | null {
  return CITIZEN_FRAGMENT_ROUTES[fragment] ?? null;
}

function adaptReplyForContext(reply: ChatbotReply, context: ChatbotContext): ChatbotReply {
  if (context === 'public') {
    return reply;
  }

  return {
    text: reply.text,
    links: reply.links?.map(link => {
      if (link.routerLink && CITIZEN_LINK_REMAP[link.routerLink]) {
        return {
          ...link,
          routerLink: CITIZEN_LINK_REMAP[link.routerLink],
          label: CITIZEN_LABEL_REMAP[link.label] ?? link.label
        };
      }
      if (link.fragment) {
        const route = CITIZEN_FRAGMENT_ROUTES[link.fragment];
        if (route) {
          return { label: link.label, routerLink: route };
        }
      }
      if (link.action === 'contact') {
        return { label: link.label, routerLink: '/tableau-de-bord/contact' };
      }
      if (link.label && CITIZEN_LABEL_REMAP[link.label] && link.routerLink) {
        return { ...link, label: CITIZEN_LABEL_REMAP[link.label] };
      }
      return link;
    })
  };
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string): string[] {
  const stop = new Set(['qui', 'que', 'quoi', 'comment', 'pour', 'les', 'des', 'une', 'mon', 'mes', 'sur', 'est', 'sont', 'peut', 'puis', 'avec', 'dans', 'pas', 'fait', 'faire', 'vous', 'votre', 'vos']);
  return normalize(text)
    .split(' ')
    .filter(w => w.length > 2 && !stop.has(w));
}

function scoreQuery(query: string, keywords: string[]): number {
  const tokens = tokenize(query);
  if (!tokens.length) return 0;

  let score = 0;
  const normalizedQuery = normalize(query);

  for (const keyword of keywords) {
    if (normalizedQuery.includes(keyword)) {
      score += keyword.length > 5 ? 3 : 2;
    }
  }

  for (const token of tokens) {
    if (keywords.some(k => k.includes(token) || token.includes(k))) {
      score += 1;
    }
  }

  return score;
}

export function findChatbotReply(query: string, context: ChatbotContext = 'public'): ChatbotReply {
  const trimmed = query.trim();
  if (!trimmed) {
    return getChatbotWelcome(context);
  }

  let best: ChatbotKnowledgeEntry | null = null;
  let bestScore = 0;

  for (const entry of entriesForContext(context)) {
    const score = scoreQuery(trimmed, entry.keywords);
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  if (best && bestScore >= 2) {
    return adaptReplyForContext(best.reply, context);
  }

  const fallback = context === 'citizen' ? CHATBOT_CITIZEN_FALLBACK : CHATBOT_FALLBACK;
  return adaptReplyForContext(fallback, context);
}
