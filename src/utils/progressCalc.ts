export const progressCalcu = (
    progressNumber: number, 
    action: 'add' | 'remove', 
    value: number, 
    totalCapacity: number
): { 
    result: number, 
    color: string 
} =>  {
    if (action === 'add') {
        progressNumber = progressNumber + (((value === 0 ? 0 : value || 1) * 100) / totalCapacity);
    } else {
        progressNumber =  progressNumber - (((value === 0 ? 0 : value || 1) * 100) / totalCapacity);
    }

    return ({
        result: progressNumber,
        color: (
            Math.floor(progressNumber) >= 0 && 
            Math.floor(progressNumber) <= 30 ? 
            'rgba(227, 47, 47, 0.65)' :
            Math.floor(progressNumber) > 30 && 
            Math.floor(progressNumber) <= 59 ? 
            'rgba(179, 181, 16, 0.9)' :
            Math.floor(progressNumber) >= 60 && 
            Math.floor(progressNumber) <= 100 ? 
            'rgba(61, 203, 0, 0.63)' : 'rgba(227, 47, 47, 0.65)'
        )
    })
};