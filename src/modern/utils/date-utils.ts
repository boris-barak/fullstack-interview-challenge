import { format } from "date-fns";

export const toISOStringFromDate = (date: Date) => format(date, 'yyyy-MM-dd');

export const toDateFromISOString = (isoString: string) => new Date(isoString);

export const getNow = () => new Date();

export const cloneDate = (date: Date) => new Date(date);
