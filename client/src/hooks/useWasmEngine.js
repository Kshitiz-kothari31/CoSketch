import { useState, useEffect } from 'react';
import createWhiteboardModule from '../wasm/whiteboard.js';

export function useWasmEngine() {
  const [engine, setEngine] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadEngine() {
      try {
        // Asynchronously instantiate the C++ module
        const Module = await createWhiteboardModule();
        
        // Artificial delay so we can admire the C++ loading screen!
        await new Promise(resolve => setTimeout(resolve, 800));

        if (isMounted) {
          // Instantiate the specific C++ class we wrote
          const instance = new Module.WhiteboardManager();
          setEngine({ instance, Module });
          setIsReady(true);
        }
      } catch (error) {
        console.error("Failed to load Wasm CRDT Engine:", error);
      }
    }
    
    loadEngine();

    return () => {
      isMounted = false;
      // Note: In a production app, you might want to call instance.delete() here
      // to free up C++ memory if the component is unmounted.
    };
  }, []);

  return { engine, isReady };
}
