import { useEffect, useState, Ref, RefCallback, useCallback } from 'react';

type FetchState<T> = {
    data: T | null;
    loading: boolean;
    error: string | null;
};

function useFetch<T>(url: string, parse: (response: Response) => Promise<T>) {
    const [state, setState] = useState<FetchState<T>>({
        data: null,
        loading: true,
        error: null,
    });

    useEffect(() => {
        (async () => {
            setState({ data: null, loading: true, error: null });

            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Unable to fetch (${response.status})`);
                }

                const data = await parse(response);

                setState({ data, loading: false, error: null });
            } catch (error) {
                setState({
                    data: null,
                    loading: false,
                    error: 'Failed to fetch data'

                });
            }
        })();

    }, [url]);
    
    return state;
}

function useMergedRef<T>(...refs: (Ref<T> | undefined)[]): RefCallback<T> {
    return useCallback((current: T | null) => {
        const cleanups: [number, () => void][] = [];

        refs.forEach((ref, index) => {
            if (typeof ref === 'function') {
                const cleanup = ref(current);
                if (typeof cleanup === 'function') {
                    cleanups.push([index, cleanup]);
                }
            } else if (typeof ref === 'object' && ref !== null) {
                ref.current = current;
            }
        });

        if (cleanups.length === 0) {
            return;
        }

        return () => {
            let cleanupIndex = 0;
            refs.forEach((ref, index) => {
                if (cleanups[cleanupIndex]?.[0] === index) {
                    cleanups[cleanupIndex][1]();
                    cleanupIndex++;
                } else if (typeof ref === 'function') {
                    ref(null);
                } else if (typeof ref === 'object' && ref !== null) {
                    ref.current = null;
                }
            });
        };
    }, refs);
}

function setRef<T>(ref: Ref<T> | undefined, current: T | null) {
    if (typeof ref === 'function') {
        ref(current);
    } else if (typeof ref === 'object' && ref !== null) {
        ref.current = current;
    }
}

const promisesByKey: Record<string, Promise<any> | null> = {};
function createWaitingExecutor<A extends unknown[], R>(key: string, func: (...args: A) => Promise<R>): (...args: A) => Promise<R> {
	return (waitAndExecute as typeof waitAndExecute<A, R>).bind(null, key, func);
}
function createSkippingExecutor<A extends unknown[], R>(key: string, func: (...args: A) => Promise<R>): (...args: A) => Promise<R | undefined> {
	return (skipOrExecute as typeof skipOrExecute<A, R>).bind(null, key, func);
}
async function waitAndExecute<A extends unknown[], R>(key: string, func: (...args: A) => Promise<R>, ...args: A): Promise<R> {
    while (promisesByKey[key]) {
        try {
            await promisesByKey[key];
        } catch {}
    }

    return promisesByKey[key] = func(...args).finally(() => { promisesByKey[key] = null; });
}
async function skipOrExecute<A extends unknown[], R>(key: string, func: (...args: A) => Promise<R>, ...args: A): Promise<R | undefined> {
    if (promisesByKey[key]) {
        return;
    }

    return promisesByKey[key] = func(...args).finally(() => { promisesByKey[key] = null; });
}

const Utils = {
    useFetch,
    useMergedRef,
    setRef,
    createWaitingExecutor,
    createSkippingExecutor,
    waitAndExecute,
    skipOrExecute,
}


export default Utils;