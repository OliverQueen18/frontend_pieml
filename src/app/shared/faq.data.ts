export interface FaqItem {
  question: string;
  answer: string;
  open?: boolean;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Qui peut immatriculer un engin sur PIEML ?',
    answer: 'Tout citoyen malien ou résident possédant un engin à deux roues (moto, scooter, tricycle…) peut créer un compte et déposer une demande d\'immatriculation en ligne.'
  },
  {
    question: 'Quels documents sont nécessaires ?',
    answer: 'Carte NINA, facture ou titre d\'achat, photos de l\'engin et pièces d\'identité. Certains documents complémentaires peuvent être demandés selon le type d\'engin.'
  },
  {
    question: 'Combien coûte l\'immatriculation ?',
    answer: 'Le tarif forfaitaire est de 12 000 FCFA pour tous les types d\'engins à deux roues, payable en ligne via Trésor Pay.'
  },
  {
    question: 'Comment suivre l\'avancement de mon dossier ?',
    answer: 'Connectez-vous à votre espace citoyen ou utilisez « Suivre un dossier » avec votre numéro de référence ou le QR code. Vous recevrez aussi des notifications par email.'
  },
  {
    question: 'Que faire si mon dossier est rejeté ?',
    answer: 'Consultez le motif de rejet dans le détail du dossier, corrigez les éléments signalés et soumettez à nouveau les documents requis.'
  },
  {
    question: 'Comment obtenir un rendez-vous ?',
    answer: 'Une fois votre dossier validé et le paiement confirmé, vous pourrez choisir un centre d\'immatriculation, une date et un créneau horaire depuis votre espace.'
  },
  {
    question: 'Puis-je modifier mes informations personnelles ?',
    answer: 'Oui, depuis Mon compte > Profil. Le NINA n\'est pas modifiable après inscription pour des raisons de sécurité.'
  },
  {
    question: 'Je n\'ai pas reçu mon code OTP, que faire ?',
    answer: 'Vérifiez vos spams. Sur la page de vérification, attendez l\'expiration du code puis cliquez sur « Renvoyer le code » pour en recevoir un nouveau par email.'
  }
];
