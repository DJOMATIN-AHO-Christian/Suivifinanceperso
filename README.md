# Suivi Finance Perso · Dashboard Patrimonial & Budgétaire

[![PWA Ready](https://img.shields.io/badge/PWA-Ready-34d399.svg)](#installation-mobile-pwa)
[![License: MIT](https://img.shields.io/badge/License-MIT-38bdf8.svg)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero%20(Vanilla%20JS)-a78bfa.svg)](#architecture)

Dashboard financier interactif, moderne et autonome sous forme de **Progressive Web App (PWA)**, avec gestion de budget base zéro, analyse patrimoniale, simulations d'indépendance financière (FIRE) et synchronisation Google Sheets optionnelle.

---

## Sommaire

1. [Fonctionnalités Principales](#fonctionnalités-principales)
2. [Sécurité & Confidentialité des Données](#sécurité--confidentialité-des-données)
3. [Déploiement en 1 Clic (Production)](#déploiement-en-1-clic-production)
   - [Option A : Déploiement sur Netlify](#option-a--déploiement-sur-netlify-recommandé)
   - [Option B : Déploiement sur Vercel](#option-b--déploiement-sur-vercel)
   - [Option C : Déploiement sur GitHub Pages](#option-c--déploiement-sur-github-pages)
4. [Installation sur Smartphone (PWA)](#installation-sur-smartphone-pwa)
5. [Configuration du Cloud Google Sheets](#configuration-du-cloud-google-sheets-optionnel)
6. [Importation de Relevés Bancaires (CSV)](#importation-de-relevés-bancaires-csv)
7. [Structure des Fichiers](#structure-des-fichiers)

---

## Fonctionnalités Principales

- **Score de Santé Financière (0-100)** : Évaluation dynamique en temps réel basée sur 6 piliers (taux d'épargne, fonds de sécurité, endettement, diversification des actifs, objectifs SMART et discipline budgétaire).
- **Budget Base Zéro (ZBB) & 4 Enveloppes** : Répartition rigoureuse des revenus (Fixe Essentiel, Variable / Plaisir, Futur / Épargne & Investissement, Non Alloué).
- **Strates de Dépenses (N1 à N4)** : Priorisation du vital au superflu (N1 Survie, N2 Essentiel incompressible, N3 Confort, N4 Luxe).
- **Épargne de Précaution en 3 Paliers** : Objectifs dynamiques calculés automatiquement selon vos dépenses incompressibles (Palier 1 : Urgence 48h, Palier 2 : Sérénité 1 à 3 mois, Palier 3 : Forteresse 3 à 6 mois).
- **Simulations d'Investissement Avancées** :
  - Simulateur DCA (Dollar-Cost Averaging) et calcul d'intérêts composés.
  - **Simulation stochastique de Monte Carlo** (150 scénarios aléatoires modélisant la volatilité des marchés).
  - Portefeuille d'actifs réels (Euronext, Wall Street, BRVM, Crypto, Immobilier) avec stress-tests (-30% krach ou +18% bull run).
- **Indépendance Financière (FIRE)** : Calcul dynamique du « Nombre FIRE » (Règle des 4%), Lean FIRE, Fat FIRE et projection d'âge de départ en rente.
- **Multi-Devises Réel** : Conversion dynamique instantanée entre **EUR (€), USD ($), FCFA (XOF/XAF), GBP (£) et CHF** avec actualisation automatique via l'API publique `open.er-api.com`.
- **Importateur Universel CSV Bancaire** : Glissez-déposez n'importe quel relevé de compte bancaire pour catégoriser automatiquement vos dépenses.
- **Mode Sombre & Mode Clair** : Palette HSL soignée, typographies fluides (Google Sans, Inter), ergonomie pensée pour l'usage quotidien.
- **Portail de Connexion Sécurisé & Verrouillage Biométrique (WebAuthn)** :
  - Déverrouillage par **empreinte digitale / Passkey** de votre PC (Windows Hello, Touch ID sur Mac) ou de votre téléphone (capteur d'empreinte Android, Face ID).
  - Code PIN de secours (4 à 6 chiffres) avec hachage cryptographique local SHA-256 et pavé numérique tactile.
  - Verrouillage automatique configurable (immédiat, après 1, 5, 15 min ou au masquage de l'onglet).

---

## Sécurité & Confidentialité des Données

> [!IMPORTANT]
> **Vos données financières restent strictement chez vous.**
> - Aucune base de données centrale : vos données sont enregistrées localement dans le `localStorage` de votre navigateur.
> - Aucune donnée n'est transmise à des tiers, sauf si vous choisissez de connecter **votre propre Google Sheet privé** via Google Apps Script.
> - L'application fonctionne à 100% hors-ligne grâce à son Service Worker intégré.

---

## Déploiement en 1 Clic (Production)

L'application est entièrement statique. Elle ne requiert aucun serveur Node.js, PHP ou base de données.

### Option A : Déploiement sur Netlify (Recommandé)

1. Rendez-vous sur [Netlify Drop](https://app.netlify.com/drop).
2. Glissez-déposez l'intégralité du dossier `SuiviPatrimoine` dans la zone de dépôt.
3. Votre site est instantanément en ligne avec un lien HTTPS sécurisé !
*(Le fichier [`netlify.toml`](netlify.toml) configure automatiquement les en-têtes de sécurité et les redirections).*

### Option B : Déploiement sur Vercel

1. Installez le CLI Vercel (`npm i -g vercel`) ou importez le dépôt Git sur [vercel.com](https://vercel.com).
2. Le fichier [`vercel.json`](vercel.json) inclus prend en charge l'ensemble de la configuration sans aucune action requise.

### Option C : Déploiement sur GitHub Pages

1. Poussez le dossier sur un dépôt GitHub public ou privé.
2. Allez dans **Settings > Pages**.
3. Dans **Build and deployment > Branch**, sélectionnez la branche `main` et le dossier `/ (root)`, puis cliquez sur **Save**.

---

## Installation sur Smartphone (PWA)

Vous pouvez installer cette application comme une application native sur votre téléphone :

### Sur iPhone / iPad (Safari) :
1. Ouvrez l'URL de votre application déployée dans **Safari**.
2. Appuyez sur l'icône de **Partage** (le rectangle avec la flèche vers le haut).
3. Faites défiler et appuyez sur **Sur l'écran d'accueil**.
4. L'application apparaît sur votre écran d'accueil avec son icône dédiée et s'ouvre en plein écran sans barre d'adresse.

### Sur Android (Chrome) :
1. Ouvrez l'URL dans **Google Chrome**.
2. Appuyez sur le menu (les 3 points en haut à droite).
3. Appuyez sur **Installer l'application** (ou **Ajouter à l'écran d'accueil**).

---

## Configuration du Cloud Google Sheets (Optionnel)

Pour conserver un historique mensuel et synchroniser vos données entre plusieurs appareils sans serveur payant :

1. Ouvrez [Google Sheets](https://sheets.new) et créez un nouveau classeur (ex: `Mon Suivi Patrimoine`).
2. Dans la barre de menus, cliquez sur **Extensions > Apps Script**.
3. Supprimez le code existant et collez l'intégralité du contenu du fichier [`google-apps-script.js`](google-apps-script.js).
4. Enregistrez avec `Ctrl + S`.
5. Cliquez sur le bouton bleu **Déployer > Nouveau déploiement** :
   - Cliquez sur l'engrenage à gauche de "Sélectionner un type" et choisissez **Application Web**.
   - *Description* : `API Suivi Patrimoine`.
   - *Exécuter en tant que* : **Moi (votre adresse Gmail)**.
   - *Qui a accès* : **Tous les utilisateurs (Anyone)**.
6. Cliquez sur **Déployer**, autorisez les accès Google demandés, puis **copiez l'URL de l'application Web** (`https://script.google.com/macros/s/.../exec`).
7. Ouvrez votre application `SuiviPatrimoine`, cliquez sur le bouton **Google Sheets**, collez l'URL et cliquez sur **Enregistrer l'URL**.

---

## Importation de Relevés Bancaires (CSV)

Pour importer vos dépenses sans saisie manuelle :
1. Téléchargez votre relevé d'opérations au format CSV depuis votre banque en ligne (Boursorama, BNP, Société Générale, Revolut, etc.).
2. Dans le tableau mensuel de l'application, cliquez sur **Importer CSV bancaire** et sélectionnez votre fichier.
3. L'algorithme détecte automatiquement les colonnes (Date, Libellé, Montant) et applique une catégorisation automatique intelligente (Logement, Courses, Loisirs, Transport, Santé, Salaires).

---

## Structure des Fichiers

```
SuiviPatrimoine/
├── index.html                  # Application complète (HTML5, CSS3, JS Vanilla)
├── manifest.webmanifest        # Manifeste PWA pour installation mobile & desktop
├── sw.js                       # Service Worker (fonctionnement hors-ligne)
├── netlify.toml                # Configuration de déploiement & sécurité Netlify
├── vercel.json                 # Configuration de déploiement Vercel
├── google-apps-script.js       # Script backend pour Google Sheets
├── GUIDE_AMELIORATIONS_ET_APIS.md # Guide stratégique des améliorations & APIs
├── icons/                      # Icônes de l'application
│   ├── icon.svg                # Icône vectorielle haute fidélité
│   ├── icon-192.png            # Icône mobile 192x192
│   └── icon-512.png            # Icône HD 512x512
└── README.md                   # Documentation complète
```
