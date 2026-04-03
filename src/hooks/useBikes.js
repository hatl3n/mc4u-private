import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase";

function useBikes() {
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all bikes
  const fetchBikes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("bikes").select("*");
    if (error) {
      setError(error.message);
    } else {
      setBikes(data);
    }
    setLoading(false);
  }, []);

  // Search bikes by term
  const searchBikes = useCallback(async (term) => {
    if (!term || term.length < 2) {
      setBikes([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("bikes")
      .select("*")
      .or(`model.ilike.%${term}%,license_plate.ilike.%${term}%,vin.ilike.%${term}%,make.ilike.%${term}%`)
      .limit(10);
    if (error) {
      setError(error.message);
      setBikes([]);
    } else {
      setBikes(data);
    }
    setLoading(false);
  }, []);

  // Add a new bike
  const addBike = async (bike) => {
    setLoading(true);
    const { data, error } = await supabase.from("bikes").insert([bike]).select();
    if (error) {
      setError(error.message);
    } else {
      setBikes((prev) => [...prev, data[0]]);
    }
    setLoading(false);
    return { data, error };
  };

  // Update a bike
  const updateBike = async (id, updates) => {
    setLoading(true);
    const { data, error } = await supabase.from("bikes").update(updates).eq("id", id).select();
    if (error) {
      setError(error.message);
    } else {
      setBikes((prev) => prev.map((b) => (b.id === id ? data[0] : b)));
    }
    setLoading(false);
    return { data, error };
  };

  // Delete a bike
  const deleteBike = async (id) => {
    setLoading(true);
    const { error } = await supabase.from("bikes").delete().eq("id", id);
    if (error) {
      setError(error.message);
    } else {
      setBikes((prev) => prev.filter((b) => b.id !== id));
    }
    setLoading(false);
    return { error };
  };

  useEffect(() => {
    fetchBikes();
  }, [fetchBikes]);

  return {
    bikes,
    loading,
    error,
    fetchBikes,
    searchBikes,
    addBike,
    updateBike,
    deleteBike,
    setError,
  };
}

export default useBikes;
