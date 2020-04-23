export const timeFormat = (timestamp: number) => {
    const t = new Date(timestamp); 
    return `${t.toLocaleDateString()} - ${t.toLocaleTimeString()}`;
}