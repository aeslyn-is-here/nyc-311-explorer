import { useEffect, useState } from "react";
import apiClient from "../api/client";

export function useComplaintTypes() {
  const [complaintTypes, setComplaintTypes] = useState([]);

  useEffect(() => {
    const fetchComplaintTypes = async () => {
      const response = await apiClient.get("/api/complaint-types");
      setComplaintTypes(response.data);
    };

    fetchComplaintTypes();
  }, []);

  return complaintTypes;
}
