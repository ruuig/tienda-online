import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import axios from 'axios';

export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getToken } = useAppContext();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const timestamp = new Date().getTime();
      const { data } = await axios.get(`/api/category/list?t=${timestamp}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (data.success) {
        setCategories(data.categories);
        setError(null);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError(error.message);
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return { categories, loading, error, refetch: fetchCategories };
};
