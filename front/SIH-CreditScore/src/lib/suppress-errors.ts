// Disable Next.js error overlay in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // Override console.error to suppress Next.js overlay errors
    const originalError = console.error;
    console.error = (...args) => {
        // Filter out Next.js specific errors that trigger the overlay
        const errorString = args.join(' ');
        if (
            errorString.includes('Warning:') ||
            errorString.includes('React') ||
            errorString.includes('Hydration')
        ) {
            return; // Suppress these errors
        }
        originalError.apply(console, args);
    };

    // Disable the error overlay completely
    window.addEventListener('error', (e) => {
        e.stopImmediatePropagation();
    });

    window.addEventListener('unhandledrejection', (e) => {
        e.stopImmediatePropagation();
    });
}

export { };
