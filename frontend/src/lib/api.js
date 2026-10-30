import axios from 'axios';
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', timeout: 10000 });
export const savedOwners = () => { try { return JSON.parse(localStorage.getItem('linkcraft:owners') || '[]'); } catch { return []; } };
export const saveOwner = (alias, token) => { const list = savedOwners().filter(x => x.alias !== alias); list.unshift({ alias, token }); localStorage.setItem('linkcraft:owners', JSON.stringify(list.slice(0, 200))); };
export const removeOwner = alias => localStorage.setItem('linkcraft:owners', JSON.stringify(savedOwners().filter(x => x.alias !== alias)));
export const ownerHeaders = alias => ({ 'X-Link-Owner': savedOwners().find(x => x.alias === alias)?.token || '' });
export const ownersHeader = () => ({ 'X-Link-Owners': JSON.stringify(savedOwners()) });
export function messageFromError(error) { return error?.response?.data?.error?.message || error?.message || 'Something went wrong. Please try again.'; }
