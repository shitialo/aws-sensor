import { useEffect, useState } from 'react';
import { Line } from 'recharts';
import { 
  Container, 
  Paper, 
  Typography, 
  Grid 
} from '@mui/material';

interface SensorData {
  temperature: number;
  humidity: number;
  timestamp: string;
}

export default function Home() {
  const [data, setData] = useState<SensorData[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    // Fetch initial data
    fetch('http://16.171.32.237:8000/readings')
      .then(res => res.json())
      .then(readings => setData(readings));

    // Setup WebSocket
    const websocket = new WebSocket('ws://16.171.32.237:8000/ws');
    
    websocket.onmessage = (event) => {
      const newReading = JSON.parse(event.data);
      setData(prev => [...prev, newReading].slice(-100));
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
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6">Temperature</Typography>
            <Line
              data={data}
              dataKey="temperature"
              stroke="#8884d8"
            />
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6">Humidity</Typography>
            <Line
              data={data}
              dataKey="humidity"
              stroke="#82ca9d"
            />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
} 