# Application de Gestion d'Œuvre Sociale (CSE)

Application SaaS complète pour la gestion des demandes d'aide sociale d'un CSE (Comité Social et Économique). Développée avec React (TypeScript) et Node.js (Express).

## 📋 Table des matières
- [Fonctionnalités](#-fonctionnalités)
- [Stack Technique](#-stack-technique)
- [Installation](#-installation)
- [Variables d'environnement](#-variables-denvironnement)
- [Endpoints API](#-endpoints-api)
- [Sécurité](#-sécurité)
- [Structure du projet](#-structure-du-projet)
- [Comptes de test](#-comptes-de-test)
- [Auteur](#-auteur)

## Fonctionnalités

### Authentification & Rôles
- Login sécurisé avec email/mot de passe
- 3 rôles distincts : ADMIN, MANAGER, BENEFICIARY
- JWT pour l'authentification
- RBAC strict côté backend

### Gestion des demandes
- Création de demandes d'aide (BENEFICIARY)
- Workflow complet : DRAFT → SUBMITTED → APPROVED/REJECTED → PAID
- Validation des transitions d'état
- Une demande soumise n'est plus modifiable
- Filtrage automatique selon le rôle

### Gestion budgétaire
- Budget annuel configurable
- Décrémentation automatique lors des paiements
- Blocage si budget insuffisant
- Vue admin du budget et des paiements en attente

### Audit & Sécurité
- Audit log de toutes les actions critiques
- Validation des entrées (express-validator)
- Protection contre les accès non autorisés
- Traçabilité complète (qui, quoi, quand)

## Stack Technique

### Backend
- **Runtime** : Node.js
- **Framework** : Express.js
- **Langage** : TypeScript
- **Base de données** : PostgreSQL
- **Authentification** : JWT + bcrypt
- **Validation** : express-validator
- **Sécurité** : Helmet, CORS

### Frontend
- **Framework** : React 18
- **Langage** : TypeScript
- **UI Library** : Material-UI (MUI) v5
- **État** : Context API
- **Routing** : React Router v6
- **HTTP Client** : Axios

## Installation

### Prérequis
- Node.js 
- PostgreSQL 
- npm 

1. Cloner le projet
git clone https://github.com/votre-utilisateur/cse-management-app.git
cd cse-management-app
2. Configuration de la base de données
# Créer la base de données
psql -U postgres -c "CREATE DATABASE cse_management;"

# Exécuter le script SQL
psql -U postgres -d cse_management -f database/schema.sql

3. Backend
cd backend
npm install
cp .env.example .env
# Éditer .env avec vos informations
npm run dev

4. Frontend
cd frontend
npm install
cp .env.example .env
# Éditer .env avec l'URL du backend
npm start

5. Accès
Frontend : http://localhost:3000
Backend API : http://localhost:5000/api
Health check : http://localhost:5000/api/health

Variables d'environnement
Backend (.env)
env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=cse_management
DB_USER=postgres
DB_PASSWORD=postgres

JWT_SECRET=secret_jwt_tres_long_et_securise_123456789
JWT_EXPIRES_IN=7d

Frontend (.env)
REACT_APP_API_URL=http://localhost:5000/api
Endpoints API

Authentification
POST	/api/auth/login	Connexion	Public

Demandes
GET	/api/requests	Liste des demandes	
GET	/api/requests/:id	Détail d'une demande	
POST	/api/requests	Créer une demande	BENEFICIARY
PUT	/api/requests/:id	Modifier une demande	BENEFICIARY (DRAFT)
PUT	/api/requests/:id/submit	Soumettre une demande	BENEFICIARY
PUT	/api/requests/:id/status	Changer statut	MANAGER/ADMIN
DELETE	/api/requests/:id	Supprimer une demande	Propriétaire ou ADMIN

Budget
GET	/api/budget/current	Budget année courante	MANAGER/ADMIN
GET	/api/budget/:year	Budget par année	ADMIN
PUT	/api/budget/:year	Mettre à jour budget	ADMIN
GET	/api/budget/history	Historique	ADMIN

Sécurité
1. Authentification
✅ Mots de passe hashés avec bcrypt (10 rounds)
✅ Tokens JWT avec expiration (7 jours)
✅ Stockage sécurisé des secrets en variables d'environnement

2. Autorisation (RBAC)
✅ Vérification des rôles sur chaque endpoint
✅ Middleware d'autorisation centralisé
✅ Contrôle d'accès aux ressources (propriétaire uniquement)

3. Validation des données
✅ Validation des entrées avec express-validator
✅ Sanitization des données utilisateur
✅ Protection contre les injections SQL

4. Workflow sécurisé
✅ Transitions d'état contrôlées
✅ Vérification du budget avant approbation
✅ Impossibilité de modifier une demande soumise

5. Audit & Traçabilité
✅ Audit log de toutes les actions critiques
✅ Enregistrement de l'utilisateur, l'action, la ressource
✅ Horodatage précis

6. Bonnes pratiques
✅ Aucune information sensible dans le code
✅ Variables d'environnement pour les secrets
✅ Gestion d'erreurs sans fuite d'information

Comptes de test
ADMIN    : admin@cse.com / admin123
MANAGER  : manager@cse.com / admin123
BENEFICIARY : user@cse.com / admin123

Structure du projet
cse-management-app/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── app.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── services/
│   │   └── App.tsx
│   └── package.json
├── database/
│   └── schema.sql
└── README.md
Workflow des demandes
DRAFT → SUBMITTED → APPROVED → PAID
              ↘ REJECTED ↗
