# DataAnalyzer : frontend

Interface React de DataAnalyzer : chargement d'un dataset, configuration de l'analyse, résultats comparés et assistant ML.

## Fonctionnalités

- **Upload** par glisser-déposer, avec barre de progression.
- **Configuration** : aperçu du dataset, graphiques d'exploration, choix de la colonne cible, type de problème détecté (corrigeable), choix des algorithmes par carte.
- **Résultats** : score de chaque modèle, métriques, graphiques interactifs Plotly (matrice de confusion, courbe ROC, résidus, clusters, etc.), liste des modèles non entraînés.
- **Exports** : rapport PDF et notebook Jupyter.
- **Assistant ML** : bulle flottante sur toutes les pages. Réponses en flux, sources affichées, mode de réponse indiqué, vote sur chaque réponse.

## Structure du projet

```
frontend/
├── src/
│   ├── main.jsx             # point d'entrée (routeur et contexte)
│   ├── App.jsx              # routes et mise en page
│   ├── index.css            # thème et classes utilitaires
│   ├── api/client.js        # appels au backend
│   ├── context/
│   │   └── AnalysisContext.jsx  # dataset, configuration et résultats
│   ├── components/
│   │   ├── layout/          # barre de navigation et pied de page
│   │   ├── ui/              # Badge, Button, Card, Spinner
│   │   ├── charts/          # PlotlyChart
│   │   ├── results/         # MetricCard, ModelTabs
│   │   └── chat/            # ChatWidget (assistant)
│   └── pages/
│       ├── Home.jsx         # upload
│       ├── Configure.jsx    # configuration de l'analyse
│       └── Results.jsx      # résultats
└── package.json
```

## Prérequis

- Node.js 18 ou plus récent
- Le backend lancé sur `http://127.0.0.1:8000` (voir `backend/README.md`)

## Installation

```powershell
cd D:\DataAnalyzer\frontend
npm install
```

## Configuration

L'adresse du backend est `http://127.0.0.1:8000` par défaut. Pour la changer, créez `frontend/.env` :

```
VITE_API_URL=http://127.0.0.1:8000
```

Redémarrez ensuite le serveur de développement.

## Lancement

```powershell
npm run dev
```

L'application est disponible sur http://localhost:5173.

## Utilisation

1. **Upload** : déposez un fichier CSV ou XLSX (20 Mo maximum), ou cliquez sur « Choisir un fichier ».
2. **Configuration** : vérifiez l'aperçu et les graphiques d'exploration, puis choisissez la colonne à prédire. Laissez-la vide pour un clustering. Le type détecté peut être corrigé. Cochez éventuellement des algorithmes : sans sélection, tous sont lancés.
3. **Résultats** : comparez les modèles dans la liste, consultez le score et les métriques de chacun, puis les graphiques. Le trophée indique le meilleur modèle.
4. **Exports** : « Télécharger le PDF » produit le rapport, « Exporter le notebook » produit un fichier `.ipynb` exécutable.
5. **Assistant** : cliquez sur la bulle violette en bas à droite. Posez une question sur le machine learning ou sur l'application. Sur la page Résultats, l'assistant connaît votre analyse. Le corbeille efface la conversation. Les pouces permettent de signaler une bonne ou une mauvaise réponse.

## Structure des données côté navigateur

- Le dataset chargé est conservé dans `sessionStorage` : un rechargement de la page le garde.
- Les résultats d'analyse ne sont conservés qu'en mémoire : un rechargement de `/resultats` renvoie à l'accueil. Relancez l'analyse ou reprenez depuis la configuration.

## Dépannage

- **« Impossible de joindre le serveur »** : le backend n'est pas lancé, ou l'adresse dans `VITE_API_URL` est fausse.
- **Erreur CORS dans la console** : ajoutez l'adresse du frontend dans `CORS_ORIGINS` du fichier `.env` du backend.
- **La bulle de l'assistant ne répond pas** : vérifiez la clé `GROQ_API_KEY` dans le `.env` du backend, et consultez la console uvicorn.