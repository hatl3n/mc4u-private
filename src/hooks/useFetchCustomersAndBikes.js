import { useState, useEffect } from "react";
import { supabase } from "../supabase";

function useFetchCustomersAndBikes() {
  const [customers, setCustomers] = useState([]);
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCustomerData = async () => {
    const { data: customerData, error } = await supabase
      .from("customers")
      .select("id, name, phone");
    if (error) {
      setError(error.message);
    } else {
      setCustomers(customerData);
    }
  };

  const fetchBikesData = async () => {
    const { data: bikesData, error } = await supabase
      .from("bikes")
      .select("id, license_plate, make, model, model_year");
    if (error) {
      setError(error.message);
    } else {
      setBikes(bikesData);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await fetchCustomerData();
      await fetchBikesData();
      setLoading(false);
    };
    fetchData();
  }, []);

  return { customers, bikes, loading, setLoading, error };
}

export default useFetchCustomersAndBikes;
