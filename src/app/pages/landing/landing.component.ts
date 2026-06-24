import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DossierService } from '../../core/dossier.service';
import { AuthService } from '../../core/auth.service';
import { AdminTariffDto, PublicStats } from '../../models';
import { StateLogoComponent } from '../../shared/state-logo.component';
import { PiemlLogoComponent } from '../../shared/pieml-logo.component';
import { TrackDossierDialogComponent } from '../../shared/track-dossier-dialog.component';
import { ContactDialogComponent } from '../../shared/contact-dialog.component';
import { FaqAccordionComponent } from '../../shared/faq-accordion.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, StateLogoComponent, PiemlLogoComponent, TrackDossierDialogComponent, ContactDialogComponent, FaqAccordionComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent implements OnInit, OnDestroy {
  @ViewChild(TrackDossierDialogComponent) trackDialog?: TrackDossierDialogComponent;
  @ViewChild(ContactDialogComponent) contactDialog?: ContactDialogComponent;

  private dossierService = inject(DossierService);
  auth = inject(AuthService);
  private heroAutoplayId?: ReturnType<typeof setInterval>;

  logoHeight = 120;
  mobileMenuOpen = false;
  currentYear = new Date().getFullYear();
  activeHeroSlide = 0;

  heroSlides = [
    {
      badge: 'Immatriculation en ligne',
      title: 'Immatriculez votre engin à deux roues',
      highlight: 'en toute simplicité',
      subtitle: 'Déposez votre dossier en ligne, payez en toute sécurité via Trésor Pay et obtenez votre rendez-vous rapidement.',
      tagline: ['Simplifier', 'Sécuriser', 'Immatriculer'],
      visual: 'image' as const,
      image: 'assets/affiche-pieml.png',
      imageAlt: 'PIEML — Immatriculez votre engin, roulez en toute légalité',
      primaryCta: { label: 'Commencer ma demande', link: '/inscription', icon: 'pi-arrow-right' },
      secondaryCta: { label: 'Suivre mon dossier', link: '/suivre-dossier' }
    },
    {
      badge: 'Sécurité publique',
      title: 'Face à l\'insécurité,',
      highlight: 'immatriculez pour mieux vous protéger',
      subtitle: 'Un engin identifié limite les vols, facilite les contrôles et renforce la confiance entre citoyens et autorités.',
      tagline: ['Traçabilité', 'Protection', 'Légalité'],
      visual: 'card' as const,
      accent: 'red',
      icon: 'pi-shield',
      cardTitle: 'Pourquoi immatriculer ?',
      cardPoints: [
        'Retrouver un engin volé plus facilement',
        'Réduire la circulation de véhicules non déclarés',
        'Rouler sereinement lors des opérations de sécurisation'
      ],
      primaryCta: { label: 'Régulariser mon engin', link: '/inscription', icon: 'pi-shield' },
      secondaryCta: { label: 'En savoir plus', link: '#securite' }
    },
    {
      badge: 'Paiement officiel',
      title: 'Payez vos frais',
      highlight: 'via Trésor Pay en toute confiance',
      subtitle: 'Réglez 12 000 FCFA en ligne — tarif unique pour tous types d\'engins — sans intermédiaire ni déplacement inutile.',
      tagline: ['Sécurisé', 'Officiel', 'Rapide'],
      visual: 'card' as const,
      accent: 'yellow',
      icon: 'pi-wallet',
      cardTitle: 'Tarif unique',
      cardPoints: [
        '12 000 FCFA — tous types d\'engins à deux roues',
        'Motos, scooters, tricycles et engins similaires',
        'Paiement confirmé instantanément via Trésor Pay'
      ],
      primaryCta: { label: 'Démarrer ma demande', link: '/inscription', icon: 'pi-credit-card' },
      secondaryCta: { label: 'Voir les tarifs', link: '#tarifs' }
    },
    {
      badge: 'Suivi & rendez-vous',
      title: 'Suivez votre dossier',
      highlight: 'jusqu\'à l\'obtention de votre plaque',
      subtitle: 'Notifications à chaque étape, prise de rendez-vous automatisée et suivi en temps réel depuis votre espace citoyen.',
      tagline: ['Notifications', 'Rendez-vous', 'Confirmation'],
      visual: 'card' as const,
      accent: 'green',
      icon: 'pi-chart-line',
      cardTitle: 'Parcours en 6 étapes',
      cardPoints: [
        'Création de compte avec vérification OTP',
        'Téléversement des documents requis',
        'Rendez-vous au centre d\'immatriculation'
      ],
      primaryCta: { label: 'Créer mon compte', link: '/inscription', icon: 'pi-user-plus' },
      secondaryCta: { label: 'Suivre un dossier', link: '/suivre-dossier' }
    }
  ];

  stats: PublicStats = {
    dossiersDeposes: 0,
    dossiersValides: 0,
    immatriculations: 0,
    satisfactionRate: 0
  };
  statsLoaded = false;

  tariffs: AdminTariffDto[] = [];
  private readonly defaultRegistrationFee = 12000;
  private readonly defaultServiceFee = 0;

  features = [
    { icon: 'pi-file-edit', color: 'green', title: 'Dépôt en ligne', desc: 'Déposez vos dossiers 24h/24 depuis votre espace citoyen' },
    { icon: 'pi-credit-card', color: 'orange', title: 'Paiement sécurisé', desc: 'Réglez vos frais via Trésor Pay en toute confiance' },
    { icon: 'pi-calendar', color: 'red', title: 'Rendez-vous automatisé', desc: 'Planifiez votre passage au centre d\'immatriculation' },
    { icon: 'pi-chart-line', color: 'blue', title: 'Suivi en temps réel', desc: 'Consultez l\'avancement de votre dossier à tout moment' },
    { icon: 'pi-bell', color: 'purple', title: 'Notifications', desc: 'Recevez des alertes par SMS et email à chaque étape' }
  ];

  steps = [
    { num: 1, icon: 'pi-user-plus', title: 'Créer un compte', desc: 'Inscription avec NINA et vérification OTP' },
    { num: 2, icon: 'pi-shield', title: 'Déclarer l\'engin', desc: 'Renseignez les informations du véhicule' },
    { num: 3, icon: 'pi-cloud-upload', title: 'Téléverser les documents', desc: 'Carte NINA, facture, photos…' },
    { num: 4, icon: 'pi-wallet', title: 'Effectuer le paiement', desc: 'Paiement sécurisé via Trésor Pay' },
    { num: 5, icon: 'pi-calendar-plus', title: 'Obtenir un rendez-vous', desc: 'Choisissez centre, date et heure' },
    { num: 6, icon: 'pi-check-circle', title: 'Immatriculation', desc: 'Présentez-vous avec vos originaux' }
  ];

  previewSteps = ['Engin', 'Documents', 'Paiement', 'Rendez-vous', 'Confirmation'];

  awarenessItems = [
    {
      icon: 'pi-verified',
      accent: 'green',
      title: 'Rouler en toute légalité',
      desc: 'Évitez les sanctions, les saisies et les complications lors des contrôles routiers et des opérations de sécurisation.'
    },
    {
      icon: 'pi-search',
      accent: 'yellow',
      title: 'Identifier rapidement un engin',
      desc: 'La plaque d\'immatriculation permet aux forces de l\'ordre de vérifier la propriété et de retrouver un engin volé ou utilisé à mauvais escient.'
    },
    {
      icon: 'pi-lock',
      accent: 'red',
      title: 'Réduire le vol et la revente illicite',
      desc: 'Un engin enregistré est moins attractif pour les réseaux criminels et limite la circulation de véhicules non déclarés.'
    },
    {
      icon: 'pi-users',
      accent: 'navy',
      title: 'Protéger les citoyens',
      desc: 'L\'immatriculation sécurise votre investissement et facilite les démarches en cas de perte, de vol ou de litige.'
    },
    {
      icon: 'pi-map',
      accent: 'green',
      title: 'Contribuer à la sécurité publique',
      desc: 'Chaque engin déclaré renforce la traçabilité des véhicules et aide l\'État à mieux lutter contre l\'insécurité.'
    },
    {
      icon: 'pi-check-circle',
      accent: 'yellow',
      title: 'Un parcours simple et accessible',
      desc: 'Avec PIEML, déposez votre dossier en ligne, payez via Trésor Pay et obtenez votre rendez-vous sans vous déplacer inutilement.'
    }
  ];

  ngOnInit() {
    this.loadStats();
    this.dossierService.getPublicTariffs().subscribe({
      next: res => {
        if (res.data?.length) {
          this.tariffs = res.data;
          this.applyTariffsToHero();
        }
      },
      error: () => {}
    });
    this.heroAutoplayId = setInterval(() => this.nextHeroSlide(), 7000);
  }

  get registrationFee(): number {
    const reg = this.tariffs.find(t => t.code === 'REGISTRATION');
    return reg?.amount ?? this.defaultRegistrationFee;
  }

  get serviceFee(): number {
    const reg = this.tariffs.find(t => t.code === 'REGISTRATION');
    return reg?.serviceFee ?? this.defaultServiceFee;
  }

  get totalFee(): number {
    return this.registrationFee + this.serviceFee;
  }

  get displayTariffs(): AdminTariffDto[] {
    const sorted = [...this.tariffs].sort((a, b) => a.ordre - b.ordre);
    if (sorted.some(t => t.code === 'REGISTRATION')) {
      return sorted.filter(t => t.code !== 'SERVICE');
    }
    return sorted;
  }

  private loadStats() {
    this.dossierService.getPublicStats().subscribe({
      next: res => {
        if (res.success && res.data) {
          this.stats = res.data;
        }
        this.statsLoaded = true;
      },
      error: () => {
        this.statsLoaded = true;
      }
    });
  }

  private applyTariffsToHero() {
    const feeLabel = `${this.totalFee.toLocaleString('fr-FR')} FCFA`;
    const slide = this.heroSlides[2];
    slide.subtitle = `Réglez ${feeLabel} en ligne — tarif unique pour tous types d'engins — sans intermédiaire ni déplacement inutile.`;
    if (slide.cardPoints?.length) {
      slide.cardPoints[0] = `${feeLabel} — tous types d'engins à deux roues`;
    }
  }

  ngOnDestroy() {
    if (this.heroAutoplayId) clearInterval(this.heroAutoplayId);
  }

  get currentHeroSlide() {
    return this.heroSlides[this.activeHeroSlide];
  }

  goToHeroSlide(index: number) {
    this.activeHeroSlide = index;
  }

  nextHeroSlide() {
    this.activeHeroSlide = (this.activeHeroSlide + 1) % this.heroSlides.length;
  }

  prevHeroSlide() {
    this.activeHeroSlide = (this.activeHeroSlide - 1 + this.heroSlides.length) % this.heroSlides.length;
  }

  isAnchorLink(link: string): boolean {
    return link.startsWith('#');
  }

  isTrackLink(link: string): boolean {
    return link === '/suivre-dossier';
  }

  openTrackDialog() {
    this.mobileMenuOpen = false;
    this.trackDialog?.open();
  }

  openContactDialog() {
    this.mobileMenuOpen = false;
    this.contactDialog?.open();
  }

  logout() {
    this.mobileMenuOpen = false;
    this.auth.logout();
  }
}
