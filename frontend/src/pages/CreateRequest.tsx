import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  Alert,
  Box
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { createRequest, getRequestById, updateRequest } from '../services/api';

const requestTypes = [
  'Aide scolaire',
  'Aide médicale',
  'Aide sociale',
  'Culture & loisirs',
  'Vacances',
  'Autre'
];

const CreateRequest: React.FC = () => {
  const { id } = useParams(); 
  const [formData, setFormData] = useState({
    type: '',
    amount: '',
    description: '',
    status: 'DRAFT'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (id) {
      loadRequest();
    }
  }, [id]);

  const loadRequest = async () => {
    try {
      setLoading(true);
      if (!id) return;
      const data = await getRequestById(parseInt(id));

      if (data.data.status !== 'DRAFT') {
        setError('Cette demande ne peut plus être modifiée');
        setTimeout(() => navigate('/requests'), 2000);
        return;
      }

      setFormData({
        type: data.data.type,
        amount: data.data.amount.toString(),
        description: data.data.description || '',
        status: data.data.status
      });
      setIsEditing(true);
    } catch (err) {
      setError('Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const requestData = {
        type: formData.type,
        amount: parseFloat(formData.amount),
        description: formData.description,
        status: formData.status as "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "PAID" 
      };

      if (isEditing) {
        if (!id) return;
        await updateRequest(parseInt(id), requestData);
        setSuccessMessage('Demande mise à jour !');
        setSuccess(true);
      } else {
        await createRequest(requestData);
        setSuccessMessage('Demande créée !');
        setSuccess(true);
      }

      setTimeout(() => navigate('/requests'), 2000);
    } catch (err) {
      setError(isEditing ? 'Erreur lors de la mise à jour' : 'Erreur lors de la création');
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          {isEditing ? 'Modifier la demande' : 'Nouvelle demande d\'aide'}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {isEditing ? 'Demande mise à jour !' : 'Demande créée !'}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            select
            fullWidth
            label="Type d'aide"
            name="type"
            value={formData.type}
            onChange={handleChange}
            margin="normal"
            required
          >
            {requestTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            label="Montant (€)"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleChange}
            margin="normal"
            required
            inputProps={{ min: 0.01, step: 0.01 }}
          />

          <TextField
            fullWidth
            label="Description"
            name="description"
            multiline
            rows={4}
            value={formData.description}
            onChange={handleChange}
            margin="normal"
          />

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
            >
              {isEditing ? 'Mettre à jour' : 'Créer la demande'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/requests')}
              fullWidth
            >
              Annuler
            </Button>
          </Box>

          {isEditing && (
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 2 }}>
              * Vous pouvez modifier cette demande tant qu'elle est en brouillon
            </Typography>
          )}
        </form>
      </Paper>
    </Container>
  );
};

export default CreateRequest;