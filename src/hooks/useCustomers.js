import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase";

function useCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all customers
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("customers").select("*");
    if (error) {
      setError(error.message);
    } else {
      setCustomers(data);
    }
    setLoading(false);
  }, []);

  // Search customers by term
  const searchCustomers = useCallback(async (term) => {
    if (!term || term.length < 2) {
      setCustomers([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .or(`name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`)
      .limit(10);
    if (error) {
      setError(error.message);
      setCustomers([]);
    } else {
      setCustomers(data);
    }
    setLoading(false);
  }, []);

  // Add a new customer
  const addCustomer = async (customer) => {
    setLoading(true);
    const { data, error } = await supabase.from("customers").insert([customer]).select();
    if (error) {
      setError(error.message);
    } else {
      setCustomers((prev) => [...prev, data[0]]);
    }
    setLoading(false);
    return { data, error };
  };

  // Update a customer
  const updateCustomer = async (id, updates) => {
    setLoading(true);
    const { data, error } = await supabase.from("customers").update(updates).eq("id", id).select();
    if (error) {
      setError(error.message);
    } else {
      setCustomers((prev) => prev.map((c) => (c.id === id ? data[0] : c)));
    }
    setLoading(false);
    return { data, error };
  };

  // Delete a customer
  const deleteCustomer = async (id) => {
    setLoading(true);
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) {
      setError(error.message);
    } else {
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    }
    setLoading(false);
    return { error };
  };

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return {
    customers,
    loading,
    error,
    fetchCustomers,
    searchCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    setError,
  };
}

export default useCustomers;
