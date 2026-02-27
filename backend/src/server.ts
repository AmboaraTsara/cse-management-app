import app from './app';
import dotenv from 'dotenv';
import { testDatabaseConnection } from './utils/dbUtils';

dotenv.config();

const PORT = process.env.PORT || 5000;

testDatabaseConnection().then((connected) => {
  if (connected) {
    app.listen(PORT, () => {
      console.log(`Serveur démarré sur http://localhost:${PORT}`);
      console.log(`Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`JWT Secret: ${process.env.JWT_SECRET ? 'Configuré' : 'MANQUANT'}`);
    });
  } else {
    console.error('Impossible de démarrer le serveur: erreur DB');
    process.exit(1);
  }
});
