export default function formatValidationError(err: any) {
    const customError: any = {};

    for (const key in err.errors) {
        if (err.errors[key].properties && err.errors[key].properties.message) {
            customError[key] = err.errors[key].properties.message; // Get the custom message
        } else {
            customError[key] = err.errors[key].message; // Fallback to default error message
        }
    }

    return customError;
}
