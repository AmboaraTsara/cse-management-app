
# Journal de travail - Application CSE

## Développement
- **Date** : 24-26 février 2026
- **Durée totale** : Environ 8 heures de développement effectif
- **Contexte** : Développement réalisé en local avec une coupure de courant de 20h

## Fonctionnalités développées

### Backend
- ✅ Authentification JWT avec bcrypt
- ✅ RBAC (rôles ADMIN/MANAGER/BENEFICIARY)
- ✅ CRUD des demandes avec workflow (DRAFT → SUBMITTED → APPROVED/REJECTED → PAID)
- ✅ Gestion du budget avec vérification automatique
- ✅ Audit log de toutes les actions
- ✅ Validation des entrées

### Frontend
- ✅ Page de connexion
- ✅ Liste des demandes avec actions selon le rôle
- ✅ Formulaire de création de demande
- ✅ Interface de gestion du budget (admin)
- ✅ Intégration API avec Axios
- ✅ Historiques de validation

## Difficultés rencontrées
- Coupure de courant de 20h pendant le développement
- Gestion des transitions d'état côté backend
- Validation des règles métier (budget, statuts)

## Solutions apportées
- Développement en local puis structuration du code final
- 
## Résultat
- Application fonctionnelle avec toutes les fonctionnalités demandées

## Améliorations possibles
- Tests unitaires
- Pagination des résultats
- Notifications 
