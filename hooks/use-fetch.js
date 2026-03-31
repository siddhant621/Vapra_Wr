import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

const useFetch = (cb) => {
  const [data, setData] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fn = useCallback(async (...args) => {
    if (!isMountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const response = await cb(...args);
      if (isMountedRef.current) {
        setData(response);
        setError(null);
      }
      return response;
    } catch (error) {
      if (isMountedRef.current) {
        setError(error);
      }
      toast.error(error?.message || "An error occurred");
      throw error;
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [cb]);

  return { data, loading, error, fn, setData };
};

export default useFetch;
