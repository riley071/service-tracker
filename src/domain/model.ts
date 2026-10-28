// Services also accept custom names, preserved with the quotation or job.
export type Trade = string;
export const serviceGroups = [
  { label: "Digital & creative", items: ["Web development", "Mobile app development", "Software development", "Graphic design", "Logo & brand design", "UI/UX design", "Photography", "Videography", "Video editing", "Animation", "Illustration", "Music & audio production"] },
  { label: "Freelance & business", items: ["Copywriting", "Content writing", "Editing & proofreading", "Translation", "Transcription", "Social media management", "Digital marketing", "SEO", "Virtual assistance", "Data entry", "Bookkeeping", "Accounting", "Business consulting", "Tutoring", "Training", "IT support", "Computer repair", "Research"] },
  { label: "Trades & manual labour", items: ["Painting", "Construction", "Bricklaying", "Plastering", "Roofing", "Tiling", "Flooring", "Cleaning", "Welding", "Electrical", "Plumbing", "Carpentry", "Furniture assembly", "Gardening", "Landscaping", "Lawn care", "Tree cutting", "General labour", "Handyman", "Moving & removals", "Loading & unloading", "Delivery & courier", "Waste removal", "Pest control", "Appliance repair", "Air conditioning & refrigeration", "Solar installation", "Vehicle repair", "Car washing", "Farm labour", "Borehole & water pump services"] },
  { label: "Personal & event services", items: ["Catering", "Baking", "Event planning", "Event decoration", "DJ services", "Tailoring & alterations", "Hairdressing", "Makeup & beauty", "Laundry & ironing", "Upholstery"] },
];
export const trades: Trade[] = [...serviceGroups.flatMap(group => group.items), "Other"];
export type Customer = {
  id: string;
  name: string;
  phone: string;
  site: string;
};
export type QuoteLine = {
  id: string;
  description: string;
  quantity: string;
  unit: string;
  price: string;
};
export type Quote = {
  id: string;
  customerId: string;
  title: string;
  trade: Trade;
  lines: QuoteLine[];
  discount: string;
  createdAt: string;
  status: "Draft";
};
export type JobStatus = "Scheduled" | "In progress" | "On hold" | "Completed";
export const jobStatuses: JobStatus[] = [
  "Scheduled",
  "In progress",
  "On hold",
  "Completed",
];
export type Job = {
  id: string;
  customerId: string;
  title: string;
  trade: Trade;
  due: string;
  status: JobStatus;
  note: string;
};
export type AppData = {
  payments?: Payment[];
  preferences?: { paymentMethod: string; paymentPhone: string; dueDays: string; compact: boolean };
  planRequest?: { plan: string; annual: boolean; requestedAt: string };
  version: 1;
  business?: Business;
  invoices?: Invoice[];
  customers: Customer[];
  quotes: Quote[];
  jobs: Job[];
};
export type Payment = { id: string; invoiceId: string; amount: string; date: string; method: string; reference: string };
export type Business = {
  name: string;
  owner: string;
  phone: string;
  email: string;
  address: string;
  registration: string;
  logo?: string;
  paymentDetails: string;
  terms: string;
};
export type Invoice = {
  id: string;
  number: string;
  quoteId?: string;
  title: string;
  lines: QuoteLine[];
  discount: string;
  issuedOn: string;
  due: string;
  business: Business;
  customer: Customer;
};
export function id() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
export function normalisePhone(raw: string): string {
  const phone = raw.replace(/[\s()-]/g, "");
  if (/^0[189]\d{8}$/.test(phone)) return "+265" + phone.slice(1);
  if (/^265[189]\d{8}$/.test(phone)) return "+" + phone;
  if (/^\+[1-9]\d{7,14}$/.test(phone)) return phone;
  throw new Error(
    "Enter a valid phone number, for example 0881 234 567 or +265881234567.",
  );
}
export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T12:00:00Z");
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}
