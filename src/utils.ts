// If patient has 3 or more completed procedures → 10% discount
export function calculateProcedureDiscount(
    completedProceduresCount: number 
): number {
    if (completedProceduresCount >= 3) {
        return 10;
    }
    return 0;
}
