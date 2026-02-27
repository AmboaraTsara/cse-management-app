import React, { useEffect, useState } from 'react';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Card,
    CardContent,
    Alert,
    CircularProgress,
    Box,
    Divider
} from '@mui/material';
import { getBudget, updateBudget, getRequests, updateRequestStatus } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import HistoryIcon from '@mui/icons-material/History';

interface Request {
    id: number;
    type: string;
    amount: number;
    description: string;
    status: string;
    created_at: string;
}

interface Budget {
    id: number;
    year: number;
    total_amount: number;
    remaining_amount: number;
}

const BudgetManager: React.FC = () => {
    const [budget, setBudget] = useState<Budget | null>(null);
    const [requests, setRequests] = useState<Request[]>([]);
    const [newTotal, setNewTotal] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [budgetRes, requestsRes] = await Promise.all([
                getBudget(),
                getRequests()
            ]);
            setBudget(budgetRes.data);
            setRequests(requestsRes.data);
        } catch (err) {
            setError('Erreur chargement');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateBudget = async () => {
        try {
            const amount = parseFloat(newTotal);
            if (isNaN(amount) || amount <= 0) {
                setError('Montant invalide');
                return;
            }
            const currentYear = budget?.year || new Date().getFullYear();

            await updateBudget(currentYear, {
                total_amount: amount,
                remaining_amount: amount
            });

            setSuccess('Budget mis à jour');
            loadData();
            setNewTotal('');
        } catch (err) {
            setError('Erreur mise à jour');
        }
    };

    const handlePayRequest = async (id: number) => {
        if (!budget) return;

        try {
            await updateRequestStatus(id, 'PAID');
            setSuccess('Paiement effectué');
            loadData();
        } catch (err) {
            setError('Erreur paiement');
        }
    };

    if (loading) return <CircularProgress />;

    const pendingPayments = requests.filter((r: Request) => r.status === 'APPROVED');

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Gestion du budget</Typography>
                
                {user?.role === 'ADMIN' && (
                    <Button
                        component={Link}
                        to="/transactions"
                        variant="contained"
                        color="primary"
                        startIcon={<HistoryIcon />}
                        size="large"
                    >
                        Voir l'historique des transactions
                    </Button>
                )}
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
                <Box sx={{ flex: '1 1 300px' }}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Budget annuel {budget?.year}
                            </Typography>
                            <Typography variant="h3">
                                {budget?.remaining_amount} €
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Sur {budget?.total_amount} € total
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>

                {user?.role === 'ADMIN' && (
                    <Box sx={{ flex: '2 1 500px' }}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>Mettre à jour le budget</Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    label="Nouveau montant total"
                                    type="number"
                                    value={newTotal}
                                    onChange={(e) => setNewTotal(e.target.value)}
                                    inputProps={{ min: 0 }}
                                    fullWidth
                                />
                                <Button
                                    variant="contained"
                                    onClick={handleUpdateBudget}
                                    disabled={!newTotal}
                                >
                                    Mettre à jour
                                </Button>
                            </Box>
                        </Paper>
                    </Box>
                )}
            </Box>

            {user?.role === 'ADMIN' && (
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Box sx={{ display: 'flex', gap: 4, justifyContent: 'space-around' }}>
                        <Box textAlign="center">
                            <Typography variant="h6">{pendingPayments.length}</Typography>
                            <Typography variant="body2" color="textSecondary">Paiements en attente</Typography>
                        </Box>
                        <Box textAlign="center">
                            <Typography variant="h6">
                                {requests.filter(r => r.status === 'PAID').length}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">Déjà payés</Typography>
                        </Box>
                        <Box textAlign="center">
                            <Typography variant="h6">{requests.length}</Typography>
                            <Typography variant="body2" color="textSecondary">Total demandes</Typography>
                        </Box>
                    </Box>
                </Paper>
            )}

            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Paiements en attente ({pendingPayments.length})
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {pendingPayments.length === 0 ? (
                    <Typography color="textSecondary">Aucun paiement en attente</Typography>
                ) : (
                    pendingPayments.map((req: Request) => (
                        <Box
                            key={req.id}
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                p: 2,
                                borderBottom: '1px solid #eee'
                            }}
                        >
                            <Box>
                                <Typography variant="subtitle1">{req.type}</Typography>
                                <Typography variant="body2" color="textSecondary">
                                    {req.description?.substring(0, 50)}...
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="h6">{req.amount} €</Typography>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    onClick={() => handlePayRequest(req.id)}
                                    disabled={!budget || budget.remaining_amount < req.amount}
                                >
                                    Payer
                                </Button>
                            </Box>
                        </Box>
                    ))
                )}
            </Paper>
        </Container>
    );
};

export default BudgetManager;