import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { 
  Container, 
  Paper, 
  Typography, 
  Grid,
  Alert 
} from '@mui/material';

interface SensorData {
  temperature: number;
  humidity: number;
  timestamp: string;
}

export default function Home() {
  const [data, setData] = useState<SensorData[]>([]);
  const [error, setError] = useState<string>('');
  const [ws, setWs] = useState<WebSocket | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://16.171.32.237:8000';
  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://16.171.32.237:8000';

  useEffect(() => {
    // Fetch initial data
    fetch(`${API_URL}/readings`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch data');
        return res.json();
      })
      .then(readings => setData(readings))
      .catch(err => setError('Failed to connect to server: ' + err.message));

    // Setup WebSocket
    const websocket = new WebSocket(`${WS_URL}/ws`);
    
    websocket.onmessage = (event) => {
      const newReading = JSON.parse(event.data);
      setData(prev => [...prev, newReading].slice(-100));
    };

    websocket.onerror = (event) => {
      setError('WebSocket connection error');
    };

    websocket.onclose = () => {
      setError('WebSocket connection closed');
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, []);

  return (
    <Container maxWidth="lg">
      <Typography variant="h3" gutterBottom>
        SHT31 Sensor Dashboard
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6">Temperature</Typography>
            <LineChart width={500} height={300} data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="temperature"
                stroke="#8884d8"
                dot={false}
              />
            </LineChart>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6">Humidity</Typography>
            <LineChart width={500} height={300} data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="humidity"
                stroke="#82ca9d"
                dot={false}
              />
            </LineChart>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
} 