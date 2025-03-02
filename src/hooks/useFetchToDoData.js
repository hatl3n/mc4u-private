import { useState, useEffect } from "react";
import { supabase } from "../supabase";

function useFetchToDoData() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    const { data: tableData, error } = await supabase
      .from("todo_list")
      .select("*");

    if (error) {
      setError(error.message);
    } else {
      setData(tableData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, fetchData };
}

export default useFetchToDoData;