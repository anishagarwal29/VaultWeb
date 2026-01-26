import { useState, useEffect } from 'react';

export function useExchangeRates(baseCurrency: string) {
    const [rates, setRates] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRates = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Check if we have cached rates for today
                const cacheKey = `vault_rates_${baseCurrency}`;
                const cached = localStorage.getItem(cacheKey);
                const now = Date.now();

                if (cached) {
                    const { timestamp, data } = JSON.parse(cached);
                    // Cache for 1 hour
                    if (now - timestamp < 3600000) {
                        setRates(data);
                        setIsLoading(false);
                        return;
                    }
                }

                const res = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
                const data = await res.json();

                if (data && data.rates) {
                    setRates(data.rates);
                    localStorage.setItem(cacheKey, JSON.stringify({
                        timestamp: now,
                        data: data.rates
                    }));
                } else {
                    setError('Invalid data format');
                }
            } catch (err) {
                console.error("Failed to fetch rates", err);
                setError('Failed to fetch exchange rates');
            } finally {
                setIsLoading(false);
            }
        };

        if (baseCurrency) {
            fetchRates();
        }
    }, [baseCurrency]);

    return { rates, isLoading, error };
}
