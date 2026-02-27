import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Box,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { getRequests, updateRequestStatus, submitRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LogoutButton from '../components/LogoutButton';
import HistoryIcon from '@mui/icons-material/History';
import HomeIcon from '@mui/icons-material/Home';

const RequestsList: React.FC = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await getRequests();
      
      // Filtrer les demandes selon le rôle
      let filteredRequests = data.data;
      
      if (user?.role === 'MANAGER') {
        // Manager voit tout SAUF les brouillons (DRAFT)
        filteredRequests = data.data.filter((req: any) => req.status !== 'DRAFT');
      } else if (user?.role === 'ADMIN') {
        // Admin voit tout SAUF les brouillons (DRAFT)
        filteredRequests = data.data.filter((req: any) => req.status !== 'DRAFT');
      } else if (user?.role === 'BENEFICIARY') {
        // Bénéficiaire voit ses propres demandes (déjà filtré par le backend)
        filteredRequests = data.data;
      }
      
      setRequests(filteredRequests);
    } catch (err) {
      setError('Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      DRAFT: 'default',
      SUBMITTED: 'info',
      APPROVED: 'success',
      REJECTED: 'error',
      PAID: 'secondary'
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status: string) => {
    const labels: any = {
      DRAFT: 'Brouillon',
      SUBMITTED: 'Soumise',
      APPROVED: 'Approuvée',
      REJECTED: 'Rejetée',
      PAID: 'Payée'
    };
    return labels[status] || status;
  };

  const handleSubmitRequest = async (id: number) => {
    try {
      await submitRequest(id);
      loadRequests();
    } catch (err) {
      alert('Erreur lors de la soumission');
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await updateRequestStatus(id, newStatus);
      loadRequests();
    } catch (err) {
      alert('Erreur mise à jour');
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <>
      <AppBar position="fixed" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Gestion des demandes
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>

            {user?.role === 'ADMIN' && (
              <Button
                component={Link}
                to="/transactions"
                color="primary"
                startIcon={<HistoryIcon />}
              >
                Historique
              </Button>
            )}

            {user?.role === 'BENEFICIARY' && (
              <Button
                component={Link}
                to="/requests/new"
                variant="contained"
                color="primary"
                startIcon={<HomeIcon />}
              >
                Nouvelle demande
              </Button>
            )}

            <LogoutButton />
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 12 }}>
        <Typography variant="h4" gutterBottom>
          Liste des demandes
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Montant</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((req: any) => (
                <TableRow key={req.id}>
                  <TableCell>{req.id}</TableCell>
                  <TableCell>{req.type}</TableCell>
                  <TableCell>{req.amount} €</TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(req.status)}
                      color={getStatusColor(req.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(req.created_at).toLocaleDateString()}</TableCell>

                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {user?.role === 'BENEFICIARY' && req.status === 'DRAFT' && (
                        <>
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            onClick={() => navigate(`/requests/edit/${req.id}`)}
                          >
                            Modifier
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={() => handleSubmitRequest(req.id)}
                          >
                            Soumettre
                          </Button>
                        </>
                      )}

                      {(user?.role === 'MANAGER' || user?.role === 'ADMIN') &&
                        req.status === 'SUBMITTED' && (
                          <>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => handleStatusChange(req.id, 'APPROVED')}
                            >
                              Approuver
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              color="error"
                              onClick={() => handleStatusChange(req.id, 'REJECTED')}
                            >
                              Rejeter
                            </Button>
                          </>
                        )}

                      {user?.role === 'ADMIN' && req.status === 'APPROVED' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="secondary"
                          onClick={() => handleStatusChange(req.id, 'PAID')}
                        >
                          Payer
                        </Button>
                      )}

                      {!(
                        (user?.role === 'BENEFICIARY' && req.status === 'DRAFT') ||
                        ((user?.role === 'MANAGER' || user?.role === 'ADMIN') && req.status === 'SUBMITTED') ||
                        (user?.role === 'ADMIN' && req.status === 'APPROVED')
                      ) && (
                          <Typography variant="body2" color="textSecondary">
                            Aucune action
                          </Typography>
                        )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </>
  );
};

export default RequestsList;