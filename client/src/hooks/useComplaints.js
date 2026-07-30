import { useState } from "react";
import apiClient from "../api/client";

export function useComplaints() {
  const [complaints, setComplaints] = useState([]);

  const searchComplaints = async (zip, complaintType) => {
    const response = await apiClient.get("/api/complaints", {
      params: { zip, complaintType },
    });

    setComplaints(response.data);
  };

  const clearComplaints = () => setComplaints([]);

  return { complaints, searchComplaints, clearComplaints };
}
