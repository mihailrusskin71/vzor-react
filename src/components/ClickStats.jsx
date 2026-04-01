import React, { useState, useEffect } from 'react';

const ClickStats = ({ filmManager }) => {
  const [clicks, setClicks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClicks = async () => {
      try {
        const response = await fetch('https://qolbgrvlkadqnfnprbgr.supabase.co/rest/v1/clicks?order=created_at.desc&limit=100', {
          headers: {
            'apikey': filmManager.SUPABASE_KEY,
            'Authorization': `Bearer ${filmManager.SUPABASE_KEY}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setClicks(data);
        }
      } catch (error) {
        console.error('Error fetching clicks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClicks();
  }, []);

  return (
    <div>
      <h3>Последние клики</h3>
      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <table style={{ width: '100%', color: '#fff', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #444' }}>
              <th>Фильм</th>
              <th>Партнер</th>
              <th>Время</th>
              <th>User ID</th>
            </tr>
          </thead>
          <tbody>
            {clicks.map(click => (
              <tr key={click.id} style={{ borderBottom: '1px solid #333' }}>
                <td>{click.film_title}</td>
                <td>{click.partner}</td>
                <td>{new Date(click.created_at).toLocaleString()}</td>
                <td style={{ fontSize: '12px', color: '#aaa' }}>{click.user_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};