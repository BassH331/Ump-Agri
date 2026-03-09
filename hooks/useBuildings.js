// hooks/useBuildings.js
import { useEffect, useState } from 'react';
import { fetchAllBuildings } from '../api/buildings';

export default function useBuildings() {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllBuildings()
      .then(setBuildings)
      .catch((err) => {
        console.error('Error fetching buildings:', err);
        setBuildings([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return { buildings, loading };
}
